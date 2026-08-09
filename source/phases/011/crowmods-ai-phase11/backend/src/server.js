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
  ssl:process.env.NODE_ENV==="production" ? {rejectUnauthorized:true} : false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:11}));
app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({ready:true,database:"ok"});
  }catch{
    res.status(503).json({ready:false,database:"unavailable"});
  }
});

app.get("/api/releases",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT r.id,r.original_name,r.sha256,r.size_bytes,r.status,
             r.category,r.version_name,r.created_at,r.published_at,
             b.title,b.short_description,b.seo_title,b.tags
      FROM releases r
      LEFT JOIN release_ai_briefs b ON b.release_id=r.id
      ORDER BY r.created_at DESC
      LIMIT 100
    `);
    res.json({releases:rows});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Database query failed"});
  }
});

const port=process.env.PORT||4000;
app.listen(port,()=>console.log(`CrowMods Phase 11 API on ${port}`));
