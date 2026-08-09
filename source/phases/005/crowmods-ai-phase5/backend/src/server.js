const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "storage", "releases.json");
const PUBLIC = path.join(ROOT, "storage", "public");
fs.mkdirSync(PUBLIC, {recursive:true});
if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, "[]");

function load(){ return JSON.parse(fs.readFileSync(DATA,"utf8")); }
function save(x){ fs.writeFileSync(DATA, JSON.stringify(x,null,2)); }
function audit(item, action, note=""){
  item.audit = item.audit || [];
  item.audit.push({id:crypto.randomUUID(), action, note, at:new Date().toISOString()});
}

app.get("/health", (_req,res)=>res.json({ok:true, phase:5}));

app.get("/api/public/releases", (_req,res)=>{
  const releases = load().filter(x=>x.status==="PUBLISHED").map(x=>({
    id:x.id, slug:x.publicPage?.slug, title:x.aiBrief?.title || x.originalName,
    description:x.aiBrief?.description || "", category:x.aiBrief?.suggestedCategory,
    tags:x.aiBrief?.tags || [], publishedAt:x.publishedAt
  }));
  res.json({releases});
});

app.get("/api/public/releases/:slug", (req,res)=>{
  const item = load().find(x=>x.status==="PUBLISHED" && x.publicPage?.slug===req.params.slug);
  if(!item) return res.status(404).json({error:"Release not found"});
  res.json({release:{
    id:item.id, slug:item.publicPage.slug, title:item.aiBrief?.title || item.originalName,
    description:item.aiBrief?.description || "",
    category:item.aiBrief?.suggestedCategory || "Uncategorized",
    tags:item.aiBrief?.tags || [], sha256:item.sha256, sizeBytes:item.sizeBytes,
    publishedAt:item.publishedAt
  }});
});

// Publishing gate. Production must authenticate this endpoint and use private object storage.
app.post("/api/releases/:id/publish", (req,res)=>{
  const releases=load();
  const item=releases.find(x=>x.id===req.params.id);
  if(!item) return res.status(404).json({error:"Release not found"});
  if(item.status!=="APPROVED") return res.status(409).json({error:"Only approved releases can be published"});
  if(req.body?.authorizationConfirmed!==true)
    return res.status(400).json({error:"Distribution authorization must be confirmed"});

  item.status="PUBLISHING";

  const rawTitle=item.aiBrief?.title || item.originalName.replace(/\.apk$/i,"");
  const slug=rawTitle.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80)
    || item.id;

  item.publicPage={
    slug,
    url:`/apps/${slug}`,
    downloadReady:false,
    seoTitle:item.aiBrief?.seoTitle || `${rawTitle} | CrowMods`,
    seoDescription:item.aiBrief?.seoDescription || ""
  };

  // Prototype deliberately does not copy the APK into public storage.
  item.publicPage.downloadReady=false;
  item.status="PUBLISHED";
  item.publishedAt=new Date().toISOString();
  audit(item,"PUBLISHED","Website listing created; binary remains non-public until storage publisher is configured.");
  save(releases);

  res.json({message:"Website listing published",release:item});
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 5 API running"));
