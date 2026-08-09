function mean(values){
  if(!values.length) return 0;
  return values.reduce((a,b)=>a+Number(b),0)/values.length;
}

function standardDeviation(values){
  if(values.length<2) return 0;

  const avg=mean(values);

  return Math.sqrt(
    values.reduce(
      (sum,value)=>sum+(Number(value)-avg)**2,
      0
    )/(values.length-1)
  );
}

function anomalyScore(history,observed){
  const baseline=mean(history);
  const deviation=standardDeviation(history);

  if(deviation===0){
    return {
      baseline,
      deviationScore:observed===baseline?0:Infinity
    };
  }

  return {
    baseline,
    deviationScore:
      Math.abs(Number(observed)-baseline)/deviation
  };
}

function confidence(history){
  if(history.length>=30) return .95;
  if(history.length>=15) return .9;
  if(history.length>=7) return .8;
  if(history.length>=3) return .65;
  return .4;
}

function severityFromDeviation(score){
  if(score>=4) return "CRITICAL";
  if(score>=3) return "HIGH";
  if(score>=2) return "WARNING";
  return "INFO";
}

function multiWindowForecast(values){
  const windows=[3,7,14].map(size=>{
    const sample=values.slice(-size);

    if(sample.length<2)
      return {
        window:size,
        available:false,
        average:mean(sample)
      };

    const first=sample[0];
    const last=sample[sample.length-1];

    return {
      window:size,
      available:true,
      average:Number(mean(sample).toFixed(6)),
      change:Number((last-first).toFixed(6))
    };
  });

  const available=windows.filter(w=>w.available);

  const trend=available.length
    ?mean(available.map(w=>w.change))
    :0;

  return {
    windows,
    aggregateTrend:Number(trend.toFixed(6))
  };
}

function shouldEscalate({
  currentSeverity,
  previousSeverity,
  occurrences
}){
  const rank={
    INFO:0,
    WARNING:1,
    HIGH:2,
    CRITICAL:3
  };

  return (
    rank[currentSeverity]>rank[previousSeverity] ||
    Number(occurrences)>=3
  );
}

module.exports={
  mean,
  standardDeviation,
  anomalyScore,
  confidence,
  severityFromDeviation,
  multiWindowForecast,
  shouldEscalate
};
