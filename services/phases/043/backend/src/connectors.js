const crypto=require("crypto");

const PLATFORMS=[
  "telegram",
  "discord",
  "whatsapp_business",
  "meta",
  "x",
  "reddit",
  "youtube",
  "linkedin"
];

const OPERATIONS=["PUBLISH","SCHEDULE","STATUS","DELETE"];

function idempotencyKey(platform,operation,externalRef){
  return crypto.createHash("sha256")
    .update(`${platform}|${operation}|${externalRef}`)
    .digest("hex");
}

/*
  Adapter contract. Provider packages should implement this interface using
  official APIs and their documented authentication mechanisms.
*/
function connectorContract(){
  return {
    connect:"OAuth/provider-specific connection flow",
    health:"Check authorized account and scopes",
    publish:"Create an authorized platform post",
    schedule:"Schedule when provider supports it",
    status:"Fetch publication status",
    revoke:"Revoke/disconnect authorization"
  };
}

function validateOperation(operation){
  return OPERATIONS.includes(operation);
}

module.exports={
  PLATFORMS,
  OPERATIONS,
  idempotencyKey,
  connectorContract,
  validateOperation
};
