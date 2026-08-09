function quantile(values,q){
  const sorted=values
    .map(Number)
    .filter(Number.isFinite)
    .sort((a,b)=>a-b);

  if(!sorted.length) return null;

  const index=Math.min(
    sorted.length-1,
    Math.max(0,Math.ceil(q*sorted.length)-1)
  );
  return sorted[index];
}

function calibrateConformal({
  residuals=[],
  coverageTarget=.9,
  actuals=[],
  predictions=[]
}){
  const values=residuals
    .map(Number)
    .filter(Number.isFinite)
    .map(Math.abs);

  if(!values.length ||
     coverageTarget<=0 ||
     coverageTarget>=1)
    return {status:"INSUFFICIENT_DATA"};

  const q=quantile(values,coverageTarget);

  let coverage=null;
  if(actuals.length &&
     actuals.length===predictions.length){
    let covered=0;
    actuals.forEach((actual,i)=>{
      const p=Number(predictions[i]);
      if(Number(actual)>=p-q && Number(actual)<=p+q)
        covered++;
    });
    coverage=Number((covered/actuals.length).toFixed(4));
  }

  return {
    status:"CALIBRATED",
    sampleCount:values.length,
    coverageTarget,
    nonconformityQuantile:q,
    empiricalCoverage:coverage
  };
}

function detectDrift({
  baselineErrors=[],
  recentErrors=[],
  watchRatio=1.25,
  driftRatio=1.75
}){
  const mae=a=>
    a.length
      ? a.map(Number).filter(Number.isFinite)
        .reduce((s,v)=>s+Math.abs(v),0)/a.length
      : null;

  const baseline=mae(baselineErrors);
  const recent=mae(recentErrors);

  if(baseline===null || recent===null || baseline===0)
    return {status:"WATCH",reason:"insufficient_baseline"};

  const ratio=recent/baseline;

  let status="STABLE";
  if(ratio>=driftRatio) status="DRIFT";
  else if(ratio>=watchRatio) status="WATCH";

  return {
    status,
    baselineError:Number(baseline.toFixed(5)),
    recentError:Number(recent.toFixed(5)),
    driftRatio:Number(ratio.toFixed(5))
  };
}

module.exports={quantile,calibrateConformal,detectDrift};
