const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const fs=require("fs/promises");
const path=require("path");
const crypto=require("crypto");
const {Pool}=require("pg");
const {sha256File,safeObjectKey,allowedFile}=require("./storage");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const maxBytes=Number(process.env.MAX_UPLOAD_BYTES||104857600);
const quarantineDir=process.env.UPLOAD_DIR||"/var/lib/crowmods/quarantine";
const releaseDir=process.env.RELEASE_DIR||"/var/lib/crowmods/releases";

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:38,
  service:"upload-pipeline"
}));

/*
  Reference JSON-upload endpoint.
  Production should use streaming multipart uploads directly to private object
  storage. Never buffer large untrusted files in application memory.
*/
app.post("/api/uploads/register",async(req,res)=>{
  const {
    originalName,
    contentType="application/octet-stream",
    sizeBytes,
    sha256,
    uploaderRef=null,
    metadata={}
  }=req.body||{};

  if(!originalName||!sizeBytes||!sha256)
    return res.status(400).json({
      error:"originalName, sizeBytes and sha256 are required"
    });

  const validation=allowedFile(
    originalName,
    contentType,
    Number(sizeBytes),
    maxBytes
  );

  if(!validation.ok)
    return res.status(400).json({error:validation.reason});

  if(!/^[a-f0-9]{64}$/i.test(sha256))
    return res.status(400).json({error:"Invalid SHA-256 hash"});

  const id=crypto.randomUUID();
  const objectKey=safeObjectKey(id,originalName);

  try{
    const {rows}=await pool.query(`
      INSERT INTO uploads
        (id,original_name,object_key,content_type,size_bytes,sha256,uploader_ref,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `,[
      id,originalName,objectKey,contentType,
      Number(sizeBytes),sha256.toLowerCase(),uploaderRef,metadata
    ]);

    res.status(201).json({
      upload:rows[0],
      storageZone:"QUARANTINE",
      next:"Upload bytes to private quarantine storage, then invoke the scan worker."
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not register upload"});
  }
});

app.post("/api/uploads/:id/scan-result",async(req,res)=>{
  const {
    scanner="security-adapter",
    status,
    result={}
  }=req.body||{};

  const valid=["CLEAN","INFECTED","ERROR"];
  if(!valid.includes(status))
    return res.status(400).json({error:"Invalid scan status"});

  const client=await pool.connect();
  try{
    await client.query("BEGIN");

    const upload=(await client.query(`
      SELECT * FROM uploads WHERE id=$1 FOR UPDATE
    `,[req.params.id])).rows[0];

    if(!upload){
      await client.query("ROLLBACK");
      return res.status(404).json({error:"Upload not found"});
    }

    await client.query(`
      UPDATE uploads
      SET scan_status=$2,scanned_at=NOW()
      WHERE id=$1
    `,[upload.id,status]);

    await client.query(`
      INSERT INTO upload_scan_events(upload_id,scanner,status,result)
      VALUES($1,$2,$3,$4)
    `,[upload.id,scanner,status,result]);

    await client.query("COMMIT");

    res.json({
      uploadId:upload.id,
      scanStatus:status,
      approvalAllowed:status==="CLEAN"
    });
  }catch(err){
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({error:"Could not record scan result"});
  }finally{
    client.release();
  }
});

app.post("/api/uploads/:id/approve",async(req,res)=>{
  const approved=Boolean(req.body?.approved);

  try{
    const {rows}=await pool.query(`
      UPDATE uploads
      SET approval_status=$2,
          approved_at=CASE WHEN $2='APPROVED' THEN NOW() ELSE NULL END
      WHERE id=$1
        AND scan_status='CLEAN'
      RETURNING *
    `,[req.params.id,approved?"APPROVED":"REJECTED"]);

    if(!rows[0])
      return res.status(409).json({
        error:"Upload must have a CLEAN scan before approval."
      });

    res.json({
      upload:rows[0],
      releaseEligible:approved
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not update approval"});
  }
});

app.get("/api/uploads",async(req,res)=>{
  try{
    const status=req.query.status||null;
    const query=status?`
      SELECT * FROM uploads
      WHERE approval_status=$1
      ORDER BY created_at DESC LIMIT 100
    `:`
      SELECT * FROM uploads
      ORDER BY created_at DESC LIMIT 100
    `;

    const {rows}=await pool.query(query,status?[status]:[]);
    res.json({uploads:rows});
  }catch{
    res.status(500).json({error:"Could not load uploads"});
  }
});

app.get("/api/uploads/:id/download-url",async(req,res)=>{
  try{
    const upload=(await pool.query(`
      SELECT * FROM uploads
      WHERE id=$1
        AND approval_status='APPROVED'
        AND scan_status='CLEAN'
        AND storage_zone='RELEASE'
    `,[req.params.id])).rows[0];

    if(!upload)
      return res.status(404).json({error:"Approved release not available"});

    /*
      Replace this with an object-storage SDK that creates a short-lived
      signed URL. Never expose the storage root or private object key directly.
    */
    res.json({
      uploadId:upload.id,
      signedUrl:null,
      expiresInSeconds:300,
      message:"Configure the private object-storage adapter to issue the signed URL."
    });
  }catch{
    res.status(500).json({error:"Could not create download URL"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 38 Upload API running"));


module.exports = app;
