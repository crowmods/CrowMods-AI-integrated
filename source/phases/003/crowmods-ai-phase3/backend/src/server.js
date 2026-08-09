const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "storage", "releases.json");
const QUARANTINE = path.join(ROOT, "storage", "quarantine");

fs.mkdirSync(QUARANTINE, { recursive: true });
if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, "[]");

function load() {
  return JSON.parse(fs.readFileSync(DATA, "utf8"));
}
function save(items) {
  fs.writeFileSync(DATA, JSON.stringify(items, null, 2));
}

app.get("/health", (_req, res) =>
  res.json({ ok: true, service: "crowmods-backend", phase: 3 })
);

app.get("/api/releases", (_req, res) =>
  res.json({ releases: load() })
);

app.get("/api/releases/:id", (req, res) => {
  const item = load().find(x => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Release not found" });
  res.json({ release: item });
});

// Development processor. Production should use authenticated jobs/queues.
app.post("/api/releases/:id/process", (req, res) => {
  const releases = load();
  const item = releases.find(x => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Release not found" });

  const file = path.join(QUARANTINE, item.storedName);
  if (!fs.existsSync(file))
    return res.status(404).json({ error: "Quarantined file missing" });

  item.status = "PROCESSING";

  const title = item.originalName
    .replace(/\.apk$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();

  item.aiBrief = {
    id: item.id,
    title,
    platform: "Android",
    sha256: item.sha256,
    sizeBytes: item.sizeBytes,
    suggestedCategory: "Uncategorized",
    shortDescription: "Android release prepared for human review.",
    description:
      `CrowMods release: ${title}. Review supplied metadata and authorization before publication.`,
    tags: ["Android", "APK"],
    seoTitle: `${title} | CrowMods`,
    seoDescription: `Release information for ${title}.`,
    features: [],
    whatsNew: [],
    socialCaptions: {},
    verifiedClaims: [],
    processingNotes: [
      "APK remains quarantined.",
      "No APK code was executed.",
      "Human approval is required before publication."
    ]
  };

  item.status = "PENDING_REVIEW";
  item.processedAt = new Date().toISOString();
  save(releases);

  res.json({ message: "AI-ready brief created", release: item });
});

app.listen(process.env.PORT || 4000, () =>
  console.log("CrowMods Phase 3 API running")
);
