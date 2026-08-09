const crypto=require("crypto");

function hashIdentifier(value){
  if(!value)return null;
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function validateControlName(name){
  return [
    "publishing_enabled",
    "new_uploads_enabled",
    "new_registrations_enabled"
  ].includes(name);
}

function securityEvent(eventType,severity,service,metadata={}){
  return {
    eventType,
    severity,
    service,
    metadata
  };
}

module.exports={hashIdentifier,validateControlName,securityEvent};
