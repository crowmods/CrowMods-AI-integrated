const test=require("node:test"); const assert=require("node:assert/strict");
const {buildAuditLink}=require("../src/transaction-audit");
test("audit link joins operation and event",()=>{const r=buildAuditLink({workerKey:"w",operation:"RENEW",expectedVersion:4,committedVersion:4,result:"RENEWED",eventId:"e"}); assert.equal(r.workerKey,"w"); assert.equal(r.eventId,"e");});
