const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "storage", "releases.json");
if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, "[]");

function load() {
  return JSON.parse(fs.readFileSync(DATA, "utf8"));
}
function save(items) {
  fs.writeFileSync(DATA, JSON.stringify(items, null, 2));
}
function audit(item, action, note = "") {
  item.audit = item.audit || [];
  item.audit.push({
    id: crypto.randomUUID(),
    action,
    note,
    at: new Date().toISOString()
  });
}

app.get("/health", (_req, res) =>
  res.json({ ok: true, service: "crowmods-backend", phase: 4 })
);

app.get("/api/releases", (_req, res) => {
  const releases = load();
  res.json({ releases });
});

app.get("/api/releases/pending", (_req, res) => {
  const releases = load().filter(x => x.status === "PENDING_REVIEW");
  res.json({ releases });
});

app.patch("/api/releases/:id/content", (req, res) => {
  const releases = load();
  const item = releases.find(x => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Release not found" });
  if (!["PENDING_REVIEW", "REJECTED"].includes(item.status))
    return res.status(409).json({ error: "Release cannot be edited in its current state" });

  item.aiBrief = {
    ...(item.aiBrief || {}),
    ...req.body
  };
  item.updatedAt = new Date().toISOString();
  audit(item, "CONTENT_EDITED");
  save(releases);
  res.json({ release: item });
});

app.post("/api/releases/:id/approve", (req, res) => {
  const releases = load();
  const item = releases.find(x => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Release not found" });
  if (item.status !== "PENDING_REVIEW")
    return res.status(409).json({ error: "Only pending releases can be approved" });

  item.status = "APPROVED";
  item.approvedAt = new Date().toISOString();
  audit(item, "APPROVED", "Approved for downstream publishing");
  save(releases);
  res.json({ message: "Release approved", release: item });
});

app.post("/api/releases/:id/reject", (req, res) => {
  const releases = load();
  const item = releases.find(x => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Release not found" });
  if (item.status !== "PENDING_REVIEW")
    return res.status(409).json({ error: "Only pending releases can be rejected" });

  item.status = "REJECTED";
  item.rejectionReason = String(req.body?.reason || "Rejected by administrator");
  item.rejectedAt = new Date().toISOString();
  audit(item, "REJECTED", item.rejectionReason);
  save(releases);
  res.json({ message: "Release rejected", release: item });
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT || 4000, () =>
  console.log("CrowMods Phase 4 API running")
);


module.exports = app;
