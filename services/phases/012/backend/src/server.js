const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {recommend}=require("./growth");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:12}));

app.post("/api/analytics/event",async(req,res)=>{
  const {eventName,releaseId=null,campaignId=null,sessionId=null,metadata={}}=req.body||{};
  if(!eventName)return res.status(400).json({error:"eventName required"});
  try{
    await pool.query(`
      INSERT INTO analytics_events
      (event_name,release_id,campaign_id,anonymous_session_id,metadata)
      VALUES($1,$2,$3,$4,$5)
    `,[eventName,releaseId,campaignId,sessionId,metadata]);
    res.status(201).json({ok:true});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Analytics event failed"});
  }
});

app.get("/api/analytics/summary",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT event_name,COUNT(*)::int AS count
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY event_name
      ORDER BY count DESC
    `);
    res.json({period:"30d",events:rows});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Analytics query failed"});
  }
});

app.post("/api/growth/recommendations",(req,res)=>{
  const metrics={
    pageViews:Number(req.body?.pageViews||0),
    downloads:Number(req.body?.downloads||0),
    socialClicks:Number(req.body?.socialClicks||0),
    communityMembers:Number(req.body?.communityMembers||0),
    communityGrowth7d:Number(req.body?.communityGrowth7d||0),
    revenue7d:Number(req.body?.revenue7d||0),
    revenuePrev7d:Number(req.body?.revenuePrev7d||0)
  };
  res.json({metrics,recommendations:recommend(metrics)});
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 12 API running"));


module.exports = app;
