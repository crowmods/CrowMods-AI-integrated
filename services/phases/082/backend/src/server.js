const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  MemoryReplicationProvider,
  MemoryTrafficProvider
}=require("./adapters");
const {
  canStart,
  reportFromSteps
}=require("./gameday");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const replication=new MemoryReplicationProvider();
const traffic=new MemoryTrafficProvider();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:82,
  service:"dr-gameday"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/gamedays",async(req,res)=>{
  const {
    name,
    environment="simulation",
    dryRun=true,
    notes=""
  }=req.body||{};

  if(!name)
    return res.status(400).json({
      error:"name is required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO gamedays
        (name,environment,dry_run,notes)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      name,
      environment,
      Boolean(dryRun),
      notes
    ]);

    const steps=[
      "REPLICATION_CHECK",
      "TRAFFIC_DRY_RUN",
      "CHECKPOINT",
      "TRAFFIC_SHIFT",
      "RECOVERY_VALIDATION",
      "FAILBACK_CHECK"
    ];

    for(let i=0;i<steps.length;i++){
      await pool.query(`
        INSERT INTO gameday_steps
          (gameday_id,step_order,step_name)
        VALUES($1,$2,$3)
      `,[
        rows[0].id,
        i+1,
        steps[i]
      ]);
    }

    res.status(201).json({gameday:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not create game day"
    });
  }
});

app.post("/api/gamedays/:id/approve",async(req,res)=>{
  const {requestedBy,approvedBy}=req.body||{};

  if(!requestedBy||!approvedBy)
    return res.status(400).json({
      error:"requestedBy and approvedBy are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO gameday_approvals
        (gameday_id,requested_by,approved_by,status,decided_at)
      VALUES($1,$2,$3,'APPROVED',NOW())
      RETURNING *
    `,[
      req.params.id,
      requestedBy,
      approvedBy
    ]);

    res.status(201).json({approval:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not approve game day"
    });
  }
});

app.post("/api/gamedays/:id/run",async(req,res)=>{
  const {
    sourceRegion="primary",
    targetRegion="recovery"
  }=req.body||{};

  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const gameday=(await client.query(`
      SELECT *
      FROM gamedays
      WHERE id=$1
      FOR UPDATE
    `,[req.params.id])).rows[0];

    if(!gameday){
      await client.query("ROLLBACK");
      return res.status(404).json({
        error:"Game day not found"
      });
    }

    const approval=(await client.query(`
      SELECT *
      FROM gameday_approvals
      WHERE gameday_id=$1 AND status='APPROVED'
      ORDER BY decided_at DESC
      LIMIT 1
    `,[req.params.id])).rows[0];

    const replicationHealth=await replication.health();
    const trafficHealth=await traffic.health();

    const startAllowed=canStart({
      approved:Boolean(approval),
      replicationHealthy:replicationHealth.healthy,
      trafficHealthy:trafficHealth.healthy,
      dryRun:gameday.dry_run,
      environment:gameday.environment
    });

    if(!startAllowed){
      await client.query(`
        UPDATE gamedays
        SET status='FAILED',completed_at=NOW()
        WHERE id=$1
      `,[req.params.id]);

      await client.query("COMMIT");

      return res.status(409).json({
        error:"Game day prerequisites failed"
      });
    }

    await client.query(`
      UPDATE gamedays
      SET status='RUNNING',started_at=NOW()
      WHERE id=$1
    `,[req.params.id]);

    const lag=await replication.getLag(
      sourceRegion,
      targetRegion
    );

    const checkpoint=await replication.checkpoint(
      sourceRegion,
      targetRegion
    );

    const dryRun=await traffic.dryRun(
      sourceRegion,
      targetRegion
    );

    const shift=await traffic.shift(
      sourceRegion,
      targetRegion
    );

    const rollback=await traffic.rollback(
      targetRegion,
      sourceRegion
    );

    const results=[
      {
        order:1,
        name:"REPLICATION_CHECK",
        passed:replicationHealth.healthy&&lag.healthy,
        details:lag
      },
      {
        order:2,
        name:"TRAFFIC_DRY_RUN",
        passed:dryRun.valid,
        details:dryRun
      },
      {
        order:3,
        name:"CHECKPOINT",
        passed:checkpoint.created,
        details:checkpoint
      },
      {
        order:4,
        name:"TRAFFIC_SHIFT",
        passed:shift.shifted,
        details:shift
      },
      {
        order:5,
        name:"RECOVERY_VALIDATION",
        passed:trafficHealth.healthy,
        details:trafficHealth
      },
      {
        order:6,
        name:"FAILBACK_CHECK",
        passed:rollback.rolledBack,
        details:rollback
      }
    ];

    for(const result of results){
      await client.query(`
        UPDATE gameday_steps
        SET status=$3,
            checkpoint=$4,
            details=$5,
            started_at=COALESCE(started_at,NOW()),
            completed_at=NOW()
        WHERE gameday_id=$1 AND step_order=$2
      `,[
        req.params.id,
        result.order,
        result.passed?"PASSED":"FAILED",
        result.name,
        JSON.stringify(result.details)
      ]);
    }

    const report=reportFromSteps(
      results.map(r=>({
        status:r.passed?"PASSED":"FAILED"
      }))
    );

    const status=report.overallPassed?"PASSED":"FAILED";

    await client.query(`
      UPDATE gamedays
      SET status=$2,completed_at=NOW()
      WHERE id=$1
    `,[req.params.id,status]);

    const {rows}=await client.query(`
      INSERT INTO gameday_reports
        (gameday_id,passed_steps,failed_steps,
         rollback_count,report)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      req.params.id,
      report.passedSteps,
      report.failedSteps,
      report.rollbackCount,
      JSON.stringify({
        sourceRegion,
        targetRegion,
        results
      })
    ]);

    await client.query("COMMIT");

    res.json({
      status,
      report:rows[0],
      results
    });
  }catch{
    await client.query("ROLLBACK");
    res.status(500).json({
      error:"Game day execution failed"
    });
  }finally{
    client.release();
  }
});

app.get("/api/gamedays",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM gamedays
      ORDER BY COALESCE(started_at,created_at) DESC
      LIMIT 100
    `);

    res.json({gamedays:rows});
  }catch{
    res.status(500).json({
      error:"Could not load game days"
    });
  }
});

app.get("/api/gamedays/:id/report",async(req,res)=>{
  try{
    const [gameday,steps,approvals,report]=await Promise.all([
      pool.query(`
        SELECT *
        FROM gamedays
        WHERE id=$1
      `,[req.params.id]),
      pool.query(`
        SELECT *
        FROM gameday_steps
        WHERE gameday_id=$1
        ORDER BY step_order
      `,[req.params.id]),
      pool.query(`
        SELECT *
        FROM gameday_approvals
        WHERE gameday_id=$1
        ORDER BY created_at DESC
      `,[req.params.id]),
      pool.query(`
        SELECT *
        FROM gameday_reports
        WHERE gameday_id=$1
        ORDER BY created_at DESC
        LIMIT 1
      `,[req.params.id])
    ]);

    res.json({
      gameday:gameday.rows[0]||null,
      steps:steps.rows,
      approvals:approvals.rows,
      report:report.rows[0]||null
    });
  }catch{
    res.status(500).json({
      error:"Could not load game day report"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 82 DR Game Day API running"
));


module.exports = app;
