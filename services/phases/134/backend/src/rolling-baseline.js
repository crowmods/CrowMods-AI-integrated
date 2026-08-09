function percentile(values,p){
  const a=values.map(Number).filter(Number.isFinite).sort((x,y)=>x-y);
  if(!a.length) return null;
  const rank=(a.length-1)*p;
  const lo=Math.floor(rank), hi=Math.ceil(rank);
  const v=lo===hi?a[lo]:a[lo]+(a[hi]-a[lo])*(rank-lo);
  return Number(v.toFixed(3));
}

function rollingBaseline({
  previous=[],
  incoming=[],
  maxSamples=1000
}){
  const merged=[...previous,...incoming]
    .map(Number).filter(Number.isFinite)
    .slice(-Math.max(1,Number(maxSamples)||1000));

  return {
    sampleCount:merged.length,
    p50Ms:percentile(merged,.5),
    p95Ms:percentile(merged,.95),
    p99Ms:percentile(merged,.99)
  };
}

module.exports={rollingBaseline};
