const test=require("node:test"); const assert=require("node:assert/strict"); const {immutableExport}=require("../src/alert-export");
test("export is hashed",()=>{const r=immutableExport({reviewer:"op",events:[{a:1}]}); assert.equal(r.eventCount,1); assert.equal(r.exportHash.length,64);});
