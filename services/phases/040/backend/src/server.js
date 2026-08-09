const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  PLATFORMS,sha256,objectKey,buildAssetCopy
}=require("./media");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"5mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const maxBytes=Number(process.env.MEDIA_MAX_BYTES||52428800);

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:40,
  service:"media-studio"
}));

app.get("/api/media/platforms",(_req,res)=>{
  res.json({platforms:PLATFORMS});
});

app.post("/api/media/preview",async(req,res)=>{
  try{
    const copy=buildAssetCopy(req.body||{});
    res.json({
      copy,
      supportedPlatforms:PLATFORMS,
      requiresHumanApproval:true
    });
  }catch(err){
    res.status(400).json({error:err.message});
  }
});

app.post("/api/media/assets",async(req,res)=>{
  const {
    originalName,
    mediaType="image",
    mimeType="image/png",
    width=null,
    height=null,
    sizeBytes=0,
    sha256Hash=null,
    releaseIntelligenceId=null,
    appName="Release"
  }=req.body||{};

  if(!originalName)
    return res.status(400).json({error:"originalName is required"});

  if(Number(sizeBytes)<0||Number(sizeBytes)>maxBytes)
    return res.status(400).json({error:"Media size exceeds allowed limit"});

  if(sha256Hash&&!/^[a-f0-9]{64}$/i.test(sha256Hash))
    return res.status(400).json({error:"Invalid SHA-256 hash"});

  const id=cryptoRandomId();

  try{
    const copy=buildAssetCopy({appName});

    const asset=(await pool.query(`
      INSERT INTO media_assets
        (id,release_intelligence_id,original_name,object_key,media_type,
         mime_type,width,height,size_bytes,sha256,alt_text,caption,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'REVIEW')
      RETURNING *
    `,[
      id,releaseIntelligenceId,originalName,
      objectKey(id,originalName),mediaType,mimeType,
      width,height,sizeBytes,sha256Hash,
      copy.altText,copy.caption
    ])).rows[0];

    for(const v of copy.variants){
      await pool.query(`
        INSERT INTO media_variants
          (asset_id,platform,variant_type,caption,alt_text,status)
        VALUES($1,$2,$3,$4,$5,'REVIEW')
      `,[asset.id,v.platform,v.variantType,v.caption,v.altText]);
    }

    res.status(201).json({
      asset,
      variantsCreated:copy.variants.length,
      requiresHumanApproval:true
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not register media asset"});
  }
});

app.get("/api/media/assets",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT * FROM media_assets
      ORDER BY created_at DESC LIMIT 200
    `);
    res.json({assets:rows});
  }catch{
    res.status(500).json({error:"Could not load media assets"});
  }
});

app.post("/api/media/assets/:id/approve",async(req,res)=>{
  const approved=Boolean(req.body?.approved);

  try{
    const {rows}=await pool.query(`
      UPDATE media_assets
      SET status=$2,updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[req.params.id,approved?"APPROVED":"REJECTED"]);

    if(!rows[0])return res.status(404).json({error:"Asset not found"});

    if(approved){
      await pool.query(`
        UPDATE media_variants
        SET status='APPROVED'
        WHERE asset_id=$1 AND status='REVIEW'
      `,[req.params.id]);
    }

    res.json({asset:rows[0]});
  }catch{
    res.status(500).json({error:"Could not update asset"});
  }
});

app.get("/api/media/assets/:id/variants",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT * FROM media_variants
      WHERE asset_id=$1
      ORDER BY platform
    `,[req.params.id]);

    res.json({variants:rows});
  }catch{
    res.status(500).json({error:"Could not load variants"});
  }
});

function cryptoRandomId(){
  return require("crypto").randomUUID();
}

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 40 Media API running"));


module.exports = app;
