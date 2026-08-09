const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {summarizeRevenue}=require("./monetization");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:31}));

app.post("/api/monetization/plans",async(req,res)=>{
  const {name,description="",priceMinor=0,currency="INR",interval="month"}=req.body||{};
  if(!name||Number(priceMinor)<0)
    return res.status(400).json({error:"Invalid plan"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO monetization_plans
        (name,description,price_minor,currency,interval)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[name,description,priceMinor,currency,interval]);

    res.status(201).json({plan:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not create plan"});
  }
});

app.get("/api/monetization/plans",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT * FROM monetization_plans
      WHERE is_active=TRUE
      ORDER BY price_minor
    `);
    res.json({plans:rows});
  }catch{
    res.status(500).json({error:"Could not load plans"});
  }
});

/*
  Webhook boundary:
  The real connector should verify the payment provider's webhook signature
  before inserting a payment event. Never trust an amount supplied directly
  by an unauthenticated browser.
*/
app.post("/api/monetization/webhook",async(req,res)=>{
  const provider=process.env.PAYMENT_PROVIDER||"stub";
  const {
    externalEventId,eventType,amountMinor=0,currency="INR",
    externalCustomerRef=null,metadata={}
  }=req.body||{};

  if(!externalEventId||!eventType)
    return res.status(400).json({error:"Missing webhook event identifiers"});

  try{
    const customer=externalCustomerRef
      ?(await pool.query(`
          SELECT id FROM customers WHERE external_customer_ref=$1
        `,[externalCustomerRef])).rows[0]
      :null;

    const {rows}=await pool.query(`
      INSERT INTO payment_events
        (provider,external_event_id,event_type,customer_id,amount_minor,currency,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT(external_event_id) DO NOTHING
      RETURNING id,created_at
    `,[provider,externalEventId,eventType,customer?.id||null,
       amountMinor,currency,metadata]);

    res.status(201).json({
      received:true,
      duplicate:rows.length===0,
      event:rows[0]||null
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record payment event"});
  }
});

app.post("/api/monetization/affiliate",async(req,res)=>{
  const {
    partnerRef,clickRef,eventType="CLICK",
    valueMinor=0,currency="INR",metadata={}
  }=req.body||{};

  if(!partnerRef||!clickRef)
    return res.status(400).json({error:"partnerRef and clickRef are required"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO affiliate_events
        (partner_ref,click_ref,event_type,value_minor,currency,metadata)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,[partnerRef,clickRef,eventType,valueMinor,currency,metadata]);

    res.status(201).json({event:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not record affiliate event"});
  }
});

app.get("/api/monetization/revenue",async(req,res)=>{
  const days=Math.min(Math.max(Number(req.query.days||30),1),365);

  try{
    const {rows}=await pool.query(`
      SELECT provider,event_type,amount_minor,currency
      FROM payment_events
      WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
    `,[days]);

    res.json({
      days,
      summary:summarizeRevenue(rows)
    });
  }catch{
    res.status(500).json({error:"Could not load revenue"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 31 Monetization API running"));
