const WINDOW_LIMITS={
  short:{
    minutes:5,
    criticalRate:14.4,
    highRate:6
  },
  medium:{
    minutes:60,
    criticalRate:14.4,
    highRate:6
  },
  long:{
    minutes:360,
    criticalRate:6,
    highRate:2
  }
};

function calculateBurn({
  targetPercent,
  observedSuccessPercent
}){
  const allowedFailure=100-targetPercent;
  if(allowedFailure<=0)
    return null;

  const observedFailure=
    Math.max(0,100-observedSuccessPercent);

  return Number(
    (observedFailure/allowedFailure).toFixed(3)
  );
}

function classifyBurn(rate,window){
  if(rate===null)
    return {
      severity:"INFO",
      status:"NORMAL"
    };

  if(rate>=window.criticalRate)
    return {
      severity:"CRITICAL",
      status:"ALERT"
    };

  if(rate>=window.highRate)
    return {
      severity:"HIGH",
      status:"ALERT"
    };

  if(rate>=2)
    return {
      severity:"MEDIUM",
      status:"ALERT"
    };

  return {
    severity:"INFO",
    status:"NORMAL"
  };
}

function evaluateWindows({
  targetPercent,
  observedSuccessPercent
}){
  return Object.entries(WINDOW_LIMITS).map(
    ([name,window])=>{
      const rate=calculateBurn({
        targetPercent,
        observedSuccessPercent
      });

      return {
        window:name,
        windowMinutes:window.minutes,
        burnRate:rate,
        ...classifyBurn(rate,window)
      };
    }
  );
}

module.exports={
  WINDOW_LIMITS,
  calculateBurn,
  classifyBurn,
  evaluateWindows
};
