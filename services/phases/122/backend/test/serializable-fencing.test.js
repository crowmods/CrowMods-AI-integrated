const test=require("node:test");
const assert=require("node:assert/strict");
const {validateSerializableCommit}=require("../src/serializable-fencing");

test("serializable commit succeeds",()=>{
  const r=validateSerializableCommit({
    resourceKey:"r1",expectedResourceKey:"r1",
    observedVersion:4,currentVersion:4,nextVersion:5,
    payloadDigest:"abc",expectedPayloadDigest:"abc"
  });
  assert.equal(r.status,"COMMITTED");
  assert.equal(r.committedVersion,5);
});

test("concurrent change aborts",()=>{
  const r=validateSerializableCommit({
    resourceKey:"r1",expectedResourceKey:"r1",
    observedVersion:4,currentVersion:5,nextVersion:6,
    payloadDigest:"abc",expectedPayloadDigest:"abc"
  });
  assert.equal(r.reason,"concurrent_version_change");
});
