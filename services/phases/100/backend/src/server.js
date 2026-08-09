const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  runReleaseValidation
}=require("./release-validation");
const {
  buildManifest
}=require("./release-manifest");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"
    ?{rejectUnauthorized:true}
    :false
});

const RELEASE_VERSION=
  process.env.RELEASE_VERSION||
  "1.0.0";

app.get("/health",(_req,res)=>res.json({
  status:"healthy",
  phase:100,
  release:RELEASE_VERSION
}));

app.get("/ready",async(_req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({
      ready:true,
      release:RELEASE_VERSION
    });
  }catch{
    res.status(503).json({
      ready:false
    });
  }
});

app.get("/api/security/release-validation",
(_req,res)=>{
  const result=runReleaseValidation(
    process.env
  );

  res.json({
    release:RELEASE_VERSION,
    ...result
  });
});

app.get("/api/security/evidence-manifest",
(_req,res)=>{
  const validation=
    runReleaseValidation(
      process.env
    );

  const manifest=buildManifest({
    releaseVersion:RELEASE_VERSION,
    controls:validation.checks,
    artifacts:[
      "database/phase100-release.sql",
      "backend/src/config-validator.js",
      "backend/src/release-manifest.js",
      "backend/src/release-validation.js",
      "docs/PHASE100.md",
      "docs/DEPLOYMENT-CHECKLIST.md",
      "docs/SECURITY-EVIDENCE-MANIFEST.md"
    ]
  });

  res.json(manifest);
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log(
  "CrowMods Phase 100 Release Validation API running"
));


module.exports = app;
