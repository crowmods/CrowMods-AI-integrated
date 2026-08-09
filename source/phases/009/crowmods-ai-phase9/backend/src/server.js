const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const fs=require("fs");
const path=require("path");
const crypto=require("crypto");
const {PLATFORM_NAMES,connectionStatus,buildPlatformContent}=require("./platforms");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const ROOT=path.resolve(__dirname,"..");
const DATA=path.join(ROOT,"storage","releases.json");
if(!fs.existsSync(DATA))fs.writeFileSync(DATA,"[]");

function load(){return JSON.parse(fs.readFileSync(DATA,"utf8"));}
function save(x){fs.writeFileSync(DATA,JSON.stringify(x,null,2));}
function audit(item,action,note=""){
  item.audit=item.audit||[];
  item.audit.push({id:crypto.randomUUID(),action,note,at:new Date().toISOString()});
}

app.get("/health",(_req,res)=>res.json({ok:true,phase:9}));

app.get("/api/platforms",(_req,res)=>{
  res.json({
    platforms:PLATFORM_NAMES.map(name=>({name,status:connectionStatus(name)}))
  });
});

app.post("/api/releases/:id/social/campaign",(req,res)=>{
  const releases=load();
  const item=releases.find(x=>x.id===req.params.id);
  if(!item)return res.status(404).json({error:"Release not found"});
  if(item.status!=="PUBLISHED")
    return res.status(409).json({error:"Release must be website-published first"});

  const requested=Array.isArray(req.body?.platforms)
    ? req.body.platforms.filter(p=>PLATFORM_NAMES.includes(p))
    : PLATFORM_NAMES;

  const baseUrl=process.env.CROWMODS_PUBLIC_BASE_URL||"http://localhost:3000";
  item.socialCampaign={
    id:crypto.randomUUID(),
    status:"READY",
    createdAt:new Date().toISOString(),
    platforms:requested.map(platform=>({
      platform,
      connectionStatus:connectionStatus(platform),
      status:"READY",
      content:buildPlatformContent(item,platform,baseUrl)
    }))
  };
  audit(item,"SOCIAL_CAMPAIGN_CREATED",requested.join(","));
  save(releases);
  res.json({campaign:item.socialCampaign});
});

app.post("/api/releases/:id/social/publish",(req,res)=>{
  const releases=load();
  const item=releases.find(x=>x.id===req.params.id);
  if(!item)return res.status(404).json({error:"Release not found"});
  if(!item.socialCampaign)return res.status(409).json({error:"Create a campaign first"});

  // Phase 9 intentionally performs no live social posting. It creates
  // platform-specific publish jobs for later official API connectors.
  item.socialCampaign.status="QUEUED";
  item.socialCampaign.platforms=item.socialCampaign.platforms.map(x=>({
    ...x,
    status:x.connectionStatus==="CONNECTED" ? "QUEUED_FOR_OFFICIAL_API" : "NOT_CONNECTED"
  }));
  audit(item,"SOCIAL_CAMPAIGN_QUEUED","No live posting in Phase 9");
  save(releases);

  res.json({
    message:"Campaign queued in safe mode. Live connectors are added per platform.",
    campaign:item.socialCampaign
  });
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 9 API running"));
