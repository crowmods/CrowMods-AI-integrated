function findStaleSubjects({
  subjects=[],
  lastSeenBySubject={},
  now=Date.now(),
  staleAfterMs=90*24*60*60*1000
}){
  return subjects.filter(subject=>{
    const lastSeen=lastSeenBySubject[subject];

    if(lastSeen===undefined)
      return true;

    return now-Number(lastSeen)>=staleAfterMs;
  });
}

function buildAssignments({
  subjects=[],
  reviewer,
  dueAt
}){
  return subjects.map(subject=>({
    subject,
    assignedReviewer:reviewer,
    dueAt,
    status:"PENDING"
  }));
}

module.exports={
  findStaleSubjects,
  buildAssignments
};
