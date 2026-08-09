const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:13}));

app.post("/api/monetization/affiliate-click",async(req,res)=>{
  const {partner,destination,releaseId=null,sessionId=null}=req.body||{};
  if(!partner||!destination)return res.status(400).json({error:"partner and destination are required"});
  try{
    await pool.query(`
      INSERT INTO affiliate_clicks(partner,destination,release_id,anonymous_session_id)
      VALUES($1,$2,$3,$4)
    `,[partner,destination,releaseId,sessionId]);
    res.status(201).json({ok:true});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record affiliate click"});
  }
});

app.post("/api/monetization/revenue-event",async(req,res)=>{
  const {source,eventType,amountMinor=0,currency="INR",externalReference=null,metadata={}}=req.body||{};
  if(!source||!eventType)return res.status(400).json({error:"source and eventType are required"});
  try{
    await pool.query(`
      INSERT INTO revenue_events
      (source,event_type,amount_minor,currency,external_reference,metadata)
      VALUES($1,$2,$3,$4,$5,$6)
    `,[source,eventType,Number(amountMinor),currency,externalReference,metadata]);
    res.status(201).json({ok:true});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record revenue event"});
  }
});

app.get("/api/monetization/summary",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT source,currency,
             COALESCE(SUM(amount_minor),0)::bigint AS total_minor,
             COUNT(*)::int AS events
      FROM revenue_events
      GROUP BY source,currency
      ORDER BY total_minor DESC
    `);
    res.json({revenue:rows});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Revenue query failed"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 13 API running"));


module.exports = app;
