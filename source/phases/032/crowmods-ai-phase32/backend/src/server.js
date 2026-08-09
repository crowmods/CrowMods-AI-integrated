const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  hashPassword,verifyPassword,randomToken,sha256,hasPremiumAccess
}=require("./auth");

const app=express();
app.use(helmet());
app.use(cors({origin:false}));
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

async function getUserFromToken(token){
  if(!token)return null;

  const {rows}=await pool.query(`
    SELECT u.*
    FROM user_sessions s
    JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=$1
      AND s.revoked_at IS NULL
      AND s.expires_at>NOW()
      AND u.is_active=TRUE
  `,[sha256(token)]);

  return rows[0]||null;
}

async function auth(req,res,next){
  const header=String(req.headers.authorization||"");
  const token=header.startsWith("Bearer ")?header.slice(7):null;
  const user=await getUserFromToken(token);

  if(!user)return res.status(401).json({error:"Authentication required"});

  req.user=user;
  next();
}

async function admin(req,res,next){
  if(req.user?.role!=="ADMIN")
    return res.status(403).json({error:"Admin access required"});
  next();
}

app.get("/health",(_req,res)=>res.json({ok:true,phase:32}));

app.post("/api/auth/register",async(req,res)=>{
  const email=String(req.body?.email||"").trim().toLowerCase();
  const password=String(req.body?.password||"");
  const displayName=String(req.body?.displayName||"").trim()||null;

  if(!email||password.length<10)
    return res.status(400).json({error:"Valid email and password of at least 10 characters required"});

  try{
    const passwordHash=await hashPassword(password);
    const {rows}=await pool.query(`
      INSERT INTO users(email,password_hash,display_name)
      VALUES($1,$2,$3)
      RETURNING id,email,display_name,role,email_verified,premium_until,created_at
    `,[email,passwordHash,displayName]);

    await pool.query(`
      INSERT INTO user_audit_events(user_id,event_name)
      VALUES($1,'ACCOUNT_CREATED')
    `,[rows[0].id]);

    res.status(201).json({
      user:rows[0],
      next:"Send a verification email using the email-provider adapter."
    });
  }catch(err){
    if(err.code==="23505")return res.status(409).json({error:"Account already exists"});
    console.error(err);
    res.status(500).json({error:"Could not create account"});
  }
});

app.post("/api/auth/login",async(req,res)=>{
  const email=String(req.body?.email||"").trim().toLowerCase();
  const password=String(req.body?.password||"");

  try{
    const {rows}=await pool.query(`SELECT * FROM users WHERE email=$1`,[email]);
    const user=rows[0];

    if(!user || !(await verifyPassword(password,user.password_hash)))
      return res.status(401).json({error:"Invalid credentials"});

    const token=randomToken();
    const days=Number(process.env.SESSION_DAYS||30);

    await pool.query(`
      INSERT INTO user_sessions(user_id,token_hash,expires_at)
      VALUES($1,$2,NOW()+($3::int*INTERVAL '1 day'))
    `,[user.id,sha256(token),days]);

    await pool.query(`
      INSERT INTO user_audit_events(user_id,event_name)
      VALUES($1,'LOGIN')
    `,[user.id]);

    res.json({
      token,
      user:{
        id:user.id,email:user.email,displayName:user.display_name,
        role:user.role,emailVerified:user.email_verified,
        premium:hasPremiumAccess(user),
        premiumUntil:user.premium_until
      }
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Login failed"});
  }
});

app.post("/api/auth/logout",auth,async(req,res)=>{
  const header=String(req.headers.authorization||"");
  const token=header.startsWith("Bearer ")?header.slice(7):null;

  await pool.query(`
    UPDATE user_sessions SET revoked_at=NOW()
    WHERE token_hash=$1
  `,[sha256(token)]);

  res.json({ok:true});
});

app.get("/api/account/me",auth,(req,res)=>{
  res.json({
    user:{
      id:req.user.id,
      email:req.user.email,
      displayName:req.user.display_name,
      role:req.user.role,
      emailVerified:req.user.email_verified,
      premium:hasPremiumAccess(req.user),
      premiumUntil:req.user.premium_until,
      createdAt:req.user.created_at
    }
  });
});

app.get("/api/admin/users",auth,admin,async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT id,email,display_name,role,email_verified,premium_until,
             is_active,created_at
      FROM users
      ORDER BY created_at DESC LIMIT 500
    `);
    res.json({users:rows});
  }catch{
    res.status(500).json({error:"Could not load users"});
  }
});

app.post("/api/admin/users/:id/premium",auth,admin,async(req,res)=>{
  const days=Math.min(Math.max(Number(req.body?.days||30),1),3650);

  try{
    const {rows}=await pool.query(`
      UPDATE users
      SET premium_until=GREATEST(COALESCE(premium_until,NOW()),NOW())
          +($2::int*INTERVAL '1 day'),
          updated_at=NOW()
      WHERE id=$1
      RETURNING id,email,premium_until
    `,[req.params.id,days]);

    if(!rows[0])return res.status(404).json({error:"User not found"});

    await pool.query(`
      INSERT INTO user_audit_events(user_id,event_name,metadata)
      VALUES($1,'PREMIUM_GRANTED',$2)
    `,[req.params.id,JSON.stringify({days})]);

    res.json({user:rows[0]});
  }catch{
    res.status(500).json({error:"Could not update premium access"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 32 Accounts API running"));
