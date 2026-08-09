const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");

const app=express();
app.use(helmet());
app.use(cors({origin:process.env.CORS_ORIGIN||"http://localhost:3000"}));
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:16}));

app.get("/api/admin/overview",async(_req,res)=>{
  try{
    const [
      releases,
      pending,
      published,
      users,
      memberships,
      revenue,
      events
    ]=await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM releases"),
      pool.query("SELECT COUNT(*)::int AS count FROM releases WHERE status='PENDING_REVIEW'"),
      pool.query("SELECT COUNT(*)::int AS count FROM releases WHERE status='PUBLISHED'"),
      pool.query("SELECT COUNT(*)::int AS count FROM users WHERE is_active=true"),
      pool.query("SELECT COUNT(*)::int AS count FROM memberships WHERE status='ACTIVE'"),
      pool.query("SELECT COALESCE(SUM(amount_minor),0)::bigint AS total_minor FROM revenue_events"),
      pool.query("SELECT COUNT(*)::int AS count FROM analytics_events WHERE created_at >= NOW()-INTERVAL '24 hours'")
    ]);

    res.json({
      system:{api:"healthy",database:"healthy"},
      releases:{
        total:releases.rows[0].count,
        pending:pending.rows[0].count,
        published:published.rows[0].count
      },
      users:users.rows[0].count,
      activeMemberships:memberships.rows[0].count,
      revenueMinor:revenue.rows[0].total_minor,
      events24h:events.rows[0].count
    });
  }catch(err){
    console.error(err);
    res.status(503).json({error:"Dashboard data unavailable"});
  }
});

app.get("/api/admin/recent-releases",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT id,original_name,status,category,version_name,created_at,published_at
      FROM releases ORDER BY created_at DESC LIMIT 10
    `);
    res.json({releases:rows});
  }catch{
    res.status(500).json({error:"Could not load releases"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 16 API running"));


module.exports = app;
