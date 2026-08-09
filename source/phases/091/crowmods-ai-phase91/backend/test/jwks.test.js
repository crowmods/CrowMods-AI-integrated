const test=require("node:test");
const assert=require("node:assert/strict");
const {JwksCache}=require("../src/jwks");

test("JWKS cache expires",()=>{
  const cache=new JwksCache({ttlSeconds:10});

  cache.put("provider",[
    {kid:"k1",algorithm:"RS256"}
  ],1000);

  assert.equal(cache.get("provider",5000).length,1);
  assert.equal(cache.get("provider",12001),null);
});

test("JWKS rotation replaces keys",()=>{
  const cache=new JwksCache();

  cache.rotate("provider",[
    {kid:"new",algorithm:"RS256"}
  ]);

  assert.equal(
    cache.get("provider")[0].kid,
    "new"
  );
});
