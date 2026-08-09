const crypto=require("crypto");
const fs=require("fs/promises");
const path=require("path");

async function sha256File(filePath){
  const data=await fs.readFile(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function safeObjectKey(id,originalName){
  const ext=path.extname(originalName).toLowerCase();
  return `${id}${ext}`;
}

function allowedFile(name,contentType,size,maxBytes){
  const ext=path.extname(name).toLowerCase();
  const allowedExt=[".apk",".xapk",".apks",".zip"];

  if(!allowedExt.includes(ext))
    return {ok:false,reason:"Unsupported file extension"};

  if(size<=0||size>maxBytes)
    return {ok:false,reason:"File size outside allowed limit"};

  const allowedTypes=[
    "application/vnd.android.package-archive",
    "application/zip",
    "application/octet-stream"
  ];

  if(contentType && !allowedTypes.includes(contentType))
    return {ok:false,reason:"Unsupported content type"};

  return {ok:true};
}

module.exports={sha256File,safeObjectKey,allowedFile};
