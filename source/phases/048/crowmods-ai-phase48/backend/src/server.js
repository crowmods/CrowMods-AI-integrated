const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  STATES,entitlementStatus,transition,lifecycleSummary
}=require("./lifecycle");

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
  phase:48,
  service:"subscription-lifecycle"
}));

app.post("/api/subscriptions",async(req,res)=>{
  const {
    customerId,
    productId,
    providerSubscriptionRef=null,
    interval="MONTH",
    status="TRIALING",
    currentPeriodStart=null,
    currentPeriodEnd=null
  }=req.body||{};

  if(!customerId||!productId)
    return res.status(400).json({
      error:"customerId and productId are required"
    });

  if(!["MONTH","YEAR"].includes(interval))
    return res.status(400).json({error:"Invalid interval"});

  if(!STATES.includes(status))
    return res.status(400).json({error:"Invalid status"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO subscriptions
        (customer_id,product_id,provider_subscription_ref,status,
         interval,current_period_start,current_period_end)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[
      customerId,productId,providerSubscriptionRef,status,
      interval,currentPeriodStart,currentPeriodEnd
    ]);

    res.status(201).json({subscription:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not create subscription"});
  }
});

app.get("/api/subscriptions/:id/entitlement",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT s.*,p.name AS product_name
      FROM subscriptions s
      JOIN products p ON p.id=s.product_id
      WHERE s.id=$1
    `,[req.params.id]);

    if(!rows[0])return res.status(404).json({error:"Subscription not found"});

    const result=entitlementStatus(rows[0]);

    res.json({
      subscriptionId:rows[0].id,
      product:rows[0].product_name,
      ...result
    });
  }catch{
    res.status(500).json({error:"Could not check entitlement"});
  }
});

/*
  Provider webhooks should be signature-verified before reaching this
  normalized lifecycle endpoint.
*/
app.post("/api/subscriptions/events",async(req,res)=>{
  const {
    customerId,
    subscriptionId,
    providerEventRef=null,
    eventType,
    metadata={}
  }=req.body||{};

  if(!subscriptionId||!eventType)
    return res.status(400).json({
      error:"subscriptionId and eventType are required"
    });

  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const current=(await client.query(`
      SELECT * FROM subscriptions WHERE id=$1 FOR UPDATE
    `,[subscriptionId])).rows[0];

    if(!current){
      await client.query("ROLLBACK");
      return res.status(404).json({error:"Subscription not found"});
    }

    const next=transition(current.status,eventType);

    let grace=current.grace_period_end;

    if(eventType==="PAYMENT_FAILED"){
      const days=Number(process.env.DEFAULT_GRACE_DAYS||7);
      grace=new Date(Date.now()+days*86400000);
    }

    const updated=(await client.query(`
      UPDATE subscriptions
      SET status=$2,
          grace_period_end=$3,
          updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[subscriptionId,next,grace])).rows[0];

    await client.query(`
      INSERT INTO lifecycle_events
        (customer_id,subscription_id,event_type,provider_event_ref,metadata)
      VALUES($1,$2,$3,$4,$5)
    `,[
      customerId||current.customer_id,
      subscriptionId,
      eventType,
      providerEventRef,
      metadata
    ]);

    await client.query("COMMIT");

    res.json({
      subscription:updated,
      entitlement:entitlementStatus(updated)
    });
  }catch(err){
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({error:"Could not process lifecycle event"});
  }finally{
    client.release();
  }
});

app.post("/api/invoices",async(req,res)=>{
  const {
    customerId=null,
    subscriptionId=null,
    providerInvoiceRef,
    amountMinor=0,
    currency="INR",
    status="OPEN",
    hostedInvoiceUrl=null,
    issuedAt=null,
    paidAt=null
  }=req.body||{};

  if(!providerInvoiceRef)
    return res.status(400).json({error:"providerInvoiceRef is required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO invoices
        (customer_id,subscription_id,provider_invoice_ref,
         amount_minor,currency,status,hosted_invoice_url,
         issued_at,paid_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT(provider_invoice_ref)
      DO UPDATE SET
        status=EXCLUDED.status,
        hosted_invoice_url=EXCLUDED.hosted_invoice_url,
        paid_at=EXCLUDED.paid_at
      RETURNING *
    `,[
      customerId,subscriptionId,providerInvoiceRef,
      amountMinor,currency,status,hostedInvoiceUrl,
      issuedAt,paidAt
    ]);

    res.status(201).json({invoice:rows[0]});
  }catch{
    res.status(500).json({error:"Could not record invoice"});
  }
});

app.get("/api/subscriptions/overview",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT status,COUNT(*)::int AS count
      FROM subscriptions
      GROUP BY status
    `);

    const summary=lifecycleSummary(rows.map(x=>({
      status:x.status,
      count:x.count
    })).flatMap(x=>Array(x.count).fill({status:x.status})));

    res.json({states:summary});
  }catch{
    res.status(500).json({error:"Could not load subscription overview"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 48 Lifecycle API running"));
