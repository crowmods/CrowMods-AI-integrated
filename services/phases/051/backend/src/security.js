const crypto=require("crypto");

const ROLES=["OWNER","ADMIN","EDITOR","SUPPORT","ANALYST"];

function hash(value){
  return crypto.createHash("sha256")
    .update(String(value||""))
    .digest("hex");
}

function newSessionToken(){
  return crypto.randomBytes(32).toString("base64url");
}

function permissionAllowed(role,permission,permissions){
  if(!ROLES.includes(role))return false;
  if(permissions.includes("*"))return true;
  return permissions.includes(permission);
}

function requiresStepUp(permission){
  return [
    "users.manage",
    "connectors.manage",
    "operations.write",
    "financials.write"
  ].includes(permission);
}

module.exports={
  ROLES,
  hash,
  newSessionToken,
  permissionAllowed,
  requiresStepUp
};
