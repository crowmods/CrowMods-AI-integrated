const test=require("node:test"); const assert=require("node:assert/strict");
const {buildManifest}=require("../src/export-manifest");
test("manifest has independent payload and manifest hashes",()=>{const r=buildManifest({reviewer:"op",events:[{id:1}]}); assert.equal(r.payloadHash.length,64); assert.equal(r.manifestHash.length,64); assert.notEqual(r.payloadHash,r.manifestHash);});
