const fs = require("node:fs");
const path = require("node:path");
const { getRepository } = require("../../db");
const config = require("../../config/env");
const { sha256Hex, randomInternalName } = require("../../lib/crypto");

const ALLOWED_EXTENSIONS = new Set(["apk", "aab", "zip"]);
const MAX_BYTES = config.maxUploadBytes;

function storageRoot() {
  if (config.uploadsDir) return config.uploadsDir;
  return path.resolve(__dirname, "../../../../data/uploads");
}

function safeExtension(original) {
  const ext = path.extname(original || "").slice(1).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext) ? ext : null;
}

function isZipMagic(buffer) {
  return buffer.length >= 4 &&
    buffer[0] === 0x50 && buffer[1] === 0x4b &&
    [0x03, 0x05, 0x07].includes(buffer[2]);
}

function validateBuffer(buffer, extension) {
  if (buffer.length === 0) return { ok: false, reason: "empty_file" };
  if (buffer.length > MAX_BYTES) return { ok: false, reason: "file_too_large" };
  if (!isZipMagic(buffer)) return { ok: false, reason: "not_zip_archive" };
  return { ok: true };
}

async function store({ buffer, extension, originalFilename }) {
  const internal = randomInternalName(extension);
  const dir = storageRoot();
  fs.mkdirSync(dir, { recursive: true });
  const abs = path.join(dir, internal);
  await fs.promises.writeFile(abs, buffer, { mode: 0o600 });
  return { internal, abs };
}

async function create({ buffer, originalFilename, mimeType, customerId, userId, ip }) {
  const repo = getRepository();
  const extension = safeExtension(originalFilename);
  if (!extension) {
    const err = new Error("File extension is not allowed.");
    err.code = "UNSUPPORTED_EXTENSION";
    throw err;
  }
  const extMatches = extension === "apk" || extension === "aab";
  if (extMatches && !isZipMagic(buffer)) {
    const err = new Error("File is not a valid archive.");
    err.code = "INVALID_ARCHIVE";
    throw err;
  }
  const check = validateBuffer(buffer, extension);
  if (!check.ok) {
    const err = new Error(`File rejected: ${check.reason}`);
    err.code = "REJECTED";
    throw err;
  }

  const { internal, abs } = await store({ buffer, extension, originalFilename });
  const sha256 = sha256Hex(buffer);
  const sizeBytes = buffer.length;

  const upload = await repo.createUpload({
    customerId, userId,
    originalFilename: path.basename(originalFilename || "upload"),
    internalFilename: internal,
    mimeType,
    extension,
    sizeBytes,
    sha256,
    storagePath: abs
  });

  await repo.createAuditLog({
    actorId: userId, actorEmail: undefined, action: "UPLOAD_CREATED",
    resource: "upload", resourceId: upload.id, ip,
    metadata: { filename: upload.original_filename, sizeBytes, sha256 }
  });

  return upload;
}

async function list({ limit, offset, status }) {
  const repo = getRepository();
  return repo.listUploads({ limit, offset, status });
}

async function get(id) {
  const repo = getRepository();
  const upload = await repo.findUploadById(id);
  if (!upload) {
    const err = new Error("Upload not found");
    err.status = 404;
    throw err;
  }
  const scans = await repo.listScansByUpload(id);
  return { ...upload, scans };
}

async function remove(id, userId, ip) {
  const repo = getRepository();
  const upload = await repo.findUploadById(id);
  if (!upload) {
    const err = new Error("Upload not found");
    err.status = 404;
    throw err;
  }
  if (upload.storage_path) {
    try { fs.rmSync(upload.storage_path, { force: true }); } catch {}
  }
  await repo.deleteUpload(id);
  await repo.createAuditLog({
    actorId: userId, action: "UPLOAD_DELETED", resource: "upload", resourceId: id, ip
  });
  return { ok: true };
}

module.exports = { create, list, get, remove, storageRoot, ALLOWED_EXTENSIONS };