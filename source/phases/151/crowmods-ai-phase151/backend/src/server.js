const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
 recalculateQuorum,
 propagateRevocation
}=require("./revocation-propagation");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"4mb"}));

const pool=new Pool({
 connectionString:process.env.DATABASE_URL,
 ssl:process.env.NODE_ENV==="production"
  ?{rejectUnauthorized:true}:false
});

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:151}));

app.get("/ready",async(_q,s)=>{
 try{await pool.query("SELECT 1");s.json({ready:true})}
 catch{s.status(503).json({ready:false})}
});

app.post("/api/security/governance/quorum/revoke",
async(req,res)=>{
 const r=propagateRevocation({
  approvalId:req.body.approvalId,
  actorId:req.body.actorId,
  reason:req.body.reason,
  dependents:req.body.dependentQueueIds||[]
 });

 if(r.status!=="PROPAGATED")
  return res.status(400).json(r);

 try{
  await pool.query(
   `INSERT INTO quorum_revocation_events
    (queue_id,approval_id,actor_id,reason,propagated)
    VALUES($1,$2,$3,$4,TRUE)`,
   [
    req.body.queueId,
    r.approvalId,
    r.actorId,
    r.reason
   ]
  );

  for(const queueId of r.dependentQueueIds){
   await pool.query(
    `UPDATE quorum_decision_state
     SET state='PENDING',updated_at=NOW()
     WHERE queue_id=$1`,
    [queueId]
   );
  }

  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.post("/api/security/governance/quorum/recalculate",
async(req,res)=>{
 const r=recalculateQuorum({
  approvals:req.body.approvals||[],
  requiredApprovals:req.body.requiredApprovals||2
 });

 try{
  await pool.query(
   `INSERT INTO quorum_decision_state
    (queue_id,required_approvals,active_approvals,state)
    VALUES($1,$2,$3,$4)
    ON CONFLICT(queue_id)
    DO UPDATE SET required_approvals=EXCLUDED.required_approvals,
      active_approvals=EXCLUDED.active_approvals,
      state=EXCLUDED.state,
      updated_at=NOW()`,
   [
    req.body.queueId,
    r.requiredApprovals,
    r.activeApprovals,
    r.state
   ]
  );
  res.json(r);
 }catch{
  res.status(500).json({status:"FAILED"});
 }
});

app.get("/api/security/phase151-dashboard",
async(_q,res)=>{
 try{
  const [revocations,pending,approved]=await Promise.all([
   pool.query(`SELECT COUNT(*)::int count
    FROM quorum_revocation_events
    WHERE created_at>NOW()-INTERVAL '30 days'`),
   pool.query(`SELECT COUNT(*)::int count
    FROM quorum_decision_state
    WHERE state='PENDING'`),
   pool.query(`SELECT COUNT(*)::int count
    FROM quorum_decision_state
    WHERE state='APPROVED'`)
  ]);

  res.json({
   revocations30d:revocations.rows[0].count,
   pendingQuorums:pending.rows[0].count,
   approvedQuorums:approved.rows[0].count
  });
 }catch{
  res.status(500).json({error:"dashboard_unavailable"});
 }
});

app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 151 API running"
));
