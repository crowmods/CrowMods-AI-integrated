const test=require("node:test");
const assert=require("node:assert/strict");
const {
  requestAcceptance,
  evaluateAcceptance
}=require("../src/risk-acceptance");

test("valid risk acceptance request is created",()=>{
  assert.equal(
    requestAcceptance({
      riskStatement:"Temporary control gap",
      owner:"security-team",
      expiresAt:"2027-01-01T00:00:00Z"
    }).status,
    "REQUESTED"
  );
});

test("expired approval becomes inactive",()=>{
  const result=evaluateAcceptance({
    status:"APPROVED",
    expiresAt:"2025-01-01T00:00:00Z",
    now:"2026-01-01T00:00:00Z"
  });

  assert.equal(result.status,"EXPIRED");
  assert.equal(result.active,false);
});
