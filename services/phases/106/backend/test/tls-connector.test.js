const test=require("node:test");
const assert=require("node:assert/strict");
const {
  LiveTlsConnector,
  validateTlsConnectorConfig
}=require("../src/tls-connector");

test("TLS allowlist configuration passes",()=>{
  const result=validateTlsConnectorConfig({
    allowlist:["issuer.example"]
  });

  assert.equal(result.status,"PASS");
});

test("empty TLS allowlist is blocked",()=>{
  const result=validateTlsConnectorConfig({
    allowlist:[]
  });

  assert.equal(result.status,"BLOCKED");
});

test("connector checks destination allowlist",()=>{
  const connector=new LiveTlsConnector({
    allowlist:["issuer.example"]
  });

  assert.equal(
    connector.isAllowed("issuer.example"),
    true
  );
  assert.equal(
    connector.isAllowed("other.example"),
    false
  );
});
