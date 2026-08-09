const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const ROOT = path.resolve(__dirname, "..");
const QUARANTINE = path.join(ROOT, "storage", "quarantine");
const DATA = path.join(ROOT, "storage", "releases.json");
const MAX_BYTES = 300 * 1024 * 1024; // 300 MB development limit

fs.mkdirSync(QUARANTINE, { recursive: true });
if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, "[]");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 }
});

function isApkBuffer(buffer) {
  // APK is a ZIP archive and should start with PK\x03\x04,
  // PK\x05\x06 (empty archive), or PK\x07\x08.
  return buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    ([0x03, 0x05, 0x07].includes(buffer[2]));
}

function loadReleases() {
  return JSON.parse(fs.readFileSync(DATA, "utf8"));
}

function saveReleases(items) {
  fs.writeFileSync(DATA, JSON.stringify(items, null, 2));
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "crowmods-backend", phase: 2 });
});

app.get("/api/releases", (_req, res) => {
  res.json({ releases: loadReleases() });
});

app.post("/api/uploads/apk", upload.single("apk"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "APK file is required." });
  }

  const original = path.basename(req.file.originalname || "");
  if (!original.toLowerCase().endsWith(".apk")) {
    return res.status(400).json({ error: "Only .apk files are accepted." });
  }

  if (!isApkBuffer(req.file.buffer)) {
    return res.status(400).json({ error: "File does not have a valid APK/ZIP signature." });
  }

  const sha256 = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
  const releaseId = crypto.randomUUID();
  const safeName = `${releaseId}.apk`;
  const destination = path.join(QUARANTINE, safeName);

  fs.writeFileSync(destination, req.file.buffer);

  const releases = loadReleases();
  if (releases.some(r => r.sha256 === sha256)) {
    fs.unlinkSync(destination);
    return res.status(409).json({
      error: "Duplicate file detected.",
      sha256
    });
  }

  const record = {
    id: releaseId,
    originalName: original,
    storedName: safeName,
    sizeBytes: req.file.size,
    sha256,
    status: "PENDING_REVIEW",
    storage: "QUARANTINE",
    createdAt: new Date().toISOString()
  };

  releases.unshift(record);
  saveReleases(releases);

  res.status(201).json({
    message: "APK quarantined successfully.",
    release: record
  });
});

app.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "APK exceeds the upload size limit." });
  }
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

const port = process.env.PORT || 4000;
if (!process.env.CROWMODS_INTEGRATED) app.listen(port, () => console.log(`CrowMods Phase 2 API: http://localhost:${port}`));


module.exports = app;
