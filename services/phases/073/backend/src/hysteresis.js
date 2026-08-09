function hysteresisDecision({
  lag,
  scaleOutThreshold,
  scaleInThreshold,
  currentWorkers,
  minWorkers,
  maxWorkers,
  scaleStep=1,
  scaleInEnabled=true
}){
  const value=Number(lag);
  const current=Number(currentWorkers);

  if(value>=Number(scaleOutThreshold)){
    return {
      action:"SCALE_OUT",
      desiredWorkers:Math.min(
        Number(maxWorkers),
        current+Math.max(1,Number(scaleStep))
      ),
      reason:"Lag crossed scale-out threshold"
    };
  }

  if(
    value<=Number(scaleInThreshold) &&
    scaleInEnabled &&
    current>Number(minWorkers)
  ){
    return {
      action:"SCALE_IN",
      desiredWorkers:Math.max(
        Number(minWorkers),
        current-Math.max(1,Number(scaleStep))
      ),
      reason:"Lag crossed scale-in threshold"
    };
  }

  return {
    action:"HOLD",
    desiredWorkers:current,
    reason:"Lag is inside hysteresis band"
  };
}

function verificationResult({
  expectedWorkers,
  observedWorkers,
  lagBefore,
  lagAfter,
  errorRate,
  maxErrorRate=.02
}){
  const capacityOk=
    Number(observedWorkers)>=Number(expectedWorkers);

  const lagOk=
    Number(lagAfter)<=Number(lagBefore);

  const errorsOk=
    Number(errorRate)<=Number(maxErrorRate);

  if(capacityOk&&lagOk&&errorsOk){
    return {
      status:"PASS",
      reason:"Capacity and service health improved"
    };
  }

  if(!capacityOk||Number(errorRate)>Number(maxErrorRate)){
    return {
      status:"ROLLBACK_RECOMMENDED",
      reason:"Capacity or service health verification failed"
    };
  }

  return {
    status:"FAIL",
    reason:"Scaling effect could not be verified"
  };
}

module.exports={
  hysteresisDecision,
  verificationResult
};
