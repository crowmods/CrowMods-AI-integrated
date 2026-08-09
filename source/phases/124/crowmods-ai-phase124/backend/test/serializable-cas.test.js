const test=require("node:test");
const assert=require("node:assert/strict");
const {serializableCas}=require("../src/serializable-cas");

function fakePool(){
  const calls=[];
  const client={
    async query(sql,args=[]){
      calls.push({sql,args});
      if(sql.startsWith("BEGIN"))
        return {};
      if(sql.includes("SELECT fencing_version"))
        return {rowCount:1,rows:[{fencing_version:4}]};
      if(sql.startsWith("UPDATE"))
        return {rowCount:1,rows:[{fencing_version:5}]};
      if(sql==="COMMIT") return {};
      if(sql==="ROLLBACK") return {};
      return {};
    },
    release(){}
  };
  return {
    calls,
    connect:async()=>client
  };
}

test("serializable CAS commits",async()=>{
  const pool=fakePool();
  const r=await serializableCas(pool,{
    resourceKey:"r",
    expectedVersion:4,
    nextDigest:"d"
  });
  assert.equal(r.status,"COMMITTED");
  assert.equal(r.committedVersion,5);
});
