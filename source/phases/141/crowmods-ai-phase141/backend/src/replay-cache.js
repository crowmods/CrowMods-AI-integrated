function getCached(existing,now=new Date()){
 if(!existing) return {status:"MISS"};
 const expiry=new Date(existing.expiresAt);
 if(Number.isNaN(expiry.getTime())||expiry<=new Date(now))
   return {status:"EXPIRED"};
 return {
  status:"HIT",
  response:existing.response
 };
}
module.exports={getCached};
