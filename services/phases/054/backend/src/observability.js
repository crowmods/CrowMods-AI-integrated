function sanitizeMetadata(input={}){
  const blocked=[
    "password","token","access_token","refresh_token",
    "client_secret","api_key","authorization",
    "card_number","cvv"
  ];

  const output={};

  for(const [key,value] of Object.entries(input||{})){
    if(blocked.includes(String(key).toLowerCase()))continue;
    output[key]=value;
  }

  return output;
}

function log(level,eventName,message,metadata={}){
  return {
    level,
    eventName,
    message,
    metadata:sanitizeMetadata(metadata),
    timestamp:new Date().toISOString()
  };
}

function metric(name,value,labels={}){
  return {
    metricName:name,
    value:Number(value),
    labels:sanitizeMetadata(labels),
    timestamp:new Date().toISOString()
  };
}

module.exports={sanitizeMetadata,log,metric};
