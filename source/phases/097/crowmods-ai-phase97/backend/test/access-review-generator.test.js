const test=require("node:test");
const assert=require("node:assert/strict");
const {
  findStaleSubjects,
  buildAssignments
}=require("../src/access-review-generator");

test("stale subjects are detected",()=>{
  const result=findStaleSubjects({
    subjects:["a","b"],
    lastSeenBySubject:{
      a:1000,
      b:Date.now()
    },
    now:1000+91*24*60*60*1000
  });

  assert.deepEqual(result,["a"]);
});

test("review assignments are generated",()=>{
  const result=buildAssignments({
    subjects:["a","b"],
    reviewer:"reviewer-1",
    dueAt:"2030-01-01"
  });

  assert.equal(result.length,2);
  assert.equal(result[0].status,"PENDING");
});
