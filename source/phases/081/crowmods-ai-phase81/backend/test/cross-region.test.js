const test=require("node:test");
const assert=require("node:assert/strict");
const {
  replicationHealthy,
  regionHealth,
  chooseRecoveryRegion,
  failbackReady
}=require("../src/cross-region");

test("replication lag within threshold is healthy",()=>{
  assert.equal(
    replicationHealthy({
      lagSeconds:20,
      maxLagSeconds:60
    }),
    true
  );
});

test("healthy region scores above recovery threshold",()=>{
  const result=regionHealth({
    availability:1,
    errorRate:0,
    replicationLag:0
  });

  assert.equal(result.healthy,true);
});

test("best healthy recovery region is selected",()=>{
  const result=chooseRecoveryRegion([
    {
      name:"region-a",
      enabled:true,
      healthy:true,
      healthScore:.91,
      replicationLag:20
    },
    {
      name:"region-b",
      enabled:true,
      healthy:true,
      healthScore:.97,
      replicationLag:10
    }
  ]);

  assert.equal(result.name,"region-b");
});

test("failback requires every prerequisite",()=>{
  assert.equal(
    failbackReady({
      replicationHealthy:true,
      targetHealthHealthy:true,
      dataIntegrityVerified:true,
      trafficReady:true
    }),
    true
  );
});
