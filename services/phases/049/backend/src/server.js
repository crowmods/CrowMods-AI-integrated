const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  classifyTicket,answerDraft,TEMPLATES
}=require("./support");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:49,
  service:"support-notifications"
}));

app.post("/api/support/tickets",async(req,res)=>{
  const {
    customerId=null,
    channel="WEB",
    subject,
    message
  }=req.body||{};

  if(!subject||!message)
    return res.status(400).json({
      error:"subject and message are required"
    });

  const analysis=classifyTicket(message);

  try{
    const {rows}=await pool.query(`
      INSERT INTO support_tickets
        (customer_id,channel,subject,message,category,priority,
         status,ai_confidence)
      VALUES($1,$2,$3,$4,$5,$6,'AI_DRAFTED',$7)
      RETURNING *
    `,[
      customerId,channel,subject,message,
      analysis.category,analysis.priority,analysis.confidence
    ]);

    const ticket=rows[0];
    const draft=answerDraft(ticket);

    await pool.query(`
      INSERT INTO support_events(ticket_id,event_type,metadata)
      VALUES($1,'AI_CLASSIFIED',$2)
    `,[ticket.id,analysis]);

    res.status(201).json({
      ticket,
      analysis,
      draft
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not create support ticket"});
  }
});

app.get("/api/support/tickets",async(req,res)=>{
  const status=req.query.status||null;

  try{
    const {rows}=await pool.query(
      status?`
        SELECT * FROM support_tickets
        WHERE status=$1
        ORDER BY
          CASE priority
            WHEN 'URGENT' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'NORMAL' THEN 3
            ELSE 4
          END,
          created_at DESC
        LIMIT 200
      `:`
        SELECT * FROM support_tickets
        ORDER BY
          CASE priority
            WHEN 'URGENT' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'NORMAL' THEN 3
            ELSE 4
          END,
          created_at DESC
        LIMIT 200
      `,
      status?[status]:[]
    );

    res.json({tickets:rows});
  }catch{
    res.status(500).json({error:"Could not load support tickets"});
  }
});

app.post("/api/support/tickets/:id/resolve",async(req,res)=>{
  const {
    status="RESOLVED",
    response=""
  }=req.body||{};

  if(!["WAITING_CUSTOMER","ESCALATED","RESOLVED","CLOSED"].includes(status))
    return res.status(400).json({error:"Invalid support status"});

  try{
    const {rows}=await pool.query(`
      UPDATE support_tickets
      SET status=$2,updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[req.params.id,status]);

    if(!rows[0])return res.status(404).json({error:"Ticket not found"});

    await pool.query(`
      INSERT INTO support_events(ticket_id,event_type,metadata)
      VALUES($1,'TICKET_UPDATED',$2)
    `,[req.params.id,{status,response}]);

    res.json({ticket:rows[0]});
  }catch{
    res.status(500).json({error:"Could not update ticket"});
  }
});

app.get("/api/notifications/templates",(_req,res)=>{
  res.json({templates:TEMPLATES});
});

app.post("/api/notifications/preferences",async(req,res)=>{
  const {
    customerId,
    emailEnabled=true,
    telegramEnabled=false,
    whatsappEnabled=false,
    discordEnabled=false,
    marketingEnabled=false,
    transactionalEnabled=true
  }=req.body||{};

  if(!customerId)
    return res.status(400).json({error:"customerId is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO notification_preferences
        (customer_id,email_enabled,telegram_enabled,
         whatsapp_enabled,discord_enabled,marketing_enabled,
         transactional_enabled)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(customer_id)
      DO UPDATE SET
        email_enabled=EXCLUDED.email_enabled,
        telegram_enabled=EXCLUDED.telegram_enabled,
        whatsapp_enabled=EXCLUDED.whatsapp_enabled,
        discord_enabled=EXCLUDED.discord_enabled,
        marketing_enabled=EXCLUDED.marketing_enabled,
        transactional_enabled=EXCLUDED.transactional_enabled,
        updated_at=NOW()
      RETURNING *
    `,[
      customerId,emailEnabled,telegramEnabled,
      whatsappEnabled,discordEnabled,marketingEnabled,
      transactionalEnabled
    ]);

    res.json({preferences:rows[0]});
  }catch{
    res.status(500).json({error:"Could not save preferences"});
  }
});

app.post("/api/notifications/queue",async(req,res)=>{
  const {
    customerId=null,
    notificationType,
    channel="EMAIL",
    subject=null,
    body,
    scheduledFor=null
  }=req.body||{};

  if(!notificationType||!body)
    return res.status(400).json({
      error:"notificationType and body are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO notification_queue
        (customer_id,notification_type,channel,subject,body,scheduled_for)
      VALUES($1,$2,$3,$4,$5,COALESCE($6,NOW()))
      RETURNING *
    `,[
      customerId,notificationType,channel,
      subject,body,scheduledFor
    ]);

    res.status(201).json({notification:rows[0]});
  }catch{
    res.status(500).json({error:"Could not queue notification"});
  }
});

app.get("/api/notifications/queue",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT * FROM notification_queue
      ORDER BY scheduled_for,created_at
      LIMIT 200
    `);
    res.json({notifications:rows});
  }catch{
    res.status(500).json({error:"Could not load notification queue"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 49 Support API running"));


module.exports = app;
