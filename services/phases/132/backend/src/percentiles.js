function percentile(values,p){
 const a=values.map(Number).filter(Number.isFinite).sort((x,y)=>x-y);
 if(!a.length) return null;
 const rank=(a.length-1)*p;
 const lo=Math.floor(rank), hi=Math.ceil(rank);
 if(lo===hi) return Number(a[lo].toFixed(3));
 return Number((a[lo]+(a[hi]-a[lo])*(rank-lo)).toFixed(3));
}
function rollup(values){
 const a=values.map(Number).filter(Number.isFinite);
 return {sampleCount:a.length,p50Ms:percentile(a,.50),p95Ms:percentile(a,.95),p99Ms:percentile(a,.99)};
}
module.exports={percentile,rollup};
