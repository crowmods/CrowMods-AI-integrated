const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {hashPassword}=require("./passwords");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:14}));

app.post("/api/users/register",async(req,res)=>{
  const {email,displayName,password}=req.body||{};
  if(!email||!password)
    return res.status(400).json({error:"Email and password are required."});

  try{
    const passwordHash=await hashPassword(password);
    const client=await pool.connect();
    try{
      await client.query("BEGIN");
      const result=await client.query(`
        INSERT INTO users(email,display_name,role)
        VALUES($1,$2,'analyst')
        RETURNING id,email,display_name,role
      `,[String(email).trim().toLowerCase(),displayName||null]);

      await client.query(`
        INSERT INTO user_credentials(user_id,password_hash)
        VALUES($1,$2)
      `,[result.rows[0].id,passwordHash]);

      await client.query(`
        INSERT INTO notification_preferences(user_id)
        VALUES($1)
      `,[result.rows[0].id]);

      await client.query("COMMIT");
      res.status(201).json({user:result.rows[0]});
    }catch(err){
      await client.query("ROLLBACK");
      if(err.code==="23505")
        return res.status(409).json({error:"Account already exists."});
      throw err;
    }finally{
      client.release();
    }
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Registration failed."});
  }
});

app.get("/api/users/:id/dashboard",async(req,res)=>{
  try{
    const user=(await pool.query(`
      SELECT id,email,display_name,role,created_at
      FROM users WHERE id=$1 AND is_active=true
    `,[req.params.id])).rows[0];

    if(!user)return res.status(404).json({error:"User not found."});

    const membership=(await pool.query(`
      SELECT m.status,mp.name,mp.price_minor,mp.currency,mp.interval_name
      FROM memberships m
      LEFT JOIN membership_plans mp ON mp.id=m.plan_id
      WHERE m.user_id=$1
      ORDER BY m.created_at DESC LIMIT 1
    `,[req.params.id])).rows[0]||null;

    const favorites=(await pool.query(`
      SELECT r.id,r.original_name,r.status,r.category,r.version_name
      FROM user_favorites f
      JOIN releases r ON r.id=f.release_id
      WHERE f.user_id=$1
      ORDER BY f.created_at DESC LIMIT 50
    `,[req.params.id])).rows;

    res.json({user,membership,favorites});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Dashboard query failed."});
  }
});

app.post("/api/users/:id/favorites/:releaseId",async(req,res)=>{
  try{
    await pool.query(`
      INSERT INTO user_favorites(user_id,release_id)
      VALUES($1,$2)
      ON CONFLICT DO NOTHING
    `,[req.params.id,req.params.releaseId]);
    res.status(201).json({ok:true});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not save favorite."});
  }
});

app.delete("/api/users/:id/favorites/:releaseId",async(req,res)=>{
  try{
    await pool.query(`
      DELETE FROM user_favorites
      WHERE user_id=$1 AND release_id=$2
    `,[req.params.id,req.params.releaseId]);
    res.json({ok:true});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not remove favorite."});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 14 API running"));


module.exports = app;
