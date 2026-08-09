const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {PLATFORMS,buildCampaign}=require("./campaign");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"3mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:42,
  service:"campaign-engine"
}));

app.get("/api/campaigns/platforms",(_req,res)=>{
  res.json({platforms:PLATFORMS});
});

app.post("/api/campaigns/preview",async(req,res)=>{
  const page=req.body?.page||{};
  res.json({
    campaign:buildCampaign(page),
    requiresHumanApproval:true
  });
});

app.post("/api/campaigns",async(req,res)=>{
  const {releasePageId}=req.body||{};

  if(!releasePageId)
    return res.status(400).json({error:"releasePageId is required"});

  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const page=(await client.query(`
      SELECT * FROM release_pages
      WHERE id=$1 AND status='APPROVED'
    `,[releasePageId])).rows[0];

    if(!page){
      await client.query("ROLLBACK");
      return res.status(409).json({
        error:"Release page must be approved before campaign creation"
      });
    }

    const campaignData=buildCampaign(page);

    const campaign=(await client.query(`
      INSERT INTO campaigns(release_page_id,name,objective,status)
      VALUES($1,$2,$3,'REVIEW')
      RETURNING *
    `,[
      page.id,
      campaignData.name,
      campaignData.objective
    ])).rows[0];

    for(const post of campaignData.posts){
      await client.query(`
        INSERT INTO campaign_posts
          (campaign_id,platform,content,status)
        VALUES($1,$2,$3,'REVIEW')
      `,[
        campaign.id,
        post.platform,
        post.content
      ]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      campaign,
      postsCreated:campaignData.posts.length,
      requiresHumanApproval:true
    });
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
      SELECT * FROM campaigns
      ORDER BY created_at DESC LIMIT 100
    `);
    res.json({campaigns:rows});
  }catch{
    res.status(500).json({error:"Could not load campaigns"});
  }
});

app.get("/api/campaigns/:id/posts",async(req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT * FROM campaign_posts
      WHERE campaign_id=$1
      ORDER BY platform
    `,[req.params.id]);

    res.json({posts:rows});
  }catch{
    res.status(500).json({error:"Could not load campaign posts"});
  }
});

app.post("/api/campaign-posts/:id/approve",async(req,res)=>{
  const approved=Boolean(req.body?.approved);

  try{
    const {rows}=await pool.query(`
      UPDATE campaign_posts
      SET status=$2
      WHERE id=$1
      RETURNING *
    `,[req.params.id,approved?"APPROVED":"CANCELLED"]);

    if(!rows[0])return res.status(404).json({error:"Post not found"});

    res.json({
      post:rows[0],
      queueEligible:approved
    });
  }catch{
    res.status(500).json({error:"Could not update campaign post"});
  }
});

app.post("/api/campaigns/:id/approve",async(req,res)=>{
  const approved=Boolean(req.body?.approved);

  try{
    const {rows}=await pool.query(`
      UPDATE campaigns
      SET status=$2,updated_at=NOW()
      WHERE id=$1
      RETURNING *
    `,[req.params.id,approved?"APPROVED":"CANCELLED"]);

    if(!rows[0])return res.status(404).json({error:"Campaign not found"});

    res.json({campaign:rows[0]});
  }catch{
    res.status(500).json({error:"Could not update campaign"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 42 Campaign API running"));
