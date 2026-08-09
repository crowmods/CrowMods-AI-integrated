function staleWorkers(workers,now=Date.now(),timeoutMs=60000){
  return workers.filter(worker=>{
    const last=Date.parse(worker.lastSeenAt);
    return !Number.isFinite(last)||now-last>timeoutMs;
  });
}

function chooseWorker(workers,excluded=[]){
  const candidates=workers
    .filter(w=>!excluded.includes(w.workerId))
    .filter(w=>w.status==="READY")
    .sort((a,b)=>a.activePartitions-b.activePartitions);

  return candidates[0]||null;
}

function rebalancePlan({
  assignments,
  workers,
  now=Date.now(),
  timeoutMs=60000
}){
  const stale=staleWorkers(workers,now,timeoutMs);
  const staleIds=new Set(stale.map(w=>w.workerId));
  const plan=[];

  for(const assignment of assignments){
    if(!staleIds.has(assignment.workerId))continue;

    const target=chooseWorker(workers,[...staleIds]);

    if(target){
      plan.push({
        topic:assignment.topic,
        partitionId:assignment.partitionId,
        consumerGroup:assignment.consumerGroup,
        previousWorker:assignment.workerId,
        newWorker:target.workerId,
        reason:"STALE_WORKER"
      });
    }
  }

  return plan;
}

module.exports={staleWorkers,chooseWorker,rebalancePlan};
