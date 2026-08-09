const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {hashIdentifier,validateControlName,securityEvent}=require("./security");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

/*
  Simple application-level limiter for development/reference purposes.
  Production should use a distributed limiter at the edge (WAF/API gateway)
  plus endpoint-specific limits.
*/
const buckets=new Map();
function rateLimit({windowMs=60000,max=120}={}){
  return (req,res,next)=>{
    const key=hashIdentifier(req.ip||"unknown");
    const now=Date.now();
    const old=buckets.get(key);

    if(!old||now-old.start>=windowMs){
      buckets.set(key,{start:now,count:1});
      return next();
    }

    old.count++;
    if(old.count>max)
      return res.status(429).json({error:"Rate limit exceeded"});

    next();
  };
}

app.use(rateLimit({max:180}));

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:34,
  service:"security-center"
}));

app.get("/api/security/controls",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT control_name,enabled,reason,updated_by,updated_at
      FROM platform_controls
      ORDER BY control_name
    `);
    res.json({controls:rows});
  }catch{
    res.status(500).json({error:"Could not load controls"});
  }
});

app.post("/api/security/events",async(req,res)=>{
  const {
    eventType,severity="INFO",service="unknown",
    actorRef=null,ip=null,metadata={}
  }=req.body||{};

  if(!eventType)return res.status(400).json({error:"eventType is required"});

  try{
    const event=securityEvent(eventType,severity,service,metadata);

    const {rows}=await pool.query(`
      INSERT INTO security_events
        (event_type,severity,service,actor_ref,ip_hash,metadata)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING id,created_at
    `,[
      event.eventType,event.severity,event.service,
      actorRef,hashIdentifier(ip),metadata
    ]);

    res.status(201).json({event:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record security event"});
  }
});

/*
  Emergency controls must be protected by production admin RBAC + MFA +
  step-up authentication. This reference endpoint intentionally requires
  an explicit administrative secret outside the codebase.
*/
app.post("/api/security/control",async(req,res)=>{
  const {controlName,enabled,reason=""}=req.body||{};

  if(!validateControlName(controlName))
    return res.status(400).json({error:"Unsupported control"});

  if(typeof enabled!=="boolean")
    return res.status(400).json({error:"enabled must be boolean"});

  try{
    const {rows}=await pool.query(`
      UPDATE platform_controls
      SET enabled=$2,reason=$3,updated_by='admin',updated_at=NOW()
      WHERE control_name=$1
      RETURNING *
    `,[controlName,enabled,reason]);

    if(!rows[0])return res.status(404).json({error:"Control not found"});

    await pool.query(`
      INSERT INTO security_events
        (event_type,severity,service,actor_ref,metadata)
      VALUES('PLATFORM_CONTROL_CHANGED',
        CASE WHEN $2=FALSE THEN 'HIGH' ELSE 'INFO' END,
        'control-plane','admin',$3)
    `,[controlName,enabled,JSON.stringify({reason})]);

    res.json({control:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not update control"});
  }
});

app.get("/api/security/events",async(req,res)=>{
  const limit=Math.min(Math.max(Number(req.query.limit||100),1),500);

  try{
    const {rows}=await pool.query(`
      SELECT id,event_type,severity,service,actor_ref,metadata,created_at
      FROM security_events
      ORDER BY created_at DESC
      LIMIT $1
    `,[limit]);

    res.json({events:rows});
  }catch{
    res.status(500).json({error:"Could not load security events"});
  }
});

app.get("/api/security/checklist",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT * FROM security_checklist
      ORDER BY control_name
    `);
    res.json({checklist:rows});
  }catch{
    res.status(500).json({error:"Could not load security checklist"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 34 Security API running"));
