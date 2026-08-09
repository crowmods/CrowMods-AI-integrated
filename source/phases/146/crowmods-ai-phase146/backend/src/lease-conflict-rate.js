function calculateRate({
 conflictCount=0,
 requestCount=0,
 threshold=0.05
}){
 const conflicts=Math.max(0,Number(conflictCount));
 const requests=Math.max(0,Number(requestCount));
 const rate=requests?conflicts/requests:0;

 return {
  conflictCount:conflicts,
  requestCount:requests,
  conflictRate:Number(rate.toFixed(6)),
  state:rate>Number(threshold)?"BREACH":"NORMAL"
 };
}
module.exports={calculateRate};
