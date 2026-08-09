const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { publishCampaign } = require("./telegram");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "storage", "releases.json");
if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, "[]");

function load(){return JSON.parse(fs.readFileSync(DATA,"utf8"));}
function save(x){fs.writeFileSync(DATA,JSON.stringify(x,null,2));}
function audit(item,action,note=""){
  item.audit=item.audit||[];
  item.audit.push({id:crypto.randomUUID(),action,note,at:new Date().toISOString()});
}

app.get("/health",(_req,res)=>res.json({ok:true,phase:7}));

app.post("/api/releases/:id/campaign", (req,res)=>{
  const releases=load();
  const item=releases.find(x=>x.id===req.params.id);
  if(!item)return res.status(404).json({error:"Release not found"});
  if(item.status!=="PUBLISHED")return res.status(409).json({error:"Release must be website-published first"});

  const template=["release","update","featured"].includes(req.body?.template)
    ? req.body.template : "release";

  item.campaign={
    template,
    imageUrl: typeof req.body?.imageUrl==="string" ? req.body.imageUrl : null,
    scheduledFor: req.body?.scheduledFor || null,
    status: req.body?.scheduledFor ? "SCHEDULED" : "READY"
  };
  audit(item,"CAMPAIGN_CREATED",template);
  save(releases);
  res.json({message:"Campaign prepared",campaign:item.campaign,release:item});
});

app.post("/api/releases/:id/campaign/publish",async(req,res)=>{
  const releases=load();
  const item=releases.find(x=>x.id===req.params.id);
  if(!item)return res.status(404).json({error:"Release not found"});
  if(item.status!=="PUBLISHED")return res.status(409).json({error:"Release must be published on website first"});
  if(item.telegram?.status==="PUBLISHED")return res.status(409).json({error:"Telegram already published"});

  const template=item.campaign?.template || "release";
  item.telegram={status:"PUBLISHING",startedAt:new Date().toISOString()};
  save(releases);

  try{
    const result=await publishCampaign(item,template);
    item.telegram=result.dryRun
      ? {status:"DRY_RUN",campaign:result.campaign,at:new Date().toISOString()}
      : {status:"PUBLISHED",messageId:result.result?.message_id||null,at:new Date().toISOString()};
    audit(item,result.dryRun?"TELEGRAM_CAMPAIGN_DRY_RUN":"TELEGRAM_CAMPAIGN_PUBLISHED");
    save(releases);
    res.json({message:result.dryRun?"Campaign generated":"Campaign published",telegram:item.telegram});
  }catch(err){
    item.telegram={status:"FAILED",error:String(err.message||err),at:new Date().toISOString()};
    audit(item,"TELEGRAM_CAMPAIGN_FAILED",item.telegram.error);
    save(releases);
    res.status(502).json({error:item.telegram.error});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 7 API running"));


module.exports = app;
