const test=require("node:test");
const assert=require("node:assert/strict");
const {
  acquireCertificateMetadata
}=require("../src/tls-acquisition");

test("missing connector is blocked",async()=>{
  const result=await acquireCertificateMetadata({
    host:"example.com"
  });

  assert.equal(result.status,"BLOCKED");
});

test("connector metadata is accepted",async()=>{
  const result=await acquireCertificateMetadata({
    host:"example.com",
    connector:async()=>({
      subject:"CN=example.com"
    })
  });

  assert.equal(result.status,"PASS");
});
