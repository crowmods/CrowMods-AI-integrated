function lagSeverity(lag,threshold){
  if(lag>=threshold*10)return "CRITICAL";
  if(lag>=threshold*5)return "HIGH";
  if(lag>=threshold*2)return "MEDIUM";
  return "LOW";
}

function shouldAlert(lag,threshold){
  return Number(lag)>Number(threshold);
}

module.exports={lagSeverity,shouldAlert};
