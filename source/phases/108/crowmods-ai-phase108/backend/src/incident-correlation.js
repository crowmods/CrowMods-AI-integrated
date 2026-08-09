function correlateSignals({
  incidentSeverity,
  burnAlert=false,
  providerFailure=false,
  changeOverlap=0
}){
  let confidence=0;

  if(burnAlert) confidence+=0.35;
  if(providerFailure) confidence+=0.35;
  if(changeOverlap>0) confidence+=
    Math.min(0.30,changeOverlap*0.30);

  if(incidentSeverity==="CRITICAL")
    confidence+=0.10;

  confidence=Number(
    Math.min(1,confidence).toFixed(3)
  );

  return {
    confidence,
    classification:
      confidence>=0.75
        ?"HIGH_CONFIDENCE"
        :confidence>=0.45
          ?"LIKELY"
          :"WEAK"
  };
}

module.exports={
  correlateSignals
};
