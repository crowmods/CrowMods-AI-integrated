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

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:33,
  service:"admin-command-center"
}));

app.get("/api/admin/overview",async(_req,res)=>{
  try{
    const [
      releases,
      telegram,
      discord,
      community,
      users,
      premium,
      revenue,
      analytics
    ]=await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER(WHERE status='PENDING_APPROVAL')::int AS pending_approval,
          COUNT(*) FILTER(WHERE status='PUBLISHED')::int AS published
        FROM releases
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER(WHERE status IN ('PENDING_APPROVAL','QUEUED','SCHEDULED'))::int AS queued,
          COUNT(*) FILTER(WHERE status='FAILED')::int AS failed
        FROM telegram_posts
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER(WHERE status IN ('PENDING_APPROVAL','QUEUED','SCHEDULED'))::int AS queued,
          COUNT(*) FILTER(WHERE status='FAILED')::int AS failed
        FROM discord_posts
      `),
      pool.query(`
        SELECT COUNT(*)::int AS open_escalations
        FROM community_escalations WHERE status='OPEN'
      `),
      pool.query(`
        SELECT COUNT(*)::int AS total_users
        FROM users WHERE is_active=TRUE
      `),
      pool.query(`
        SELECT COUNT(*)::int AS premium_users
        FROM users
        WHERE is_active=TRUE AND premium_until>NOW()
      `),
      pool.query(`
        SELECT COALESCE(SUM(amount_minor),0)::bigint AS revenue_minor,
               COALESCE(MAX(currency),'INR') AS currency
        FROM payment_events
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER(WHERE event_name='page_view')::int AS views,
          COUNT(*) FILTER(WHERE event_name='download_click')::int AS downloads,
          COUNT(*) FILTER(WHERE event_name='campaign_click')::int AS campaign_clicks
        FROM analytics_events
        WHERE created_at>=NOW()-INTERVAL '30 days'
      `)
    ]);

    res.json({
      generatedAt:new Date().toISOString(),
      releases:releases.rows[0],
      telegram:telegram.rows[0],
      discord:discord.rows[0],
      community:community.rows[0],
      users:users.rows[0],
      premium:premium.rows[0],
      revenue:revenue.rows[0],
      analytics30d:analytics.rows[0],
      security:{
        note:"Connect production security monitoring, audit logs and alerting before launch."
      }
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not load admin overview"});
  }
});

app.get("/api/admin/queues",async(_req,res)=>{
  try{
    const [tg,dc,esc]=await Promise.all([
      pool.query(`
        SELECT id,status,scheduled_for,created_at
        FROM telegram_posts
        WHERE status IN ('PENDING_APPROVAL','QUEUED','SCHEDULED','FAILED')
        ORDER BY created_at DESC LIMIT 50
      `),
      pool.query(`
        SELECT id,status,scheduled_for,created_at
        FROM discord_posts
        WHERE status IN ('PENDING_APPROVAL','QUEUED','SCHEDULED','FAILED')
        ORDER BY created_at DESC LIMIT 50
      `),
      pool.query(`
        SELECT id,severity,reason,created_at
        FROM community_escalations
        WHERE status='OPEN'
        ORDER BY created_at DESC LIMIT 50
      `)
    ]);

    res.json({
      telegram:tg.rows,
      discord:dc.rows,
      escalations:esc.rows
    });
  }catch{
    res.status(500).json({error:"Could not load operational queues"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 33 Admin API running"));


module.exports = app;
