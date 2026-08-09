const test=require("node:test");
const assert=require("node:assert/strict");
const {probeHttps}=require("../src/http-probe");

test("HTTP targets are rejected",async()=>{
  const result=await probeHttps(
    "http://example.com"
  );

  assert.equal(result.status,"FAIL");
  assert.equal(result.reason,"https_required");
});

test("successful HTTPS adapter result passes",async()=>{
  const fakeFetch=async()=>({
    ok:true,
    status:200
  });

  const result=await probeHttps(
    "https://example.com",
    {fetchImpl:fakeFetch}
  );

  assert.equal(result.status,"PASS");
  assert.equal(result.statusCode,200);
});
