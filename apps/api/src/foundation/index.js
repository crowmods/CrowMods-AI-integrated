const express = require("express");
const { router } = require("./routes/admin.routes");
const config = require("./config/env");
const { getRepository } = require("./db");
const releases = require("./modules/releases/service");
const uploads = require("./modules/uploads/service");
const { preview: websitePreview } = require("./modules/publishing/website");
const auth = require("./modules/auth/service");

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "4mb" }));

app.get("/health", (_req, res) => res.json({ status: "healthy", service: "crowmods-ai-foundation" }));

app.get("/releases/:slug", async (req, res) => {
  try {
    const release = await releases.getBySlug(req.params.slug);
    if (release.status !== "PUBLISHED" || release.visibility === "PRIVATE") {
      return res.status(404).json({ error: "not_found", message: "Release not found." });
    }
    const upload = release.upload_id ? await uploads.get(release.upload_id) : null;
    res.type("html").send(websitePreview(release, upload));
  } catch (err) {
    res.status(404).json({ error: "not_found", message: "Release not found." });
  }
});

app.use("/api/admin", router);

async function initFoundation() {
  const repo = getRepository();
  if (config.databaseUrl && typeof repo.migrate === "function") {
    await repo.migrate();
  }
  if (config.adminEmail && config.adminPassword) {
    await auth.createInitialAdmin(config.adminEmail, config.adminPassword, config.adminName);
  }
  return { app, config };
}

module.exports = { app, config, initFoundation };