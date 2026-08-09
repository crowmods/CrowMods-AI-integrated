const test=require("node:test");
const assert=require("node:assert/strict");
const {buildGraph,impactedServices}=require("../src/graph");

test("graph includes service nodes",()=>{
  const graph=buildGraph([
    {
      sourceService:"web",
      targetService:"api",
      criticality:"HIGH"
    },
    {
      sourceService:"api",
      targetService:"db",
      criticality:"CRITICAL"
    }
  ]);

  assert.deepEqual(graph.nodes.sort(),["api","db","web"]);
});

test("impact propagates upstream",()=>{
  const graph=buildGraph([
    {sourceService:"web",targetService:"api"},
    {sourceService:"api",targetService:"db"},
    {sourceService:"worker",targetService:"db"}
  ]);

  assert.deepEqual(
    impactedServices(graph,"db").sort(),
    ["api","db","web","worker"]
  );
});
