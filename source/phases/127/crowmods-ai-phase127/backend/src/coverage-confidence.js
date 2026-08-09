function wilsonInterval({
  successes,
  trials,
  confidenceLevel=.95
}){
  const n=Number(trials);
  const x=Number(successes);

  if(!Number.isFinite(n) ||
     n<=0 ||
     !Number.isFinite(x) ||
     x<0 || x>n)
    return {status:"INSUFFICIENT_DATA"};

  const z=confidenceLevel>=.99
    ?2.576
    :confidenceLevel>=.95
      ?1.96
      :1.645;

  const p=x/n;
  const denom=1+(z*z/n);
  const center=(p+(z*z/(2*n)))/denom;
  const margin=(
    z*Math.sqrt(
      (p*(1-p)/n)+
      (z*z/(4*n*n))
    )
  )/denom;

  return {
    status:"CALCULATED",
    sampleCount:n,
    coverage:Number(p.toFixed(5)),
    confidenceLevel,
    lowerBound:Number(
      Math.max(0,center-margin).toFixed(5)
    ),
    upperBound:Number(
      Math.min(1,center+margin).toFixed(5)
    )
  };
}

module.exports={wilsonInterval};
