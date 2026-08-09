const test=require("node:test");
const assert=require("node:assert/strict");
const {
  manifestHash,
  buildManifest
}=require("../src/release-manifest");

test("manifest hash is deterministic",()=>{
  assert.equal(
    manifestHash({
      b:2,
      a:1
    }),
    manifestHash({
      a:1,
      b:2
    })
  );
});

test("release manifest contains hash",()=>{
  const manifest=buildManifest({
    releaseVersion:"1.0.0",
    controls:["RBAC"],
    artifacts:["README.md"]
  });

  assert.equal(
    typeof manifest.manifestHash,
    "string"
  );
  assert.equal(
    manifest.releaseVersion,
    "1.0.0"
  );
});
