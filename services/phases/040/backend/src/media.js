const crypto=require("crypto");
const path=require("path");

const PLATFORMS=[
  "website","telegram","discord","x",
  "instagram","facebook","reddit","youtube","whatsapp","linkedin"
];

function sha256(buffer){
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function objectKey(id,filename){
  const ext=path.extname(filename).toLowerCase();
  return `media/${id}${ext}`;
}

function buildAssetCopy(input){
  const name=String(input.appName||"Release").trim();

  return {
    altText:`${name} release artwork`,
    caption:`${name} — official release artwork.`,
    variants:PLATFORMS.map(platform=>({
      platform,
      variantType:platform==="website"?"hero":"social",
      caption:`${name} — release update.`,
      altText:`${name} release artwork`
    }))
  };
}

module.exports={PLATFORMS,sha256,objectKey,buildAssetCopy};
