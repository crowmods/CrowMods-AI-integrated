const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  classify,suggestedAction,buildAnswerDraft
}=require("./community");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:44,
  service:"community-manager"
}));

app.post("/api/community/messages",async(req,res)=>{
  const {
    platform,
    externalMessageRef=null,
    memberRef=null,
    channelRef=null,
    messageText=""
  }=req.body||{};

  if(!platform||!messageText)
    return res.status(400).json({
      error:"platform and messageText are required"
    });

  const analysis=classify(messageText);
  const action=suggestedAction(analysis.label,analysis.risk);
  const status=action==="NO_ACTION"?"RECEIVED":"REVIEW";

  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const message=(await client.query(`
      INSERT INTO community_messages
        (platform,external_message_ref,member_ref,channel_ref,
         message_text,message_type,ai_label,risk_score,suggested_action,status)
      VALUES($1,$2,$3,$4,$5,'TEXT',$6,$7,$8,$9)
      RETURNING *
    `,[
      platform,externalMessageRef,memberRef,channelRef,messageText,
      analysis.label,analysis.risk,action,status
    ])).rows[0];

    if(memberRef){
      await client.query(`
        INSERT INTO community_members
          (platform,external_member_ref,last_seen_at,message_count)
        VALUES($1,$2,NOW(),1)
        ON CONFLICT(platform,external_member_ref)
        DO UPDATE SET
          last_seen_at=NOW(),
          message_count=community_members.message_count+1
      `,[platform,memberRef]);
    }

    await client.query(`
      INSERT INTO community_events(message_id,event_type,metadata)
      VALUES($1,'MESSAGE_CLASSIFIED',$2)
    `,[message.id,{
      label:analysis.label,
      risk:analysis.risk,
      suggestedAction:action
    }]);

    await client.query("COMMIT");

    res.status(201).json({
      message,
      analysis,
      answerDraft:
        action==="DRAFT_ANSWER"
          ?buildAnswerDraft(messageText)
          :null
    });
  }catch(err){
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({error:"Could not process community message"});
  }finally{
    client.release();
  }
});

app.get("/api/community/review",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM community_messages
      WHERE status='REVIEW'
      ORDER BY created_at DESC
      LIMIT 200
    `);
    res.json({messages:rows});
  }catch{
    res.status(500).json({error:"Could not load review queue"});
  }
});

app.post("/api/community/messages/:id/action",async(req,res)=>{
  const {
    actionType,
    content={},
    approved=false,
    actorRef="authorized-admin"
  }=req.body||{};

  if(!actionType)
    return res.status(400).json({error:"actionType is required"});

  try{
    const status=approved?"APPROVED":"REJECTED";

    const {rows}=await pool.query(`
      INSERT INTO community_actions
        (message_id,action_type,content,status,actor_ref)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[
      req.params.id,actionType,content,status,actorRef
    ]);

    if(approved){
      await pool.query(`
        UPDATE community_messages
        SET status='ANSWERED',updated_at=NOW()
        WHERE id=$1
      `,[req.params.id]);
    }

    res.status(201).json({
      action:rows[0],
      executionRequired:true,
      message:"Provider-specific execution must occur through an official connector."
    });
  }catch{
    res.status(500).json({error:"Could not create community action"});
  }
});

app.get("/api/community/members",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT *
      FROM community_members
      ORDER BY message_count DESC,last_seen_at DESC
      LIMIT 200
    `);
    res.json({members:rows});
  }catch{
    res.status(500).json({error:"Could not load community members"});
  }
});

app.get("/api/community/metrics",async(_req,res)=>{
  try{
    const messages=(await pool.query(`
      SELECT COUNT(*)::int AS count FROM community_messages
    `)).rows[0];

    const review=(await pool.query(`
      SELECT COUNT(*)::int AS count FROM community_messages
      WHERE status='REVIEW'
    `)).rows[0];

    const members=(await pool.query(`
      SELECT COUNT(*)::int AS count FROM community_members
    `)).rows[0];

    res.json({
      messages:messages.count,
      reviewQueue:review.count,
      members:members.count
    });
  }catch{
    res.status(500).json({error:"Could not load metrics"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 44 Community Manager running"));


module.exports = app;
