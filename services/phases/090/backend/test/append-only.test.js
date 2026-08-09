const test=require("node:test");
const assert=require("node:assert/strict");
const {
  MemoryAppendOnlyStore
}=require("../src/append-only");

test("append-only store rejects overwrite",async()=>{
  const store=new MemoryAppendOnlyStore();

  await store.append("audit-1",{value:1});

  await assert.rejects(
    store.append("audit-1",{value:2})
  );
});
