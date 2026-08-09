const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {PLATFORMS,buildIntelligence}=require("./intelligence");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:39,
  service:"release-intelligence"
}));

app.post("/api/releases/intelligence/preview",async(req,res)=>{
  try{
    const intelligence=buildIntelligence(req.body||{});

    res.json({
      intelligence,
      advisoryOnly:true,
      requiresHumanApproval:true,
      supportedPlatforms:PLATFORMS
    });
  }catch(err){
    res.status(400).json({error:err.message});
  }
});

app.post("/api/releases/:uploadId/intelligence",async(req,res)=>{
  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const upload=(await client.query(`
      SELECT id,scan_status,approval_status
      FROM uploads WHERE id=$1
    `,[req.params.uploadId])).rows[0];

    if(!upload){
      await client.query("ROLLBACK");
      return res.status(404).json({error:"Upload not found"});
    }

    if(upload.scan_status!=="CLEAN"){
      await client.query("ROLLBACK");
      return res.status(409).json({
        error:"Release intelligence requires a CLEAN security scan"
      });
    }

    const intelligence=buildIntelligence(req.body||{});

    const row=(await client.query(`
      INSERT INTO release_intelligence
        (upload_id,app_name,package_name,version_name,version_code,
         category,tags,compatibility,description,changelog,
         seo_title,seo_description,source_facts,confidence,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'REVIEW')
      RETURNING *
    `,[
      upload.id,
      intelligence.appName,
      intelligence.packageName,
      intelligence.versionName,
      intelligence.versionCode,
      intelligence.category,
      intelligence.tags,
      intelligence.compatibility,
      intelligence.description,
      intelligence.changelog,
      intelligence.seoTitle,
      intelligence.seoDescription,
      intelligence.sourceFacts,
      intelligence.confidence
    ])).rows[0];

    for(const platform of PLATFORMS){
      await client.query(`
        INSERT INTO release_social_drafts
          (intelligence_id,platform,content)
        VALUES($1,$2,$3)
      `,[row.id,platform,intelligence.social[platform]]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      intelligence:row,
      socialDraftsCreated:PLATFORMS.length,
      requiresHumanApproval:true
    });
  }catch(err){
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({error:"Could not create release intelligence"});
  }finally{
    client.release();
  }
});

app.post("/api/releases/intelligence/:id/approve",async(req,res)=>{
  const approved=Boolean(req.body?.approved);

  try{
    const {rows}=await pool.query(`
      UPDATE release_intelligence
      SET status=$2,updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[req.params.id,approved?"APPROVED":"REJECTED"]);

    if(!rows[0])return res.status(404).json({error:"Intelligence record not found"});

    res.json({
      intelligence:rows[0],
      publishingEligible:approved
    });
  }catch{
    res.status(500).json({error:"Could not update intelligence approval"});
  }
});

app.get("/api/releases/intelligence/:id",async(req,res)=>{
  try{
    const intelligence=(await pool.query(`
      SELECT * FROM release_intelligence WHERE id=$1
    `,[req.params.id])).rows[0];

    if(!intelligence)return res.status(404).json({error:"Not found"});

    const social=(await pool.query(`
      SELECT * FROM release_social_drafts
      WHERE intelligence_id=$1
      ORDER BY platform
    `,[req.params.id])).rows;

    res.json({intelligence,social});
  }catch{
    res.status(500).json({error:"Could not load release intelligence"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 39 Intelligence API running"));


module.exports = app;
