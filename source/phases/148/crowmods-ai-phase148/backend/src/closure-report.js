const {hash}=require("./evidence-anchor");

function buildReport({
 quarantineId,
 verification,
 verifiedBy
}){
 if(!quarantineId||!verifiedBy||!verification)
  return {status:"REJECTED"};

 const report={
  quarantineId,
  valid:Boolean(verification.valid),
  chainLength:Number(verification.length||0),
  headHash:verification.headHash||null,
  verifiedBy
 };

 return {
  status:"READY",
  ...report,
  reportHash:hash(JSON.stringify(report))
 };
}
module.exports={buildReport};
