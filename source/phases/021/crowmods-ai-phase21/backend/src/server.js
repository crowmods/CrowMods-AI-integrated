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

const base=process.env.PUBLIC_BASE_URL||"http://localhost:3000";

app.get("/health",(_req,res)=>res.json({ok:true,phase:21}));

app.get("/api/public/releases",async(req,res)=>{
  const q=String(req.query.q||"").trim();
  const category=String(req.query.category||"").trim();
  const limit=Math.min(Number(req.query.limit||24),50);

  try{
    const {rows}=await pool.query(`
      SELECT r.id,r.original_name,r.category,r.package_name,r.version_name,
             r.size_bytes,r.published_at,
             b.title,b.short_description,b.seo_title,b.seo_description,b.tags
      FROM releases r
      LEFT JOIN release_ai_briefs b ON b.release_id=r.id
      WHERE r.status='PUBLISHED'
        AND ($1='' OR
             COALESCE(b.title,'') ILIKE '%'||$1||'%' OR
             COALESCE(r.original_name,'') ILIKE '%'||$1||'%' OR
             COALESCE(r.package_name,'') ILIKE '%'||$1||'%')
        AND ($2='' OR r.category=$2)
      ORDER BY r.published_at DESC NULLS LAST
      LIMIT $3
    `,[q,category,limit]);

    res.json({releases:rows});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not load releases"});
  }
});

app.get("/api/public/releases/:id",async(req,res)=>{
  try{
    const result=await pool.query(`
      SELECT r.id,r.original_name,r.category,r.package_name,r.version_name,
             r.version_code,r.sha256,r.size_bytes,r.published_at,
             b.title,b.short_description,b.description,b.seo_title,
             b.seo_description,b.tags,b.features,b.whats_new
      FROM releases r
      LEFT JOIN release_ai_briefs b ON b.release_id=r.id
      WHERE r.id=$1 AND r.status='PUBLISHED'
    `,[req.params.id]);

    const release=result.rows[0];
    if(!release)return res.status(404).json({error:"Release not found"});

    const related=await pool.query(`
      SELECT r.id,r.category,r.version_name,b.title,b.short_description
      FROM releases r
      LEFT JOIN release_ai_briefs b ON b.release_id=r.id
      WHERE r.status='PUBLISHED'
        AND r.category IS NOT DISTINCT FROM $2
        AND r.id<>$1
      ORDER BY r.published_at DESC NULLS LAST
      LIMIT 6
    `,[release.id,release.category]);

    res.json({
      release,
      related:related.rows,
      seo:{
        title:release.seo_title||release.title||release.original_name,
        description:release.seo_description||release.short_description||"",
        canonical:`${base}/apps/${release.id}`
      }
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not load release"});
  }
});

app.post("/api/public/releases/:id/download-event",async(req,res)=>{
  try{
    await pool.query(`
      INSERT INTO analytics_events(event_name,release_id,anonymous_session_id,metadata)
      VALUES('download_click',$1,$2,$3)
    `,[req.params.id,req.body?.sessionId||null,{source:req.body?.source||"website"}]);
    res.status(201).json({ok:true});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record download event"});
  }
});

app.get("/sitemap.xml",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT id FROM releases WHERE status='PUBLISHED'
      ORDER BY published_at DESC
    `);

    const urls=[
      `${base}/`,
      ...rows.map(x=>`${base}/apps/${x.id}`)
    ];

    const xml=`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u=>`<url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;

    res.type("application/xml").send(xml);
  }catch(err){
    res.status(500).type("text/plain").send("Sitemap unavailable");
  }
});

/*
  Production download flow:
  1. verify release is PUBLISHED;
  2. verify user/session/rate limits if required;
  3. create a short-lived signed object-storage URL;
  4. return/redirect to that URL;
  5. record download event.
*/
app.get("/api/public/releases/:id/download",async(req,res)=>{
  res.status(501).json({
    error:"Signed download storage connector not configured yet.",
    releaseId:req.params.id
  });
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 21 Public API running"));
