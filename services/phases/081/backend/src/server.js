const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  replicationHealthy,
  regionHealth,
  chooseRecoveryRegion,
  failbackReady
}=require("./cross-region");
const {
  MemoryTrafficFailoverAdapter
}=require("./simulator");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const traffic=new MemoryTrafficFailoverAdapter();

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:81,
  service:"cross-region"
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true});
  }catch{
    res.status(503).json({ready:false});
  }
});

app.post("/api/regions",async(req,res)=>{
  const {
    regionName,
    role="SECONDARY"
  }=req.body||{};

  if(!regionName)
    return res.status(400).json({
      error:"regionName is required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO regions(region_name,role)
      VALUES($1,$2)
      ON CONFLICT(region_name)
      DO UPDATE SET role=EXCLUDED.role,enabled=true
      RETURNING *
    `,[regionName,role]);

    res.status(201).json({region:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not save region"
    });
  }
});

app.post("/api/replication/sample",async(req,res)=>{
  const {
    sourceRegion,
    targetRegion,
    lagSeconds,
    maxLagSeconds=60
  }=req.body||{};

  if(!sourceRegion||
     !targetRegion||
     lagSeconds===undefined)
    return res.status(400).json({
      error:"sourceRegion, targetRegion and lagSeconds are required"
    });

  const healthy=replicationHealthy({
    lagSeconds,
    maxLagSeconds
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO replication_samples
        (source_region,target_region,
         replication_lag_seconds,healthy)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      sourceRegion,
      targetRegion,
      Number(lagSeconds),
      healthy
    ]);

    res.status(201).json({sample:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not record replication sample"
    });
  }
});

app.post("/api/regions/health",async(req,res)=>{
  const {
    regionName,
    availability,
    errorRate,
    replicationLag
  }=req.body||{};

  if(!regionName||
     availability===undefined||
     errorRate===undefined||
     replicationLag===undefined)
    return res.status(400).json({
      error:"Region health metrics are required"
    });

  const result=regionHealth({
    availability,
    errorRate,
    replicationLag
  });

  try{
    const {rows}=await pool.query(`
      INSERT INTO region_health_samples
        (region_name,health_score,healthy)
      VALUES($1,$2,$3)
      RETURNING *
    `,[
      regionName,
      result.score,
      result.healthy
    ]);

    res.status(201).json({
      sample:rows[0],
      result
    });
  }catch{
    res.status(500).json({
      error:"Could not record region health"
    });
  }
});

app.get("/api/regions/recovery-candidate",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT DISTINCT ON(r.region_name)
        r.region_name AS name,
        r.enabled,
        h.health_score AS "healthScore",
        COALESCE(
          (
            SELECT replication_lag_seconds
            FROM replication_samples rs
            WHERE rs.target_region=r.region_name
            ORDER BY observed_at DESC
            LIMIT 1
          ),999999
        ) AS "replicationLag",
        h.healthy
      FROM regions r
      LEFT JOIN region_health_samples h
        ON h.region_name=r.region_name
      ORDER BY r.region_name,h.observed_at DESC
    `);

    res.json({
      candidate:chooseRecoveryRegion(rows)
    });
  }catch{
    res.status(500).json({
      error:"Could not select recovery candidate"
    });
  }
});

app.post("/api/failover/simulate",async(req,res)=>{
  const {
    sourceRegion,
    targetRegion,
    rtoSeconds=0,
    rpoSeconds=0
  }=req.body||{};

  if(!sourceRegion||!targetRegion)
    return res.status(400).json({
      error:"sourceRegion and targetRegion are required"
    });

  try{
    const simulation=await traffic.simulate(
      sourceRegion,
      targetRegion
    );

    const validation=await traffic.validate(
      targetRegion
    );

    const {rows}=await pool.query(`
      INSERT INTO traffic_failover_simulations
        (source_region,target_region,status,
         rto_seconds,rpo_seconds)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      sourceRegion,
      targetRegion,
      validation.healthy?"VALIDATED":"FAILED",
      Number(rtoSeconds),
      Number(rpoSeconds)
    ]);

    res.status(201).json({
      simulation:rows[0],
      trafficSimulation:simulation,
      validation
    });
  }catch{
    res.status(500).json({
      error:"Failover simulation failed"
    });
  }
});

app.post("/api/failback/readiness",async(req,res)=>{
  const {
    replicationHealthy:replication,
    targetHealthHealthy,
    dataIntegrityVerified,
    trafficReady
  }=req.body||{};

  const ready=failbackReady({
    replicationHealthy:replication,
    targetHealthHealthy,
    dataIntegrityVerified,
    trafficReady
  });

  res.json({
    ready,
    prerequisites:{
      replicationHealthy:Boolean(replication),
      targetHealthHealthy:Boolean(targetHealthHealthy),
      dataIntegrityVerified:Boolean(dataIntegrityVerified),
      trafficReady:Boolean(trafficReady)
    }
  });
});

app.post("/api/failback/plans",async(req,res)=>{
  const {
    simulationId,
    targetPrimaryRegion,
    prerequisites=[]
  }=req.body||{};

  if(!simulationId||!targetPrimaryRegion)
    return res.status(400).json({
      error:"simulationId and targetPrimaryRegion are required"
    });

  const ready=prerequisites.every(Boolean);

  try{
    const {rows}=await pool.query(`
      INSERT INTO failback_plans
        (simulation_id,target_primary_region,
         prerequisites,ready)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[
      simulationId,
      targetPrimaryRegion,
      JSON.stringify(prerequisites),
      ready
    ]);

    res.status(201).json({plan:rows[0]});
  }catch{
    res.status(500).json({
      error:"Could not create failback plan"
    });
  }
});

app.get("/api/failover/history",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT
        target_region,
        COUNT(*)::int AS simulations,
        AVG(rto_seconds) AS avg_rto_seconds,
        AVG(rpo_seconds) AS avg_rpo_seconds
      FROM traffic_failover_simulations
      GROUP BY target_region
      ORDER BY target_region
    `);

    res.json({history:rows});
  }catch{
    res.status(500).json({
      error:"Could not load failover history"
    });
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 81 Cross-Region API running"
));


module.exports = app;
