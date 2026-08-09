const crypto=require("crypto");

function canonicalEvidence(value){
  return JSON.stringify(
    value,
    Object.keys(value||{}).sort()
  );
}

function evidenceHash(value){
  return crypto
    .createHash("sha256")
    .update(canonicalEvidence(value))
    .digest("hex");
}

function buildEvidence({
  evidenceType,
  generatedBy,
  data
}){
  return {
    evidenceType,
    generatedBy,
    evidenceHash:evidenceHash(data),
    metadata:{
      generatedAt:new Date().toISOString()
    }
  };
}

module.exports={
  canonicalEvidence,
  evidenceHash,
  buildEvidence
};
