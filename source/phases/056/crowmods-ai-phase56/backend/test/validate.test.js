const test=require("node:test");
const assert=require("node:assert/strict");
const {validateEnvironment}=require("../src/validate");

test("environment validation succeeds with database URL",()=>{
  const result=validateEnvironment({
    DATABASE_URL:"postgresql://example"
  });

  assert.equal(result.valid,true);
  assert.deepEqual(result.missing,[]);
});

test("environment validation reports missing variables",()=>{
  const result=validateEnvironment({});

  assert.equal(result.valid,false);
  assert.deepEqual(result.missing,["DATABASE_URL"]);
});
