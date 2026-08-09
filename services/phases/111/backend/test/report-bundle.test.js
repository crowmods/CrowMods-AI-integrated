const test=require("node:test");
const assert=require("node:assert/strict");
const {
  createSignedBundle,
  DevelopmentBundleSigner
}=require("../src/report-bundle");

test("report bundle is signed",()=>{
  const result=createSignedBundle({
    reportType:"POSTMORTEM",
    version:1,
    report:{incidents:3},
    evidence:[{ref:"EV-1"}],
    signer:new DevelopmentBundleSigner("test")
  });

  assert.equal(result.digest.length,64);
  assert.equal(result.signature.length>0,true);
});
