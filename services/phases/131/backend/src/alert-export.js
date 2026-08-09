const crypto=require("crypto");
function immutableExport({reviewer,events}){
 if(!reviewer) throw new Error("reviewer_required");
 const canonical=JSON.stringify(events||[]);
 const exportHash=crypto.createHash("sha256").update(canonical).digest("hex");
 return {reviewer,eventCount:(events||[]).length,exportHash,events:events||[]};
}
module.exports={immutableExport};
