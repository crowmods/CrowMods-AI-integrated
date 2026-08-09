const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {rankReleases}=require("./discovery");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:22}));

app.get("/api/discovery/search",async(req,res)=>{
  const q=String(req.query.q||"").trim();
  const category=String(req.query.category||"").trim();
  const limit=Math.min(Number(req.query.limit||30),50);

  try{
    const {rows}=await pool.query(`
      SELECT r.id,r.original_name,r.category,r.version_name,
             r.download_count,r.view_count,r.published_at,
             b.title,b.short_description,b.tags
      FROM releases r
      LEFT JOIN release_ai_briefs b ON b.release_id=r.id
      WHERE r.status='PUBLISHED'
        AND ($1='' OR
          b.title ILIKE '%'||$1||'%' OR
          r.original_name ILIKE '%'||$1||'%' OR
          r.package_name ILIKE '%'||$1||'%' OR
          r.category ILIKE '%'||$1||'%')
        AND ($2='' OR r.category=$2)
      ORDER BY r.published_at DESC NULLS LAST
      LIMIT $3
    `,[q,category,limit]);

    await pool.query(`
      INSERT INTO search_events(query_text,result_count,anonymous_session_id)
      VALUES($1,$2,$3)
    `,[q,rows.length,req.body?.sessionId||req.headers["x-session-id"]||null]);

    res.json({query:q,results:rankReleases(rows)});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Search failed"});
  }
});

app.get("/api/discovery/trending",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT r.id,r.original_name,r.category,r.version_name,
             r.download_count,r.view_count,r.published_at,
             b.title,b.short_description
      FROM releases r
      LEFT JOIN release_ai_briefs b ON b.release_id=r.id
      WHERE r.status='PUBLISHED'
      ORDER BY r.download_count DESC,r.view_count DESC,r.published_at DESC
      LIMIT 20
    `);
    res.json({results:rankReleases(rows)});
  }catch{
    res.status(500).json({error:"Trending query failed"});
  }
});

app.get("/api/discovery/recent",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT r.id,r.original_name,r.category,r.version_name,r.published_at,
             b.title,b.short_description
      FROM releases r
      LEFT JOIN release_ai_briefs b ON b.release_id=r.id
      WHERE r.status='PUBLISHED'
      ORDER BY r.published_at DESC NULLS LAST
      LIMIT 20
    `);
    res.json({results:rows});
  }catch{
    res.status(500).json({error:"Recent query failed"});
  }
});

app.get("/api/discovery/related/:id",async(req,res)=>{
  try{
    const source=await pool.query(`
      SELECT category,package_name FROM releases WHERE id=$1
    `,[req.params.id]);

    if(!source.rows[0])return res.status(404).json({error:"Release not found"});

    const {rows}=await pool.query(`
      SELECT r.id,r.original_name,r.category,r.version_name,
             r.download_count,r.view_count,b.title,b.short_description
      FROM releases r
      LEFT JOIN release_ai_briefs b ON b.release_id=r.id
      WHERE r.status='PUBLISHED'
        AND r.id<>$1
        AND r.category IS NOT DISTINCT FROM $2
      ORDER BY r.download_count DESC,r.view_count DESC
      LIMIT 8
    `,[req.params.id,source.rows[0].category]);

    res.json({results:rows});
  }catch{
    res.status(500).json({error:"Related query failed"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 22 Discovery API running"));


module.exports = app;
