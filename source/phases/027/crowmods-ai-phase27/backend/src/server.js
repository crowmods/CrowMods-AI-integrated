const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {recommendStrategy}=require("./strategy");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:27}));

app.post("/api/strategy/recommend",async(req,res)=>{
  try{
    const recommendation=recommendStrategy(req.body||{});
    res.json({
      recommendation,
      advisoryOnly:true,
      requiresApprovalForPublishing:true
    });
  }catch(err){
    res.status(400).json({error:err.message});
  }
});

app.post("/api/strategy/:releaseId/save",async(req,res)=>{
  try{
    const recommendation=recommendStrategy(req.body||{});
    const {rows}=await pool.query(`
      INSERT INTO strategy_recommendations
        (release_id,recommendation_type,recommendation,confidence)
      VALUES($1,'SOCIAL_STRATEGY',$2,$3)
      RETURNING *
    `,[req.params.releaseId,recommendation,recommendation.confidence]);

    res.status(201).json({recommendation:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not save recommendation"});
  }
});

app.get("/api/strategy/:releaseId",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT * FROM strategy_recommendations
      WHERE release_id=$1
      ORDER BY created_at DESC LIMIT 20
    `,[req.params.releaseId]);
    res.json({recommendations:rows});
  }catch{
    res.status(500).json({error:"Could not load strategy"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 27 Strategy API running"));
