const test=require("node:test");
const assert=require("node:assert/strict");
const {
  AppendOnlyMemoryExportAdapter,
  retentionUntil
}=require("../src/immutable");

test("append-only adapter rejects duplicate object",async()=>{
  const adapter=new AppendOnlyMemoryExportAdapter();

  await adapter.put("audit-1","data");

  await assert.rejects(
    adapter.put("audit-1","data")
  );
});

test("retention date is generated",()=>{
  const value=retentionUntil(30);

  assert.equal(typeof value,"string");
  assert.equal(Number.isNaN(Date.parse(value)),false);
});
