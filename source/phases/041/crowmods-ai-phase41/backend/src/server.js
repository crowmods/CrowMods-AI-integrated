const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildPage}=require("./pageBuilder");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"3mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:41,
  service:"release-page-builder"
}));

app.post("/api/release-pages/preview",async(req,res)=>{
  const {intelligence={},media=[]}=req.body||{};
  res.json({
    page:buildPage(intelligence,media),
    requiresHumanApproval:true
  });
});

app.post("/api/release-pages",async(req,res)=>{
  const {intelligenceId}=req.body||{};

  if(!intelligenceId)
    return res.status(400).json({error:"intelligenceId is required"});

  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const intelligence=(await client.query(`
      SELECT * FROM release_intelligence
      WHERE id=$1 AND status='APPROVED'
    `,[intelligenceId])).rows[0];

    if(!intelligence){
      await client.query("ROLLBACK");
      return res.status(409).json({
        error:"Release intelligence must be approved first"
      });
    }

    const media=(await client.query(`
      SELECT * FROM media_assets
      WHERE release_intelligence_id=$1
        AND status='APPROVED'
      ORDER BY created_at
    `,[intelligenceId])).rows;

    const page=buildPage(intelligence,media);

    const row=(await client.query(`
      INSERT INTO release_pages
        (intelligence_id,slug,title,summary,body,version_name,
         version_code,category,tags,seo_title,seo_description,
         canonical_url,structured_data,gallery,download,
         related_releases,status)
      VALUES(
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
        NULL,$12,$13,$14,$15,'REVIEW'
      )
      RETURNING *
    `,[
      intelligenceId,
      page.slug,
      page.title,
      page.summary,
      page.body,
      page.versionName,
      page.versionCode,
      page.category,
      page.tags,
      page.seoTitle,
      page.seoDescription,
      page.structuredData,
      page.gallery,
      page.download,
      page.relatedReleases
    ])).rows[0];

    await client.query("COMMIT");

    res.status(201).json({
      page:row,
      approvedMedia:media.length,
      requiresHumanApproval:true
    });
  }catch(err){
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({error:"Could not create release page"});
  }finally{
    client.release();
  }
});

app.get("/api/release-pages",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT id,slug,title,version_name,category,status,
             seo_title,created_at,published_at
      FROM release_pages
      ORDER BY created_at DESC LIMIT 200
    `);
    res.json({pages:rows});
  }catch{
    res.status(500).json({error:"Could not load release pages"});
  }
});

app.get("/api/release-pages/:slug",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT * FROM release_pages WHERE slug=$1
    `,[req.params.slug]);

    if(!rows[0])return res.status(404).json({error:"Release page not found"});

    res.json({page:rows[0]});
  }catch{
    res.status(500).json({error:"Could not load release page"});
  }
});

app.post("/api/release-pages/:id/approve",async(req,res)=>{
  const approved=Boolean(req.body?.approved);

  try{
    const {rows}=await pool.query(`
      UPDATE release_pages
      SET status=$2,updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[req.params.id,approved?"APPROVED":"ARCHIVED"]);

    if(!rows[0])return res.status(404).json({error:"Release page not found"});

    res.json({
      page:rows[0],
      publishingEligible:approved
    });
  }catch{
    res.status(500).json({error:"Could not update release page"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 41 Page Builder running"));
