const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  targetResult,
  certification
}=require("./dr");
const {MemoryDRSimulationAdapter}=require("./simulator");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const simulator=new MemoryDRSimulationAdapter();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:80,
  service:"dr-rehearsal"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/dr/targets",async(req,res)=>{
  const {
    serviceName,
    rtoTargetSeconds,
    rpoTargetSeconds
  }=req.body||{};

  if(!serviceName||
     rtoTargetSeconds===undefined||
     rpoTargetSeconds===undefined)
    return res.status(400).json({
      error:"serviceName, rtoTargetSeconds and rpoTargetSeconds are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO dr_recovery_targets
        (service_name,rto_target_seconds,rpo_target_seconds)
      VALUES($1,$2,$3)
      ON CONFLICT(service_name)
      DO UPDATE SET
        rto_target_seconds=EXCLUDED.rto_target_seconds,
        rpo_target_seconds=EXCLUDED.rpo_target_seconds,
        enabled=true
      RETURNING *
    `,[
      serviceName,
      Number(rtoTargetSeconds),
      Number(rpoTargetSeconds)
    ]);

    res.status(201).json({target:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not save DR target"
    });
  }
});

app.post("/api/dr/rehearsals",async(req,res)=>{
  const {
    rehearsalName,
    sourceRegion="primary",
    targetRegion="recovery",
    notes=""
  }=req.body||{};

  if(!rehearsalName)
    return res.status(400).json({
      error:"rehearsalName is required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO dr_rehearsals
        (rehearsal_name,source_region,target_region,notes)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      rehearsalName,
      sourceRegion,
      targetRegion,
      notes
    ]);

    res.status(201).json({rehearsal:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not create DR rehearsal"
    });
  }
});

app.post("/api/dr/rehearsals/:id/run",async(req,res)=>{
  const {
    serviceName,
    backupTimestamp,
    recoveryTimestamp,
    completedAt,
    rtoTargetSeconds,
    rpoTargetSeconds
  }=req.body||{};

  if(!serviceName||
     !backupTimestamp||
     !recoveryTimestamp||
     !completedAt)
    return res.status(400).json({
      error:"Service and recovery timestamps are required"
    });

  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const rehearsal=(await client.query(`
      SELECT *
      FROM dr_rehearsals
      WHERE id=$1
      FOR UPDATE
    `,[req.params.id])).rows[0];

    if(!rehearsal){
      await client.query("ROLLBACK");
      return res.status(404).json({
        error:"Rehearsal not found"
      });
    }

    await client.query(`
      UPDATE dr_rehearsals
      SET status='RUNNING'
      WHERE id=$1
    `,[req.params.id]);

    const checks={
      snapshot:await simulator.validateSnapshot(),
      restore:await simulator.restore(),
      integrity:await simulator.verifyIntegrity(),
      providerReconnect:await simulator.reconnectProviders()
    };

    const metrics=require("./dr").measureRecovery({
      startedAt:rehearsal.started_at,
      completedAt,
      backupTimestamp,
      recoveryTimestamp
    });

    const targets=targetResult({
      rtoSeconds:metrics.rtoSeconds,
      rpoSeconds:metrics.rpoSeconds,
      rtoTargetSeconds,
      rpoTargetSeconds
    });

    const result=certification({
      snapshotValid:checks.snapshot.passed,
      restoreValid:checks.restore.passed,
      integrityValid:checks.integrity.passed,
      providerReconnectValid:checks.providerReconnect.passed,
      rtoPass:targets.rtoPass,
      rpoPass:targets.rpoPass
    });

    for(const [type,check] of Object.entries(checks)){
      await client.query(`
        INSERT INTO dr_rehearsal_checks
          (rehearsal_id,check_type,passed,observed_value)
        VALUES($1,$2,$3,$4)
      `,[
        req.params.id,
        type,
        check.passed,
        check.observed
      ]);
    }

    await client.query(`
      INSERT INTO dr_rehearsal_checks
        (rehearsal_id,check_type,passed,
         observed_value,expected_value)
      VALUES
        ($1,'RTO',$2,$3,$4),
        ($1,'RPO',$5,$6,$7)
    `,[
      req.params.id,
      targets.rtoPass,
      String(metrics.rtoSeconds),
      String(rtoTargetSeconds),
      targets.rpoPass,
      String(metrics.rpoSeconds),
      String(rpoTargetSeconds)
    ]);

    const status=result.certified?"PASSED":"FAILED";

    const {rows}=await client.query(`
      UPDATE dr_rehearsals
      SET status=$2,
          completed_at=$3,
          rto_seconds=$4,
          rpo_seconds=$5
      WHERE id=$1
      RETURNING *
    `,[
      req.params.id,
      status,
      completedAt,
      metrics.rtoSeconds,
      metrics.rpoSeconds
    ]);

    await client.query("COMMIT");

    res.json({
      rehearsal:rows[0],
      checks,
      metrics,
      targets,
      certification:result
    });
  }catch{
    await client.query("ROLLBACK");
    res.status(500).json({
      error:"DR rehearsal failed"
    });
  }finally{
    client.release();
  }
});

app.get("/api/dr/rehearsals",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM dr_rehearsals
      ORDER BY started_at DESC
      LIMIT 100
    `);

    res.json({rehearsals:rows});
  }catch{
    res.status(500).json({
      error:"Could not load DR rehearsals"
    });
  }
});

app.get("/api/dr/rehearsals/:id/checks",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM dr_rehearsal_checks
      WHERE rehearsal_id=$1
      ORDER BY checked_at ASC
    `,[req.params.id]);

    res.json({checks:rows});
  }catch{
    res.status(500).json({
      error:"Could not load DR checks"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 80 DR Rehearsal API running"
));


module.exports = app;
