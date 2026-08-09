const test=require("node:test");
const assert=require("node:assert/strict");
const {buildEligibleRows}=require("../src/purge-sql-enforcer");

test("only expired rows are selected",()=>{
 const r=buildEligibleRows({
  retentionDays:30,
  now:"2026-02-01T00:00:00Z",
  rows:[
   {key:"old",createdAt:"2025-01-01T00:00:00Z"},
   {key:"new",createdAt:"2026-01-15T00:00:00Z"}
  ]
 });
 assert.equal(r.length,1);
 assert.equal(r[0].key,"old");
});
