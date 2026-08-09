const crypto=require("crypto");

const TYPES=new Set([
  "ICON","SCREENSHOT","BANNER","THUMBNAIL","TELEGRAM_ART","SOCIAL_ART"
]);

const MIME=new Set(["image/jpeg","image/png","image/webp"]);

function validateMedia(input,maxBytes){
  const issues=[];
  if(!TYPES.has(input.assetType))issues.push("Unsupported asset type.");
  if(!MIME.has(input.contentType))issues.push("Unsupported image type.");
  if(!Number.isInteger(input.sizeBytes)||input.sizeBytes<=0)
    issues.push("Invalid size.");
  if(input.sizeBytes>maxBytes)issues.push("Image exceeds size limit.");
  return {valid:issues.length===0,issues};
}

function objectKey(id,name){
  const safe=String(name).replace(/[^a-zA-Z0-9._-]/g,"_");
  return `media/quarantine/${id}/${safe}`;
}

function sha256(buffer){
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

module.exports={validateMedia,objectKey,sha256};
