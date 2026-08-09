const crypto = require("crypto");

const ALLOWED_TYPE = "application/vnd.android.package-archive";

function validateUpload({originalName,contentType,sizeBytes,maxBytes}) {
  const issues = [];
  const name = String(originalName || "");

  if (!name.toLowerCase().endsWith(".apk"))
    issues.push("Only APK filenames are accepted.");

  if (contentType && contentType !== ALLOWED_TYPE && contentType !== "application/octet-stream")
    issues.push("Unexpected content type.");

  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0)
    issues.push("Invalid file size.");

  if (sizeBytes > maxBytes)
    issues.push("File exceeds configured upload limit.");

  return {valid: issues.length === 0, issues};
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function buildQuarantineKey(id, originalName) {
  const safe = String(originalName).replace(/[^a-zA-Z0-9._-]/g, "_");
  return `quarantine/${id}/${safe}`;
}

module.exports = {validateUpload,sha256,buildQuarantineKey};
