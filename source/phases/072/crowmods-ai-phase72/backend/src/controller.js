function cooldownAllowed({
  lastActionAt,
  now=Date.now(),
  cooldownSeconds
}){
  if(!lastActionAt)return true;

  return now-Date.parse(lastActionAt)>=Number(cooldownSeconds)*1000;
}

function validateCapacity({
  requestedWorkers,
  minWorkers,
  maxWorkers
}){
  const requested=Number(requestedWorkers);

  return {
    valid:
      Number.isInteger(requested) &&
      requested>=Number(minWorkers) &&
      requested<=Number(maxWorkers)
  };
}

function costScore({
  workers,
  unitCost=1,
  budget=Infinity
}){
  const estimated=Number(workers)*Number(unitCost);

  return {
    estimatedCost:estimated,
    withinBudget:estimated<=Number(budget),
    score:budget===Infinity?0:estimated/Number(budget)
  };
}

function scalingDecision({
  currentWorkers,
  desiredWorkers,
  minWorkers,
  maxWorkers,
  scaleInEnabled=true,
  lastActionAt=null,
  now=Date.now(),
  cooldownSeconds=300
}){
  const capacity=validateCapacity({
    requestedWorkers:desiredWorkers,
    minWorkers,
    maxWorkers
  });

  if(!capacity.valid)
    return {action:"HOLD",reason:"Capacity policy violation"};

  if(!cooldownAllowed({
    lastActionAt,
    now,
    cooldownSeconds
  }))
    return {action:"HOLD",reason:"Cooldown active"};

  if(desiredWorkers>currentWorkers)
    return {action:"SCALE_OUT",reason:"Desired capacity exceeds current"};

  if(desiredWorkers<currentWorkers&&!scaleInEnabled)
    return {action:"HOLD",reason:"Scale-in disabled"};

  if(desiredWorkers<currentWorkers)
    return {action:"SCALE_IN",reason:"Desired capacity below current"};

  return {action:"HOLD",reason:"No capacity change required"};
}

module.exports={
  cooldownAllowed,
  validateCapacity,
  costScore,
  scalingDecision
};
