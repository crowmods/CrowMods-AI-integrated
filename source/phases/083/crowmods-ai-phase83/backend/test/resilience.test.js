const test=require("node:test");
const assert=require("node:assert/strict");
const {
  capacityScore,
  chaosResult,
  overallResilience,
  resilienceGrade
}=require("../src/resilience");

test("healthy capacity receives a strong score",()=>{
  const result=capacityScore({
    availability:1,
    utilization:.2,
    replicationLag:2,
    recoveryReadiness:1
  });

  assert.equal(result.healthy,true);
});

test("successful chaos lifecycle passes",()=>{
  const result=chaosResult({
    injectionSucceeded:true,
    recoverySucceeded:true,
    rollbackSucceeded:true
  });

  assert.equal(result.passed,true);
});

test("resilience score receives a grade",()=>{
  const result=overallResilience({
    recoveryScore:1,
    capacityScore:.9,
    chaosScore:.9
  });

  assert.equal(result.grade,"A");
});

test("low score is graded F",()=>{
  assert.equal(resilienceGrade(.2),"F");
});
