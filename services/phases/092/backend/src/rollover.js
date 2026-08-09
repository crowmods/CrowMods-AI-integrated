function rolloverDiff(oldKeys,newKeys){
  const oldKids=new Set(
    oldKeys.map(key=>key.kid)
  );

  const newKids=new Set(
    newKeys.map(key=>key.kid)
  );

  return {
    added:newKeys
      .filter(key=>!oldKids.has(key.kid))
      .map(key=>key.kid),
    removed:oldKeys
      .filter(key=>!newKids.has(key.kid))
      .map(key=>key.kid),
    retained:newKeys
      .filter(key=>oldKids.has(key.kid))
      .map(key=>key.kid)
  };
}

function shouldRefresh({
  keyFound,
  ageMs,
  ttlMs
}){
  return !keyFound||
    Number(ageMs)>=Number(ttlMs);
}

module.exports={
  rolloverDiff,
  shouldRefresh
};
