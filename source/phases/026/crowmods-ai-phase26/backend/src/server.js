const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {PLATFORMS,buildCampaign}=require("./platforms");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:26}));

app.get("/api/campaigns/platforms",(_req,res)=>{
  res.json({platforms:PLATFORMS});
});

app.post("/api/campaigns/preview",async(req,res)=>{
  try{
    const platforms=Array.isArray(req.body?.platforms)&&req.body.platforms.length
      ?req.body.platforms:PLATFORMS;

    const valid=platforms.filter(x=>PLATFORMS.includes(x));
    const targets=buildCampaign(req.body||{},valid);

    res.json({
      name:req.body?.name||"CrowMods Campaign",
      targets,
      requiresHumanApproval:true,
      publishingMode:"authorized_api_only"
    });
  }catch(err){
    res.status(400).json({error:err.message});
  }
});

app.post("/api/campaigns",async(req,res)=>{
  const {releaseId=null,name="CrowMods Campaign",scheduledFor=null,platforms=[]}=req.body||{};
  const selected=(platforms.length?platforms:PLATFORMS).filter(x=>PLATFORMS.includes(x));

  if(!selected.length)return res.status(400).json({error:"No supported platforms selected"});

  const client=await pool.connect();
  try{
    await client.query("BEGIN");

    const campaign=(await client.query(`
      INSERT INTO social_campaigns(release_id,name,status,scheduled_for)
      VALUES($1,$2,$3,$4)
      RETURNING *
    `,[releaseId,name,scheduledFor?"SCHEDULED":"PENDING_APPROVAL",scheduledFor])).rows[0];

    for(const platform of selected){
      await client.query(`
        INSERT INTO social_campaign_targets
          (campaign_id,platform,status)
        VALUES($1,$2,'PENDING_APPROVAL')
      `,[campaign.id,platform]);
    }

    await client.query("COMMIT");
    res.status(201).json({campaign});
  }catch(err){
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({error:"Could not create campaign"});
  }finally{
    client.release();
  }
});

app.get("/api/campaigns",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT c.*,COUNT(t.id)::int AS target_count
      FROM social_campaigns c
      LEFT JOIN social_campaign_targets t ON t.campaign_id=c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC LIMIT 100
    `);
    res.json({campaigns:rows});
  }catch{
    res.status(500).json({error:"Could not load campaigns"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 26 Campaign API running"));
