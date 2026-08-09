const {Pool}=require("pg");
const {claim,succeed,fail}=require("./queue");

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const workerId=process.env.WORKER_ID||`worker-${process.pid}`;
const pollMs=Number(process.env.POLL_MS||3000);

async function handle(job){
  // Safe orchestration only. Actual processors should be separate isolated
  // services with narrowly scoped permissions.
  switch(job.job_type){
    case "APK_PROCESS":
    case "SECURITY_SCAN":
    case "AI_CONTENT":
    case "WEBSITE_PUBLISH":
    case "TELEGRAM_PUBLISH":
    case "DISCORD_PUBLISH":
    case "SOCIAL_CAMPAIGN":
    case "ANALYTICS_AGGREGATION":
      console.log(`[${workerId}] queued task: ${job.job_type}`,job.id);
      return;
    default:
      throw new Error(`Unsupported job type: ${job.job_type}`);
  }
}

async function loop(){
  try{
    const job=await claim(pool,workerId);
    if(job){
      try{
        await handle(job);
        await succeed(pool,job.id);
      }catch(err){
        await fail(pool,job.id,err.message);
      }
    }
  }catch(err){
    console.error("Worker loop error:",err);
  }finally{
    setTimeout(loop,pollMs);
  }
}

loop();
