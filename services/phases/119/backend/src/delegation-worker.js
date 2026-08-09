function processDelegations({
  delegations=[],
  now=new Date()
}){
  let examined=0;
  let revoked=0;
  let skipped=0;

  for(const delegation of delegations){
    examined++;

    if(delegation.status==="REVOKED"){
      skipped++;
      continue;
    }

    const expiry=new Date(
      delegation.endsAt
    );

    if(Number.isNaN(expiry.getTime())){
      skipped++;
      continue;
    }

    if(expiry<=new Date(now)){
      revoked++;
    }else{
      skipped++;
    }
  }

  return {
    status:"COMPLETED",
    examined,
    revoked,
    skipped
  };
}

module.exports={
  processDelegations
};
