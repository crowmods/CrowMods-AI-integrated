function verifyWithAdapter({
 adapterKey,
 evidenceHash,
 adapter
}){
 if(!adapterKey||!evidenceHash||!adapter)
  return {state:"UNAVAILABLE",reason:"adapter_not_configured"};

 try{
  const result=adapter(evidenceHash);
  return result===true
   ?{state:"VERIFIED",adapterKey,evidenceHash}
   :{state:"REJECTED",adapterKey,evidenceHash};
 }catch{
  return {state:"UNAVAILABLE",adapterKey,evidenceHash};
 }
}
module.exports={verifyWithAdapter};
