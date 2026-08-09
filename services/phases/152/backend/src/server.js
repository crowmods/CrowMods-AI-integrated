const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {evaluate}=require("./distributed-rate-limit");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({
 status:"healthy",
 phase:152
}));

app.get("/ready",async(_q,s)=>{
 try{
  await pool.query("SELECT 1");
  s.json({ready:true});
 }catch{
  s.status(503).json({ready:false});
 }
});

app.post("/api/security/governance/manifest/distributed-rate-limit",
async(req,res)=>{
 const key=String(req.body.limiterKey||"");

 if(!key)
  return res.status(400).json({
   state:"ESCALATED",
   reason:"missing_limiter_key"
  });

 const client=await pool.connect();

 try{
  await client.query("BEGIN");

  const q=await client.query(
   `SELECT limiter_key,window_start,window_seconds,
           request_count,limit_count,state
    FROM distributed_rate_limit_buckets
    WHERE limiter_key=$1
    FOR UPDATE`,
   [key]
  );

  const now=new Date(req.body.now||Date.now());

  let current=q.rowCount?q.rows[0]:null;

  if(!current){
   await client.query(
    `INSERT INTO distributed_rate_limit_buckets
     (limiter_key,window_start,window_seconds,
      request_count,limit_count,state)
     VALUES($1,$2,$3,0,$4,'ALLOW')`,
    [
     key,
     now,
     Number(req.body.windowSeconds)||60,
     Number(req.body.limitCount)||5
    ]
   );

   current={
    limiter_key:key,
    window_start:now,
    window_seconds:Number(req.body.windowSeconds)||60,
    request_count:0,
    limit_count:Number(req.body.limitCount)||5
   };
  }

  const start=new Date(current.window_start);
  const elapsed=(now.getTime()-start.getTime())/1000;

  const r=evaluate({
   elapsedSeconds:elapsed,
   requestCount:Number(current.request_count),
   limitCount:Number(current.limit_count),
   windowSeconds:Number(current.window_seconds),
   escalationMultiplier:Number(
    req.body.escalationMultiplier||2
   )
  });

  const nextStart=r.reset?now:start;

  await client.query(
   `UPDATE distributed_rate_limit_buckets
    SET window_start=$1,
        request_count=$2,
        state=$3,
        updated_at=NOW()
    WHERE limiter_key=$4`,
   [
    nextStart,
    r.requestCount||0,
    r.state,
    key
   ]
  );

  await client.query("COMMIT");
  res.json(r);
 }catch{
  await client.query("ROLLBACK");
  res.status(500).json({state:"ESCALATED"});
 }finally{
  client.release();
 }
});

app.get("/api/security/phase152-dashboard",
async(_q,res)=>{
 try{
  const [throttled,escalated,active]=await Promise.all([
   pool.query(`SELECT COUNT(*)::int count
    FROM distributed_rate_limit_buckets
    WHERE state='THROTTLED'`),
   pool.query(`SELECT COUNT(*)::int count
    FROM distributed_rate_limit_buckets
    WHERE state='ESCALATED'`),
   pool.query(`SELECT COUNT(*)::int count
    FROM distributed_rate_limit_buckets
    WHERE updated_at>NOW()-INTERVAL '5 minutes'`)
  ]);

  res.json({
   throttledBuckets:throttled.rows[0].count,
   escalatedBuckets:escalated.rows[0].count,
   activeBuckets5m:active.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 152 API running"
));


module.exports = app;
