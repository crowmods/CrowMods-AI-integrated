const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { publishTelegram } = require("./telegram");

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

app.get("/health",(_req,res)=>res.json({ok:true,phase:6}));

app.post("/api/releases/:id/telegram/publish",async(req,res)=>{
  const releases=load();
  const item=releases.find(x=>x.id===req.params.id);
  if(!item)return res.status(404).json({error:"Release not found"});
  if(item.status!=="PUBLISHED")
    return res.status(409).json({error:"Website publication is required first"});

  if(item.telegram?.status==="PUBLISHED")
    return res.status(409).json({error:"Telegram post already published"});

  item.telegram={status:"PUBLISHING",startedAt:new Date().toISOString()};
  save(releases);

  try{
    const result=await publishTelegram(item);
    item.telegram={
      status:result.dryRun?"DRY_RUN":"PUBLISHED",
      publishedAt:new Date().toISOString(),
      result: result.dryRun
        ? {message:result.message,buttonUrl:result.buttonUrl}
        : {messageId:result.result?.message_id || null}
    };
    audit(item,result.dryRun?"TELEGRAM_DRY_RUN":"TELEGRAM_PUBLISHED");
    save(releases);
    res.json({message:result.dryRun?"Telegram dry-run generated":"Telegram post published",telegram:item.telegram});
  }catch(err){
    item.telegram={status:"FAILED",error:String(err.message||err),failedAt:new Date().toISOString()};
    audit(item,"TELEGRAM_FAILED",item.telegram.error);
    save(releases);
    res.status(502).json({error:"Telegram publishing failed",detail:item.telegram.error});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 6 API running"));
