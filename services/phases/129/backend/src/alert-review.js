function buildReviewQuery({
  reviewer,
  fingerprint,
  actionFilter,
  fromTime,
  toTime,
  limit=100
}){
  if(!reviewer)
    throw new Error("reviewer_required");

  const params=[];
  const where=[];

  if(fingerprint){
    params.push(fingerprint);
    where.push(`fingerprint=$${params.length}`);
  }

  if(actionFilter){
    params.push(actionFilter);
    where.push(`action=$${params.length}`);
  }

  if(fromTime){
    params.push(fromTime);
    where.push(`created_at>=$${params.length}`);
  }

  if(toTime){
    params.push(toTime);
    where.push(`created_at<=$${params.length}`);
  }

  const safeLimit=Math.min(
    500,
    Math.max(1,Number(limit)||100)
  );

  const clause=where.length
    ?`WHERE ${where.join(" AND ")}`
    :"";

  return {
    sql:`SELECT fingerprint,action,actor,note,created_at
      FROM alert_ack_history
      ${clause}
      ORDER BY created_at DESC
      LIMIT ${safeLimit}`,
    params
  };
}

module.exports={buildReviewQuery};
