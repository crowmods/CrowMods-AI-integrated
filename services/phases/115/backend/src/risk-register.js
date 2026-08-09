function calculateResidualRisk({
  likelihood,
  impact,
  controlEffectiveness=0
}){
  const l=Number(likelihood);
  const i=Number(impact);
  const e=Number(controlEffectiveness);

  if([l,i,e].some(Number.isNaN)||
     l<0||i<0||e<0||e>100)
    throw new Error("invalid_risk_values");

  const inherent=l*i;
  const residual=Number(
    (inherent*(1-e/100))
      .toFixed(3)
  );

  let status="LOW";
  if(residual>=50) status="CRITICAL";
  else if(residual>=25) status="HIGH";
  else if(residual>=10) status="MEDIUM";

  return {
    inherentScore:Number(
      inherent.toFixed(3)
    ),
    residualScore:residual,
    status
  };
}

module.exports={
  calculateResidualRisk
};
