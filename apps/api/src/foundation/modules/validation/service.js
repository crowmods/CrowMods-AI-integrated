const fs = require("node:fs");
const { getRepository } = require("../../db");
const { extractMetadata } = require("../metadata/extractor");
const { scanUpload } = require("../scans/service");

async function validateUpload(uploadId, ip) {
  const repo = getRepository();
  const upload = await repo.findUploadById(uploadId);
  if (!upload) {
    const err = new Error("Upload not found");
    err.status = 404;
    throw err;
  }

  if (upload.status !== "UPLOADED") {
    const err = new Error(`Upload is not in a validatable state (${upload.status}).`);
    err.status = 409;
    throw err;
  }

  await repo.updateUpload(uploadId, { status: "VALIDATING" });

  let metadata = {};
  let validationError = null;

  try {
    if (upload.storage_path && fs.existsSync(upload.storage_path)) {
      const buffer = fs.readFileSync(upload.storage_path);
      const ext = (upload.extension || "").toLowerCase();
      if (ext === "apk" || ext === "aab" || ext === "zip") {
        const parsed = extractMetadata(buffer, ext);
        if (parsed.ok) {
          metadata = {
            fileCount: parsed.fileCount,
            format: parsed.format,
            hasClassesDex: parsed.hasClassesDex,
            hasResourcesArsc: parsed.hasResourcesArsc,
            signers: parsed.signers,
            hasApkSigningBlock: parsed.hasApkSigningBlock,
            manifest: parsed.androidManifest || null,
            permissions: parsed.androidManifest?.permissions || []
          };
        } else {
          validationError = parsed.error;
        }
      }
    }
  } catch (err) {
    validationError = err.message;
  }

  if (validationError) {
    await repo.updateUpload(uploadId, { status: "FAILED", error: validationError });
    await repo.createAuditLog({
      action: "UPLOAD_VALIDATION_FAILED", resource: "upload", resourceId: uploadId, ip,
      result: "FAILURE", metadata: { error: validationError }
    });
    const err = new Error(`Validation failed: ${validationError}`);
    err.status = 422;
    throw err;
  }

  const pkg = metadata.manifest?.package || null;
  const versionName = metadata.manifest?.versionName || null;
  const versionCode = metadata.manifest?.versionCode ?? null;

  await repo.updateUpload(uploadId, {
    status: "VALID",
    metadata: {
      ...upload.metadata,
      ...metadata,
      package: pkg,
      versionName,
      versionCode
    }
  });

  const scan = await scanUpload(uploadId, upload, ip);

  await repo.createAuditLog({
    action: "UPLOAD_VALIDATED", resource: "upload", resourceId: uploadId, ip,
    metadata: { package: pkg, versionName, versionCode, scanStatus: scan.status }
  });

  return { upload: await repo.findUploadById(uploadId), scan };
}

module.exports = { validateUpload };