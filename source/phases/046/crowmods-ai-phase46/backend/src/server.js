const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  safeEventName,funnel,recommendations
}=require("./analytics");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:46,
  service:"growth-analytics"
}));

app.post("/api/analytics/events",async(req,res)=>{
  const {
    eventName,
    anonymousId=null,
    sessionId=null,
    releaseId=null,
    campaignId=null,
    platform=null,
    source=null,
    metadata={}
  }=req.body||{};

  const name=safeEventName(eventName);

  if(!name)
    return res.status(400).json({error:"eventName is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO analytics_events
        (event_name,anonymous_id,session_id,release_id,campaign_id,
         platform,source,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id,event_name,created_at
    `,[
      name,anonymousId,sessionId,releaseId,
      campaignId,platform,source,metadata
    ]);

    res.status(201).json({event:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record event"});
  }
});

app.post("/api/analytics/revenue",async(req,res)=>{
  const {
    eventName="purchase",
    amountMinor,
    currency="INR",
    anonymousId=null,
    campaignId=null,
    releaseId=null,
    source=null,
    metadata={}
  }=req.body||{};

  if(!Number.isInteger(Number(amountMinor))||Number(amountMinor)<0)
    return res.status(400).json({error:"amountMinor must be a non-negative integer"});

  if(!/^[A-Z]{3}$/.test(currency))
    return res.status(400).json({error:"currency must be ISO-like 3-letter code"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO revenue_events
        (event_name,amount_minor,currency,anonymous_id,campaign_id,
         release_id,source,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id,event_name,amount_minor,currency,created_at
    `,[
      safeEventName(eventName),Number(amountMinor),currency,
      anonymousId,campaignId,releaseId,source,metadata
    ]);

    res.status(201).json({revenue:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record revenue"});
  }
});

app.get("/api/analytics/overview",async(req,res)=>{
  const days=Math.min(Math.max(Number(req.query.days||30),1),365);

  try{
    const events=(await pool.query(`
      SELECT event_name,platform,source,metadata,created_at
      FROM analytics_events
      WHERE created_at >= NOW() - ($1 * INTERVAL '1 day')
      ORDER BY created_at DESC
      LIMIT 50000
    `,[days])).rows;

    const revenue=(await pool.query(`
      SELECT COALESCE(SUM(amount_minor),0)::bigint AS total_minor,
             COUNT(*)::int AS transactions
      FROM revenue_events
      WHERE created_at >= NOW() - ($1 * INTERVAL '1 day')
    `,[days])).rows[0];

    const metrics=funnel(events);

    res.json({
      periodDays:days,
      metrics,
      revenue:{
        totalMinor:String(revenue.total_minor),
        transactions:revenue.transactions
      },
      recommendations:recommendations(metrics)
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not build analytics overview"});
  }
});

app.get("/api/analytics/platforms",async(req,res)=>{
  const days=Math.min(Math.max(Number(req.query.days||30),1),365);

  try{
    const {rows}=await pool.query(`
      SELECT
        COALESCE(platform,'unknown') AS platform,
        COUNT(*)::int AS events,
        COUNT(*) FILTER(WHERE event_name='campaign_click')::int AS clicks,
        COUNT(*) FILTER(WHERE event_name='community_join')::int AS joins,
        COUNT(*) FILTER(WHERE event_name='download')::int AS downloads
      FROM analytics_events
      WHERE created_at >= NOW() - ($1 * INTERVAL '1 day')
      GROUP BY COALESCE(platform,'unknown')
      ORDER BY events DESC
    `,[days]);

    res.json({platforms:rows});
  }catch{
    res.status(500).json({error:"Could not load platform analytics"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 46 Analytics API running"));
