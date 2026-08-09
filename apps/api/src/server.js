const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("node:fs");
const path = require("node:path");

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: "4mb" }));

const catalogPath = path.resolve(__dirname, "../../../docs/phase-catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "crowmods-ai-integrated", phases: catalog.length });
});

app.get("/ready", (_req, res) => {
  res.json({ status: "ready", integrationMode: true });
});

app.get("/api/phases", (_req, res) => {
  res.json({ count: catalog.length, phases: catalog });
});

const loaded = new Map();
const failures = new Map();

function loadPhase(phase) {
  if (loaded.has(phase)) return loaded.get(phase);
  if (failures.has(phase)) throw failures.get(phase);

  const modulePath = path.resolve(
    __dirname, "../../../services/phases", String(phase).padStart(3, "0"),
    "backend/src/server.js"
  );

  if (!fs.existsSync(modulePath)) {
    const err = new Error(`Phase ${phase} backend server was not found`);
    failures.set(phase, err);
    throw err;
  }

  try {
    process.env.CROWMODS_INTEGRATED = "1";
    const phaseApp = require(modulePath);
    loaded.set(phase, phaseApp);
    return phaseApp;
  } catch (err) {
    failures.set(phase, err);
    throw err;
  }
}

for (const item of catalog) {
  const phase = item.phase;
  app.use(`/api/phases/${phase}`, (req, res, next) => {
    try {
      return loadPhase(phase)(req, res, next);
    } catch (err) {
      console.error(`Phase ${phase} load failed:`, err.message);
      return res.status(503).json({ error: "phase_unavailable", phase, message: err.message });
    }
  });
}

app.get("/api/integration/status", (_req, res) => {
  res.json({
    mode: "integrated-phase-gateway",
    totalPhases: catalog.length,
    loaded: loaded.size,
    failed: failures.size,
    phases: catalog.map(item => ({
      phase: item.phase, loaded: loaded.has(item.phase), failed: failures.has(item.phase)
    }))
  });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`CrowMods AI integrated API listening on ${PORT}`));
}

module.exports = app;
