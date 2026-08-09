const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildPayload}=require("./discord");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:25}));

app.post("/api/discord/draft",async(req,res)=>{
  try{
    const payload=buildPayload({
      title:req.body?.title,
      description:req.body?.description,
      version:req.body?.version,
      releaseUrl:req.body?.releaseUrl,
      features:Array.isArray(req.body?.features)?req.body.features:[],
      content:req.body?.content||""
    });

    res.json({
      payload,
      status:"DRAFT",
      requiresHumanApproval:true
    });
  }catch{
    res.status(400).json({error:"Could not build Discord draft"});
  }
});

app.post("/api/discord/posts",async(req,res)=>{
  const {
    releaseId=null,
    destinationId,
    content={},
    scheduledFor=null
  }=req.body||{};

  if(!destinationId)
    return res.status(400).json({error:"destinationId is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO discord_posts
        (release_id,destination_id,content,status,scheduled_for)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      releaseId,destinationId,JSON.stringify(content),
      scheduledFor?"SCHEDULED":"PENDING_APPROVAL",
      scheduledFor
    ]);

    res.status(201).json({post:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not create Discord post"});
  }
});

app.get("/api/discord/posts",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT p.*,d.name AS destination_name,d.channel_id
      FROM discord_posts p
      JOIN discord_destinations d ON d.id=p.destination_id
      ORDER BY p.created_at DESC LIMIT 100
    `);
    res.json({posts:rows});
  }catch{
    res.status(500).json({error:"Could not load Discord posts"});
  }
});

app.post("/api/discord/publish/:id",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT p.*,d.channel_id
      FROM discord_posts p
      JOIN discord_destinations d ON d.id=p.destination_id
      WHERE p.id=$1
    `,[req.params.id]);

    const post=rows[0];
    if(!post)return res.status(404).json({error:"Post not found"});

    if(!["APPROVED","SCHEDULED"].includes(post.status))
      return res.status(409).json({error:"Post is not approved for publishing"});

    // Official Discord API connector intentionally isolated from this phase.
    res.status(501).json({
      error:"Discord API connector not configured.",
      postId:post.id,
      channelId:post.channel_id
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Publishing preparation failed"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 25 Discord API running"));


module.exports = app;
