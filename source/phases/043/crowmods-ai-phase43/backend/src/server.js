const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  PLATFORMS,OPERATIONS,idempotencyKey,
  connectorContract,validateOperation
}=require("./connectors");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:43,
  service:"connector-hub"
}));

app.get("/api/connectors/platforms",(_req,res)=>{
  res.json({
    platforms:PLATFORMS,
    operations:OPERATIONS,
    contract:connectorContract()
  });
});

app.get("/api/connectors",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT id,platform,account_label,provider_account_ref,status,
             scopes,last_health_check,metadata,created_at,updated_at
      FROM platform_connections
      ORDER BY platform,account_label
    `);
    res.json({connections:rows});
  }catch{
    res.status(500).json({error:"Could not load connections"});
  }
});

/*
  The secret_ref is only a reference to a secrets manager entry.
  Raw OAuth tokens/API keys must never be accepted from this endpoint or
  returned to the browser.
*/
app.post("/api/connectors/connections",async(req,res)=>{
  const {
    platform,
    accountLabel,
    providerAccountRef=null,
    scopes=[],
    secretRef=null,
    metadata={}
  }=req.body||{};

  if(!PLATFORMS.includes(platform))
    return res.status(400).json({error:"Unsupported platform"});

  if(!accountLabel)
    return res.status(400).json({error:"accountLabel is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO platform_connections
        (platform,account_label,provider_account_ref,scopes,secret_ref,metadata,status)
      VALUES($1,$2,$3,$4,$5,$6,'CONNECTED')
      RETURNING id,platform,account_label,provider_account_ref,status,scopes,metadata
    `,[
      platform,accountLabel,providerAccountRef,
      scopes,secretRef,metadata
    ]);

    res.status(201).json({connection:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not create connection"});
  }
});

app.post("/api/connectors/connections/:id/health",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      UPDATE platform_connections
      SET status='CONNECTED',last_health_check=NOW(),updated_at=NOW()
      WHERE id=$1
      RETURNING id,platform,status,last_health_check
    `,[req.params.id]);

    if(!rows[0])return res.status(404).json({error:"Connection not found"});

    res.json({
      connection:rows[0],
      message:"Provider-specific health check should run here."
    });
  }catch{
    res.status(500).json({error:"Could not update connection health"});
  }
});

app.post("/api/connectors/jobs",async(req,res)=>{
  const {
    connectionId,
    operation="PUBLISH",
    externalRef,
    campaignPostId=null,
    payload={}
  }=req.body||{};

  if(!connectionId||!externalRef)
    return res.status(400).json({
      error:"connectionId and externalRef are required"
    });

  if(!validateOperation(operation))
    return res.status(400).json({error:"Unsupported operation"});

  const key=idempotencyKey(
    payload.platform||"unknown",
    operation,
    externalRef
  );

  try{
    const {rows}=await pool.query(`
      INSERT INTO connector_jobs
        (platform_connection_id,campaign_post_id,idempotency_key,
         operation,payload,max_attempts)
      VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(idempotency_key) DO NOTHING
      RETURNING *
    `,[
      connectionId,campaignPostId,key,operation,payload,
      Number(process.env.CONNECTOR_JOB_MAX_ATTEMPTS||5)
    ]);

    res.status(201).json({
      created:rows.length>0,
      job:rows[0]||null,
      idempotencyKey:key
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not create connector job"});
  }
});

app.get("/api/connectors/jobs",async(req,res)=>{
  const status=req.query.status||null;

  try{
    const {rows}=await pool.query(
      status?`
        SELECT j.*,c.platform,c.account_label
        FROM connector_jobs j
        JOIN platform_connections c
          ON c.id=j.platform_connection_id
        WHERE j.status=$1
        ORDER BY j.created_at DESC LIMIT 200
      `:`
        SELECT j.*,c.platform,c.account_label
        FROM connector_jobs j
        JOIN platform_connections c
          ON c.id=j.platform_connection_id
        ORDER BY j.created_at DESC LIMIT 200
      `,
      status?[status]:[]
    );

    res.json({jobs:rows});
  }catch{
    res.status(500).json({error:"Could not load connector jobs"});
  }
});

app.post("/api/connectors/jobs/:id/result",async(req,res)=>{
  const {
    status,
    externalPostRef=null,
    errorMessage=null,
    metadata={}
  }=req.body||{};

  const allowed=["SUCCEEDED","RETRYING","FAILED","CANCELLED"];
  if(!allowed.includes(status))
    return res.status(400).json({error:"Invalid job result"});

  try{
    const {rows}=await pool.query(`
      UPDATE connector_jobs
      SET status=$2,
          external_post_ref=COALESCE($3,external_post_ref),
          last_error=$4,
          attempts=attempts+1,
          completed_at=CASE
            WHEN $2 IN ('SUCCEEDED','FAILED','CANCELLED') THEN NOW()
            ELSE NULL
          END
      WHERE id=$1
      RETURNING *
    `,[req.params.id,status,externalPostRef,errorMessage]);

    if(!rows[0])return res.status(404).json({error:"Job not found"});

    await pool.query(`
      INSERT INTO connector_events(job_id,event_type,metadata)
      VALUES($1,$2,$3)
    `,[req.params.id,`JOB_${status}`,metadata]);

    res.json({job:rows[0]});
  }catch{
    res.status(500).json({error:"Could not record job result"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 43 Connector Hub running"));
