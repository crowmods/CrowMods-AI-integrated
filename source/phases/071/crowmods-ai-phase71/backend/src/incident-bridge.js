function incidentPayload({
  consumerGroup,
  lag,
  threshold,
  severity
}){
  return {
    service:`consumer:${consumerGroup}`,
    alertName:"consumer-lag",
    severity,
    message:
      `Consumer lag ${lag} exceeded threshold ${threshold}`,
    metadata:{
      consumerGroup,
      lag,
      threshold
    }
  };
}

module.exports={incidentPayload};
