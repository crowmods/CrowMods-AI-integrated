const REQUIRED=[
  "ci",
  "unitTests",
  "integrationTests",
  "securityChecks",
  "artifactVerified",
  "stagingSmoke",
  "databaseBackupVerified",
  "canaryVerified"
];

function evaluateReadiness(evidence={}){
  const checks=Object.fromEntries(
    REQUIRED.map(key=>[key,evidence[key]===true])
  );

  const ready=Object.values(checks).every(Boolean);

  return {
    ready,
    checks,
    missing:REQUIRED.filter(key=>!checks[key])
  };
}

module.exports={REQUIRED,evaluateReadiness};
