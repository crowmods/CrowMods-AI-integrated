const crypto=require("crypto");

function buildPostmortemReport({
  windowDays,
  incidentCount,
  openActionCount,
  overdueActionCount,
  criticalIncidentCount
}){
  const report={
    windowDays,
    incidentCount,
    openActionCount,
    overdueActionCount,
    criticalIncidentCount
  };

  const digest=crypto
    .createHash("sha256")
    .update(JSON.stringify(report))
    .digest("hex");

  return {
    ...report,
    digest,
    generatedAt:new Date().toISOString()
  };
}

module.exports={
  buildPostmortemReport
};
