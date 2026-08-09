const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildGrowthInsights}=require("./growth");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:30}));

app.post("/api/analytics/event",async(req,res)=>{
  const {
    eventName,releaseId=null,platform=null,source=null,
    sessionId=null,value=null,metadata={}
  }=req.body||{};

  if(!eventName)return res.status(400).json({error:"eventName is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO analytics_events
        (event_name,release_id,platform,source,anonymous_session_id,value,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING id,created_at
    `,[eventName,releaseId,platform,source,sessionId,value,metadata]);

    res.status(201).json({event:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record analytics event"});
  }
});

app.get("/api/analytics/kpis",async(req,res)=>{
  const days=Math.min(Math.max(Number(req.query.days||7),1),90);

  try{
    const {rows}=await pool.query(`
      SELECT
        COUNT(*) FILTER(WHERE event_name='page_view')::int AS views,
        COUNT(*) FILTER(WHERE event_name='download_click')::int AS downloads,
        COUNT(*) FILTER(WHERE event_name='campaign_impression')::int AS campaign_impressions,
        COUNT(*) FILTER(WHERE event_name='campaign_click')::int AS campaign_clicks
      FROM analytics_events
      WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
    `,[days]);

    const revenue=(await pool.query(`
      SELECT COALESCE(SUM(amount),0) AS revenue
      FROM revenue_events
      WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
    `,[days])).rows[0];

    const kpis={
      ...rows[0],
      revenue:Number(revenue.revenue||0),
      currency:process.env.CURRENCY||"INR"
    };

    res.json({
      days,
      kpis,
      insights:buildGrowthInsights(kpis)
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not calculate KPIs"});
  }
});

app.get("/api/analytics/platforms",async(req,res)=>{
  const days=Math.min(Math.max(Number(req.query.days||30),1),90);
  try{
    const {rows}=await pool.query(`
      SELECT COALESCE(platform,'unknown') AS platform,
             COUNT(*) FILTER(WHERE event_name='campaign_impression')::int AS impressions,
             COUNT(*) FILTER(WHERE event_name='campaign_click')::int AS clicks,
             COUNT(*) FILTER(WHERE event_name='download_click')::int AS downloads
      FROM analytics_events
      WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
      GROUP BY COALESCE(platform,'unknown')
      ORDER BY clicks DESC,downloads DESC
    `,[days]);
    res.json({days,platforms:rows});
  }catch{
    res.status(500).json({error:"Could not load platform analytics"});
  }
});

app.post("/api/analytics/revenue",async(req,res)=>{
  const {
    eventName="revenue",
    amount=0,
    currency="INR",
    source=null,
    metadata={}
  }=req.body||{};

  if(Number(amount)<0)return res.status(400).json({error:"Invalid amount"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO revenue_events(event_name,amount,currency,source,metadata)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[eventName,amount,currency,source,metadata]);

    res.status(201).json({event:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record revenue"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 30 Analytics API running"));
