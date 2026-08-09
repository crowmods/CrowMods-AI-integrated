function shouldTrigger({
 alertKey,
 severity,
 now=new Date(),
 cooldownUntil=null,
 cooldownMs=300000
}){
 const current=new Date(now);
 if(cooldownUntil && new Date(cooldownUntil)>current)
   return {trigger:false,reason:"cooldown_active"};

 return {
   trigger:true,
   alertKey,
   severity,
   cooldownUntil:new Date(
     current.getTime()+Number(cooldownMs)
   ).toISOString()
 };
}
module.exports={shouldTrigger};
