const { getRepository } = require("../../db");

const SCANNERS = [
  { key: "metadata", version: "1.0.0" },
  { key: "hash", version: "1.0.0" },
  { key: "integrity", version: "1.0.0" },
  { key: "policy", version: "1.0.0" },
  { key: "malware-adapter", version: "0.0.0" }
];

async function scanUpload(uploadId, upload, ip) {
  const repo = getRepository();
  const findings = [];
  let status = "CLEAN";

  if (!upload.sha256 || upload.size_bytes <= 0) {
    findings.push({ scanner: "integrity", severity: "MEDIUM", message: "Missing integrity hash or size." });
    status = "FINDINGS";
  }

  if (!upload.metadata || Object.keys(upload.metadata).length === 0) {
    findings.push({ scanner: "metadata", severity: "INFO", message: "No metadata extracted yet." });
  }

  const scan = await repo.createScan({
    uploadId,
    scanner: "foundation-scanner",
    version: "1.0.0",
    status,
    findings,
    metadata: { note: "Foundation-level integrity scan. Clean result does not prove malware-free; production malware scanning adapters are pluggable." }
  });

  await repo.createAuditLog({
    actorId: undefined, action: "SCAN_COMPLETED", resource: "upload", resourceId: uploadId, ip,
    metadata: { scanner: scan.scanner, status: scan.status, findings: scan.findings.length }
  });

  return scan;
}

module.exports = { scanUpload, SCANNERS };