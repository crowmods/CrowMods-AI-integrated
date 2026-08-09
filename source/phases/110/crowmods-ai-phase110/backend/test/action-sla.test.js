const test=require("node:test");
const assert=require("node:assert/strict");
const {
  evaluateActionSla
}=require("../src/action-sla");

test("future action is on track",()=>{
  const result=evaluateActionSla({
    dueAt:"2026-01-03T00:00:00Z",
    now:"2026-01-01T00:00:00Z"
  });

  assert.equal(result.status,"ON_TRACK");
});

test("overdue action is flagged",()=>{
  const result=evaluateActionSla({
    dueAt:"2025-12-31T00:00:00Z",
    now:"2026-01-01T00:00:00Z"
  });

  assert.equal(result.status,"OVERDUE");
});
