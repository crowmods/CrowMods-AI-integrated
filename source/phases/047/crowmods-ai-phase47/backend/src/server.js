const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  money,lifecycle,recommendations
}=require("./monetization");

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
  phase:47,
  service:"monetization"
}));

app.post("/api/monetization/products",async(req,res)=>{
  const {
    name,
    slug,
    description="",
    productType="DIGITAL_PRODUCT",
    metadata={}
  }=req.body||{};

  if(!name||!slug)
    return res.status(400).json({error:"name and slug are required"});

  const allowed=[
    "SUBSCRIPTION","DIGITAL_PRODUCT","SPONSORSHIP","AFFILIATE"
  ];

  if(!allowed.includes(productType))
    return res.status(400).json({error:"Invalid product type"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO products(name,slug,description,product_type,metadata)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[name,slug,description,productType,metadata]);

    res.status(201).json({product:rows[0]});
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not create product"});
  }
});

app.post("/api/monetization/prices",async(req,res)=>{
  const {
    productId,
    providerPriceRef=null,
    amountMinor,
    currency="INR",
    interval="ONE_TIME"
  }=req.body||{};

  if(!productId||!Number.isInteger(Number(amountMinor)))
    return res.status(400).json({
      error:"productId and integer amountMinor are required"
    });

  if(Number(amountMinor)<0)
    return res.status(400).json({error:"amountMinor cannot be negative"});

  if(!/^[A-Z]{3}$/.test(currency))
    return res.status(400).json({error:"Invalid currency"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO price_plans
        (product_id,provider_price_ref,amount_minor,currency,interval)
      VALUES($1,$2,$3,$4,$5)
      RETURNING *
    `,[productId,providerPriceRef,Number(amountMinor),currency,interval]);

    res.status(201).json({
      price:rows[0],
      display:money(amountMinor,currency)
    });
  }catch{
    res.status(500).json({error:"Could not create price"});
  }
});

/*
  Webhook adapters should verify the provider signature BEFORE calling this
  normalized event endpoint.
*/
app.post("/api/monetization/payment-events",async(req,res)=>{
  const {
    provider,
    providerEventRef,
    eventType,
    providerCustomerRef=null,
    providerPaymentRef=null,
    amountMinor=null,
    currency=null,
    status,
    metadata={}
  }=req.body||{};

  if(!provider||!providerEventRef||!eventType||!status)
    return res.status(400).json({
      error:"provider, providerEventRef, eventType and status are required"
    });

  try{
    const {rows}=await pool.query(`
      INSERT INTO payment_events
        (provider,provider_event_ref,event_type,provider_customer_ref,
         provider_payment_ref,amount_minor,currency,status,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT(provider_event_ref) DO NOTHING
      RETURNING *
    `,[
      provider,providerEventRef,eventType,providerCustomerRef,
      providerPaymentRef,amountMinor,currency,status,metadata
    ]);

    res.status(201).json({
      accepted:true,
      duplicate:rows.length===0,
      event:rows[0]||null
    });
  }catch{
    res.status(500).json({error:"Could not record payment event"});
  }
});

app.post("/api/monetization/affiliate",async(req,res)=>{
  const {
    affiliateRef,
    clickRef=null,
    eventType="CLICK",
    amountMinor=null,
    currency=null,
    providerRef=null,
    metadata={}
  }=req.body||{};

  if(!affiliateRef)
    return res.status(400).json({error:"affiliateRef is required"});

  if(!["CLICK","CONVERSION"].includes(eventType))
    return res.status(400).json({error:"Invalid affiliate event"});

  try{
    const {rows}=await pool.query(`
      INSERT INTO affiliate_events
        (affiliate_ref,click_ref,event_type,amount_minor,currency,
         provider_ref,metadata)
      VALUES($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,[
      affiliateRef,clickRef,eventType,amountMinor,
      currency,providerRef,metadata
    ]);

    res.status(201).json({event:rows[0]});
  }catch{
    res.status(500).json({error:"Could not record affiliate event"});
  }
});

app.get("/api/monetization/overview",async(_req,res)=>{
  try{
    const events=(await pool.query(`
      SELECT event_type
      FROM payment_events
      WHERE received_at >= NOW() - INTERVAL '30 days'
    `)).rows;

    const revenue=(await pool.query(`
      SELECT
        COALESCE(SUM(
          CASE WHEN status='SUCCEEDED' THEN COALESCE(amount_minor,0) ELSE 0 END
        ),0)::bigint AS gross_minor,
        COUNT(*) FILTER(WHERE status='SUCCEEDED')::int AS successful_payments
      FROM payment_events
      WHERE received_at >= NOW() - INTERVAL '30 days'
    `)).rows[0];

    const metrics=lifecycle(events);

    res.json({
      periodDays:30,
      lifecycle:metrics,
      grossRevenueMinor:String(revenue.gross_minor),
      successfulPayments:revenue.successful_payments,
      recommendations:recommendations(metrics)
    });
  }catch{
    res.status(500).json({error:"Could not load monetization overview"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 47 Monetization API running"));
