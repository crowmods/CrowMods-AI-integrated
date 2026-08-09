const test=require("node:test");
const assert=require("node:assert/strict");
const {
  parseCacheControl,
  validateJwksUri,
  HardenedJwksHttpTransport
}=require("../src/jwks-http");

test("cache-control max-age is parsed",()=>{
  assert.equal(
    parseCacheControl(
      "public, max-age=300"
    ).maxAgeSeconds,
    300
  );
});

test("HTTP JWKS URI is rejected",()=>{
  assert.equal(
    validateJwksUri({
      uri:"http://issuer.example/jwks"
    }).valid,
    false
  );
});

test("unapproved JWKS host is rejected",()=>{
  assert.equal(
    validateJwksUri({
      uri:"https://evil.example/jwks",
      allowedHosts:["issuer.example"]
    }).reason,
    "host_not_allowed"
  );
});

test("transport fetches bounded JWKS document",async()=>{
  const transport=new HardenedJwksHttpTransport({
    allowedHosts:["issuer.example"],
    fetchImpl:async()=>{
      return {
        ok:true,
        headers:{
          get:()=> "max-age=120"
        },
        text:async()=>JSON.stringify({
          keys:[]
        })
      };
    }
  });

  const result=await transport.fetch(
    "https://issuer.example/jwks"
  );

  assert.equal(result.maxAgeSeconds,120);
  assert.deepEqual(result.document,{keys:[]});
});
