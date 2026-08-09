function histogram(samples,buckets=[50,100,250,500,1000,2000]){
 const counts=Object.fromEntries(buckets.map(b=>[String(b),0]));
 let overflow=0;
 for(const value of samples.map(Number).filter(Number.isFinite)){
   const bucket=buckets.find(b=>value<=b);
   if(bucket===undefined) overflow++; else counts[String(bucket)]++;
 }
 return {counts,overflow,total:samples.length};
}
module.exports={histogram};
