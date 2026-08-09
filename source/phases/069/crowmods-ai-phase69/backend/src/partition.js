function partitionForKey(key,partitionCount){
  if(partitionCount<=0)throw new Error("partitionCount must be positive");

  let hash=0;
  const value=String(key);

  for(let i=0;i<value.length;i++)
    hash=((hash<<5)-hash)+value.charCodeAt(i)|0;

  return Math.abs(hash)%partitionCount;
}

function desiredWorkers({
  partitions,
  currentWorkers,
  maxWorkers=50
}){
  if(partitions<=0)return 0;

  return Math.min(
    maxWorkers,
    Math.max(1,Math.min(partitions,currentWorkers))
  );
}

function lagScaleSignal({
  totalLag,
  targetLag=100,
  currentWorkers,
  partitions,
  maxWorkers=50
}){
  if(totalLag<=targetLag)
    return {
      action:"HOLD",
      desiredWorkers:Math.max(1,currentWorkers)
    };

  const pressure=Math.ceil(totalLag/targetLag);
  const desired=Math.min(
    maxWorkers,
    Math.min(partitions,Math.max(currentWorkers+1,pressure))
  );

  return {
    action:desired>currentWorkers?"SCALE_OUT":"HOLD",
    desiredWorkers:desired
  };
}

module.exports={
  partitionForKey,
  desiredWorkers,
  lagScaleSignal
};
