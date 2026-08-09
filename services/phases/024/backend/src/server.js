const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {buildPost}=require("./telegram");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:24}));

app.post("/api/telegram/draft",async(req,res)=>{
  try{
    const post=buildPost({
      title:req.body?.title,
      version:req.body?.version,
      description:req.body?.description,
      releaseUrl:req.body?.releaseUrl,
      features:Array.isArray(req.body?.features)?req.body.features:[]
    });
    res.json({
      post,
      status:"DRAFT",
      requiresHumanApproval:true
    });
  }catch{
    res.status(400).json({error:"Could not build Telegram draft"});
  }
});

app.post("/api/telegram/posts",async(req,res)=>{
  const {
    releaseId=null,
    channelId,
    textContent,
    mediaObjectKey=null,
    buttons=[],
    scheduledFor=null
  }=req.body||{};

  if(!channelId||!textContent)
    return res.status(400).json({error:"channelId and textContent are required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO telegram_posts
        (release_id,channel_id,text_content,media_object_key,buttons,status,scheduled_for)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[
      releaseId,channelId,textContent,mediaObjectKey,
      JSON.stringify(buttons),
      scheduledFor?"SCHEDULED":"PENDING_APPROVAL",
      scheduledFor
    ]);

    res.status(201).json({post:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not create Telegram post"});
  }
});

app.get("/api/telegram/posts",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT p.*,c.name AS channel_name,c.chat_id
      FROM telegram_posts p
      JOIN telegram_channels c ON c.id=p.channel_id
      ORDER BY p.created_at DESC LIMIT 100
    `);
    res.json({posts:rows});
  }catch{
    res.status(500).json({error:"Could not load Telegram posts"});
  }
});

/*
  Adapter boundary:
  Production connector should call the official Telegram Bot API using a
  server-side bot token. Do not expose the token to the browser.
*/
app.post("/api/telegram/publish/:id",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT p.*,c.chat_id
      FROM telegram_posts p
      JOIN telegram_channels c ON c.id=p.channel_id
      WHERE p.id=$1
    `,[req.params.id]);

    const post=rows[0];
    if(!post)return res.status(404).json({error:"Post not found"});

    if(!["APPROVED","SCHEDULED"].includes(post.status))
      return res.status(409).json({error:"Post is not approved for publishing"});

    // Connector intentionally not included in this phase.
    res.status(501).json({
      error:"Telegram API connector not configured.",
      postId:post.id,
      chatId:post.chat_id
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Publishing preparation failed"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 24 Telegram API running"));


module.exports = app;
