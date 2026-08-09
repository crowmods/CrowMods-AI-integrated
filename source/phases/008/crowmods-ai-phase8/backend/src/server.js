const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const fs=require("fs");
const path=require("path");
const crypto=require("crypto");
const {publishAnnouncement}=require("./discord");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const ROOT=path.resolve(__dirname,"..");
const DATA=path.join(ROOT,"storage","releases.json");
if(!fs.existsSync(DATA))fs.writeFileSync(DATA,"[]");

function load(){return JSON.parse(fs.readFileSync(DATA,"utf8"));}
function save(x){fs.writeFileSync(DATA,JSON.stringify(x,null,2));}
function audit(item,action,note=""){
  item.audit=item.audit||[];
  item.audit.push({id:crypto.randomUUID(),action,note,at:new Date().toISOString()});
}

app.get("/health",(_req,res)=>res.json({ok:true,phase:8}));

app.post("/api/releases/:id/discord/announce",async(req,res)=>{
  const releases=load();
  const item=releases.find(x=>x.id===req.params.id);
  if(!item)return res.status(404).json({error:"Release not found"});
  if(item.status!=="PUBLISHED")
    return res.status(409).json({error:"Release must be website-published first"});
  if(item.discord?.status==="PUBLISHED")
    return res.status(409).json({error:"Discord announcement already published"});

  item.discord={status:"PUBLISHING",startedAt:new Date().toISOString()};
  save(releases);

  try{
    const result=await publishAnnouncement(item);
    item.discord=result.dryRun
      ? {status:"DRY_RUN",payload:result.payload,at:new Date().toISOString()}
      : {status:"PUBLISHED",messageId:result.id||null,at:new Date().toISOString()};
    audit(item,result.dryRun?"DISCORD_DRY_RUN":"DISCORD_PUBLISHED");
    save(releases);
    res.json({message:result.dryRun?"Discord announcement generated":"Discord announcement published",discord:item.discord});
  }catch(err){
    item.discord={status:"FAILED",error:String(err.message||err),at:new Date().toISOString()};
    audit(item,"DISCORD_FAILED",item.discord.error);
    save(releases);
    res.status(502).json({error:item.discord.error});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 8 API running"));
