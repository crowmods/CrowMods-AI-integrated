function buildDriftAlert({
  driftRatio,
  warningRatio=1.25,
  criticalRatio=1.75
}){
  if(!Number.isFinite(driftRatio))
    return {
      status:"INFO",
      severity:"INFO",
      message:"Insufficient drift data"
    };

  if(driftRatio>=criticalRatio)
    return {
      status:"ALERT",
      severity:"CRITICAL",
      message:"Forecast error drift exceeds critical threshold"
    };

  if(driftRatio>=warningRatio)
    return {
      status:"ALERT",
      severity:"WARNING",
      message:"Forecast error drift exceeds warning threshold"
    };

  return {
    status:"STABLE",
    severity:"INFO",
    message:"Forecast error remains within expected range"
  };
}

module.exports={buildDriftAlert};
