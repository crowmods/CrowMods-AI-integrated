const test=require("node:test");
const assert=require("node:assert/strict");
const {validate}=require("../src/schema");

const schema={
  type:"object",
  required:["service","status"],
  properties:{
    service:{type:"string"},
    status:{type:"number"}
  }
};

test("valid event payload passes",()=>{
  const r=validate(schema,{
    payload:{service:"api",status:503}
  });
  assert.equal(r.valid,true);
});

test("missing required field fails",()=>{
  const r=validate(schema,{
    payload:{service:"api"}
  });
  assert.equal(r.valid,false);
});
