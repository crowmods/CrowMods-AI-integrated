const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {findFaq,moderationSignals,buildDraft}=require("./community");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:28}));

app.post("/api/community/analyze",async(req,res)=>{
  const {platform="unknown",channelRef="unknown",authorRef=null,content}=req.body||{};
  if(!content)return res.status(400).json({error:"content is required"});

  try{
    const inserted=await pool.query(`
      INSERT INTO community_messages
        (platform,channel_ref,author_ref,content)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[platform,channelRef,authorRef,String(content)]);

    const faqs=(await pool.query(`
      SELECT id,question,answer,keywords
      FROM community_faq WHERE is_active=TRUE
    `)).rows;

    const faqMatch=findFaq(content,faqs);
    const signals=moderationSignals(content);
    const draft=buildDraft(content,faqMatch);

    const message=inserted.rows[0];

    await pool.query(`
      INSERT INTO community_reply_drafts
        (message_id,reply_text,confidence,reason)
      VALUES($1,$2,$3,$4)
    `,[message.id,draft.replyText,draft.confidence,draft.reason]);

    const high=signals.some(x=>x.severity==="HIGH");
    if(high){
      await pool.query(`
        INSERT INTO community_escalations(message_id,reason,severity)
        VALUES($1,$2,$3)
      `,[message.id,"Potential sensitive-information issue","HIGH"]);
    }

    res.status(201).json({
      messageId:message.id,
      faqMatch:faqMatch ? {id:faqMatch.faq.id,score:faqMatch.score}:null,
      signals,
      draft,
      requiresHumanApproval:true
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Community analysis failed"});
  }
});

app.get("/api/community/escalations",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT e.*,m.platform,m.channel_ref,m.content
      FROM community_escalations e
      JOIN community_messages m ON m.id=e.message_id
      WHERE e.status='OPEN'
      ORDER BY e.created_at DESC LIMIT 100
    `);
    res.json({escalations:rows});
  }catch{
    res.status(500).json({error:"Could not load escalations"});
  }
});

app.get("/api/community/drafts",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT d.*,m.platform,m.channel_ref,m.content
      FROM community_reply_drafts d
      JOIN community_messages m ON m.id=d.message_id
      WHERE d.status='DRAFT'
      ORDER BY d.created_at DESC LIMIT 100
    `);
    res.json({drafts:rows});
  }catch{
    res.status(500).json({error:"Could not load drafts"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 28 Community API running"));


module.exports = app;
