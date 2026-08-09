const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {generateContent}=require("./provider");
const {validateContent}=require("./quality");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:19}));

app.post("/api/ai/content-preview",async(req,res)=>{
  try{
    const input=req.body?.verifiedMetadata||req.body||{};
    const content=await generateContent(input);
    const quality=validateContent(content,input);
    res.json({
      provider:process.env.AI_PROVIDER||"stub",
      content,
      quality,
      publicPublishingAllowed:false
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"AI content generation failed"});
  }
});

app.post("/api/releases/:id/ai/generate",async(req,res)=>{
  try{
    const result=await pool.query(`
      SELECT id,original_name,category,package_name,version_name,version_code,
             sha256,size_bytes
      FROM releases WHERE id=$1
    `,[req.params.id]);
    const release=result.rows[0];
    if(!release)return res.status(404).json({error:"Release not found"});

    const input={
      originalName:release.original_name,
      appName:req.body?.appName,
      category:release.category,
      packageName:release.package_name,
      versionName:release.version_name,
      versionCode:release.version_code,
      sha256:release.sha256,
      sizeBytes:release.size_bytes,
      verifiedDescription:req.body?.verifiedDescription,
      verifiedFeatures:req.body?.verifiedFeatures||[],
      verifiedChanges:req.body?.verifiedChanges||[]
    };

    const content=await generateContent(input);
    const quality=validateContent(content,input);

    await pool.query(`
      INSERT INTO release_ai_briefs
        (release_id,title,short_description,description,seo_title,seo_description,
         tags,features,whats_new,model_name,model_version)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT(release_id) DO UPDATE SET
        title=EXCLUDED.title,
        short_description=EXCLUDED.short_description,
        description=EXCLUDED.description,
        seo_title=EXCLUDED.seo_title,
        seo_description=EXCLUDED.seo_description,
        tags=EXCLUDED.tags,
        features=EXCLUDED.features,
        whats_new=EXCLUDED.whats_new,
        model_name=EXCLUDED.model_name,
        model_version=EXCLUDED.model_version,
        generated_at=NOW()
    `,[
      release.id,content.title,content.shortDescription,content.description,
      content.seoTitle,content.seoDescription,JSON.stringify(content.tags||[]),
      JSON.stringify(content.features||[]),JSON.stringify(content.whatsNew||[]),
      process.env.AI_PROVIDER||"stub",process.env.AI_MODEL||"stub"
    ]);

    res.json({
      releaseId:release.id,
      content,
      quality,
      requiresHumanApproval:true
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not generate release content"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 19 AI Content API running"));
