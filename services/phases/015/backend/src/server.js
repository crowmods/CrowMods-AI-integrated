const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const rateLimit=require("express-rate-limit");
const {Pool}=require("pg");
const crypto=require("crypto");
const {hashToken,createOpaqueToken,verifyPassword,requireRole}=require("./auth");

const app=express();
app.use(helmet());
app.use(cors({origin:process.env.CORS_ORIGIN||"http://localhost:3000"}));
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const loginLimiter=rateLimit({
  windowMs:15*60*1000,
  limit:10,
  standardHeaders:"draft-8",
  legacyHeaders:false
});

async function authenticate(req,res,next){
  const raw=req.headers.authorization||"";
  if(!raw.startsWith("Bearer ")) return next();
  const token=raw.slice(7);
  const tokenHash=hashToken(token);

  try{
    const result=await pool.query(`
      SELECT u.id,u.email,u.display_name,u.role,u.is_active
      FROM auth_sessions s
      JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=$1
        AND s.revoked_at IS NULL
        AND s.expires_at>NOW()
        AND u.is_active=true
    `,[tokenHash]);

    if(result.rows[0]){
      req.user=result.rows[0];
      await pool.query("UPDATE auth_sessions SET last_seen_at=NOW() WHERE token_hash=$1",[tokenHash]);
    }
  }catch(err){
    console.error(err);
    return res.status(503).json({error:"Authentication service unavailable."});
  }
  next();
}

app.use(authenticate);

app.get("/health",(_req,res)=>res.json({ok:true,phase:15}));
app.get("/api/auth/me",(req,res)=>{
  if(!req.user)return res.status(401).json({error:"Not authenticated."});
  res.json({user:req.user});
});

app.post("/api/auth/login",loginLimiter,async(req,res)=>{
  const email=String(req.body?.email||"").trim().toLowerCase();
  const password=String(req.body?.password||"");
  if(!email||!password)return res.status(400).json({error:"Email and password are required."});

  try{
    const result=await pool.query(`
      SELECT u.id,u.email,u.display_name,u.role,u.is_active,
             c.password_hash,c.locked_until
      FROM users u JOIN user_credentials c ON c.user_id=u.id
      WHERE u.email=$1
    `,[email]);

    const user=result.rows[0];
    if(!user||!user.is_active|| (user.locked_until && new Date(user.locked_until)>new Date()))
      return res.status(401).json({error:"Invalid credentials."});

    const valid=await verifyPassword(user.password_hash,password);
    if(!valid){
      await pool.query(`
        UPDATE user_credentials
        SET failed_login_count=failed_login_count+1
        WHERE user_id=$1
      `,[user.id]);
      return res.status(401).json({error:"Invalid credentials."});
    }

    const rawToken=createOpaqueToken();
    const ttl=Number(process.env.SESSION_TTL_HOURS||24);
    const expires=new Date(Date.now()+ttl*3600*1000);

    await pool.query(`
      INSERT INTO auth_sessions(user_id,token_hash,expires_at)
      VALUES($1,$2,$3)
    `,[user.id,hashToken(rawToken),expires]);

    await pool.query(`
      INSERT INTO audit_events(actor_id,action,entity_type,entity_id,metadata)
      VALUES($1,'LOGIN_SUCCESS','USER',$1,$2)
    `,[user.id,{method:"password"}]);

    res.json({
      user:{id:user.id,email:user.email,displayName:user.display_name,role:user.role},
      accessToken:rawToken,
      expiresAt:expires.toISOString()
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Login failed."});
  }
});

app.post("/api/auth/logout",async(req,res)=>{
  const raw=req.headers.authorization||"";
  if(raw.startsWith("Bearer ")){
    await pool.query("UPDATE auth_sessions SET revoked_at=NOW() WHERE token_hash=$1",[hashToken(raw.slice(7))]);
  }
  res.json({ok:true});
});

// Sensitive admin example: approval actions must be protected server-side.
app.get("/api/admin/security-test",requireRole("owner","reviewer"),(req,res)=>{
  res.json({ok:true,message:"Protected admin route",role:req.user.role});
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 15 API running"));


module.exports = app;
