const crypto=require("crypto");

function fingerprint(type,service,message){
  return crypto.createHash("sha256")
    .update(`${type}|${service||""}|${message}`)
    .digest("hex");
}

function classifyIncident(alert){
  if(alert.severity==="CRITICAL")
    return {
      priority:"P1",
      action:"Page authorized on-call administrator immediately."
    };

  if(alert.severity==="HIGH")
    return {
      priority:"P2",
      action:"Escalate to the operations/security queue."
    };

  return {
    priority:"P3",
    action:"Create an operational ticket for review."
  };
}

module.exports={fingerprint,classifyIncident};
