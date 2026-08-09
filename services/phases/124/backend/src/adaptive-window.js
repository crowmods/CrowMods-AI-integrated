function adjustWindow({
  currentSize,
  minWindow=50,
  maxWindow=1000,
  coverageError,
  targetError=.05
}){
  if(!Number.isInteger(currentSize)||
     currentSize<minWindow||
     currentSize>maxWindow)
    return {
      status:"BLOCKED",
      reason:"invalid_window_size"
    };

  if(!Number.isFinite(coverageError))
    return {
      status:"HOLD",
      windowSize:currentSize
    };

  const gap=Math.abs(coverageError);

  if(gap>targetError*2)
    return {
      status:"EXPAND",
      windowSize:Math.min(
        maxWindow,
        Math.ceil(currentSize*1.25)
      )
    };

  if(gap<targetError*.5)
    return {
      status:"SHRINK",
      windowSize:Math.max(
        minWindow,
        Math.floor(currentSize*.9)
      )
    };

  return {
    status:"HOLD",
    windowSize:currentSize
  };
}

module.exports={adjustWindow};
