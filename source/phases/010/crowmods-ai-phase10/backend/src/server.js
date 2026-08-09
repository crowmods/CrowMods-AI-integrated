const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const rateLimit=require("express-rate-limit");
const {requestId,audit,safeRole}=require("./security");

const app=express();

const origin=process.env.CORS_ORIGIN || "http://localhost:3000";
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({origin}));
app.use(express.json({limit:"1mb"}));

if(String(process.env.TRUST_PROXY).toLowerCase()==="true"){
  app.set("trust proxy",1);
}

const limiter=rateLimit({
  windowMs:Number(process.env.RATE_LIMIT_WINDOW_MS||900000),
  limit:Number(process.env.RATE_LIMIT_MAX||100),
  standardHeaders:"draft-8",
  legacyHeaders:false,
  message:{error:"Too many requests. Try again later."}
});
app.use(limiter);

app.use((req,res,next)=>{
  const id=requestId(req);
  res.setHeader("X-Request-ID",id);
  req.requestId=id;
  next();
});

app.get("/health",(_req,res)=>{
  res.json({ok:true,service:"crowmods",phase:10,status:"healthy"});
});

app.get("/ready",(_req,res)=>{
  // Production should check database, queue and object-storage dependencies.
  res.json({ready:true,dependencies:{database:"prototype",storage:"prototype",queue:"prototype"}});
});

app.get("/api/security/config",(_req,res)=>{
  res.json({
    phase:10,
    httpsRequiredInProduction:true,
    rateLimitEnabled:true,
    auditLogging:true,
    roleModel:["owner","reviewer","publisher","analyst"],
    secretStorage:"environment-or-managed-secret-store"
  });
});

app.post("/api/security/audit-test",(req,res)=>{
  audit({
    requestId:req.requestId,
    action:"SECURITY_AUDIT_TEST",
    actorRole:safeRole(req.body?.role),
    ip: req.ip
  });
  res.status(201).json({ok:true,requestId:req.requestId});
});

app.use((err,req,res,_next)=>{
  audit({
    requestId:req.requestId,
    action:"UNHANDLED_ERROR",
    error:String(err.message||err)
  });
  res.status(500).json({error:"Internal server error",requestId:req.requestId});
});

app.listen(process.env.PORT||4000,()=>console.log("CrowShield Phase 10 API running"));
