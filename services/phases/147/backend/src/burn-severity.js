function classifyBurnRate(burnRate){
 const burn=Number(burnRate);

 if(!Number.isFinite(burn)||burn<0)
  return {severity:"NORMAL",burnRate:0};

 if(burn>=10) return {severity:"CRITICAL",burnRate:burn};
 if(burn>=5) return {severity:"HIGH",burnRate:burn};
 if(burn>=2) return {severity:"ELEVATED",burnRate:burn};

 return {severity:"NORMAL",burnRate:burn};
}
module.exports={classifyBurnRate};
