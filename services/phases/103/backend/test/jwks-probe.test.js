const test=require("node:test");
const assert=require("node:assert/strict");
const {probeJwks}=require("../src/jwks-probe");

test("JWKS probe identifies its probe type",async()=>{
  const result=await probeJwks(
    "https://issuer.example/jwks",
    {
      fetchImpl:async()=>({
        ok:true,
        status:200
      })
    }
  );

  assert.equal(result.probeType,"JWKS");
  assert.equal(result.status,"PASS");
});
