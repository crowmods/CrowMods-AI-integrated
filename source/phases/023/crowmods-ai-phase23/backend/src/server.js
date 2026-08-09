const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const crypto=require("crypto");
const {validateMedia,objectKey}=require("./media");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:23}));

app.post("/api/media/create",async(req,res)=>{
  const input={
    releaseId:req.body?.releaseId||null,
    assetType:String(req.body?.assetType||""),
    originalName:String(req.body?.originalName||""),
    contentType:String(req.body?.contentType||""),
    sizeBytes:Number(req.body?.sizeBytes||0)
  };

  const maxBytes=Number(process.env.MAX_MEDIA_BYTES||20971520);
  const check=validateMedia(input,maxBytes);
  if(!check.valid)return res.status(400).json({error:"Media rejected",issues:check.issues});

  const id=crypto.randomUUID();

  try{
    const {rows}=await pool.query(`
      INSERT INTO media_assets
      (id,release_id,asset_type,original_name,object_key,content_type,size_bytes)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[id,input.releaseId,input.assetType,input.originalName,
       objectKey(id,input.originalName),input.contentType,input.sizeBytes]);

    res.status(201).json({
      asset:rows[0],
      next:"Upload to private media quarantine storage using a short-lived signed URL."
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not create media asset"});
  }
});

app.get("/api/releases/:id/media",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT id,asset_type,original_name,content_type,width,height,size_bytes,
             status,alt_text,metadata,created_at
      FROM media_assets
      WHERE release_id=$1 AND status='READY'
      ORDER BY asset_type,created_at
    `,[req.params.id]);
    res.json({assets:rows});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not load media"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 23 Media API running"));
