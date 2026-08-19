const express = require("express");
const path = require("node:path");
const { router } = require("./routes/admin.routes");
const config = require("./config/env");
const { getRepository } = require("./db");
const releases = require("./modules/releases/service");
const uploads = require("./modules/uploads/service");
const { preview: websitePreview, siteOptions } = require("./modules/publishing/website");
const { renderReleaseIndex, esc } = require("./modules/publishing/website-template");
const auth = require("./modules/auth/service");

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "4mb" }));

app.get("/health", (_req, res) => res.json({ status: "healthy", service: "crowmods-ai-foundation" }));

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send("User-agent: *\nAllow: /\nDisallow: /api/\n");
});

app.get("/og-logo.png", (_req, res) => {
  res.sendFile(path.join(__dirname, "assets", "og-logo.png"));
});

app.get("/favicon.ico", (_req, res) => {
  res.sendFile(path.join(__dirname, "assets", "favicon.png"));
});

app.get("/sitemap.xml", async (req, res) => {
  try {
    const all = await releases.list({ limit: 500, status: "PUBLISHED" });
    const { publicDomain } = await siteOptions();
    const base = String(publicDomain || "").replace(/\/+$/, "") || "";
    const publicReleases = all.filter(r => r.visibility !== "PRIVATE");
    const urls = publicReleases.map(r => {
      const loc = `${base}/releases/${encodeURIComponent(r.slug)}`;
      const lastmod = r.published_at ? new Date(r.published_at).toISOString().slice(0, 10) : "";
      return `  <url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
    }).join("\n");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc></url>
  <url><loc>${base}/releases</loc></url>
${urls}
</urlset>
`);
  } catch {
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`);
  }
});

app.get("/", async (_req, res) => {
  try {
    const all = await releases.list({ limit: 500, status: "PUBLISHED" });
    res.type("html").send(renderReleaseIndex(all, await siteOptions()));
  } catch {
    res.type("html").send(renderReleaseIndex([], await siteOptions()));
  }
});

app.get("/releases", async (_req, res) => {
  try {
    const all = await releases.list({ limit: 500, status: "PUBLISHED" });
    res.type("html").send(renderReleaseIndex(all, await siteOptions()));
  } catch {
    res.type("html").send(renderReleaseIndex([], await siteOptions()));
  }
});

app.get("/releases/:slug", async (req, res) => {
  try {
    const release = await releases.getBySlug(req.params.slug);
    if (release.status !== "PUBLISHED" || release.visibility === "PRIVATE") {
      return res.status(404).type("html").send(notFoundPage());
    }
    const upload = release.upload_id ? await uploads.get(release.upload_id) : null;
    res.type("html").send(await websitePreview(release, upload));
  } catch (err) {
    res.status(404).type("html").send(notFoundPage());
  }
});

app.get("/releases/:slug/download", async (req, res) => {
  try {
    const release = await releases.getBySlug(req.params.slug);
    if (release.status !== "PUBLISHED" || release.visibility === "PRIVATE") {
      return res.status(404).json({ error: "not_found", message: "Release not found." });
    }
    if (!release.upload_id) {
      return res.status(404).json({ error: "not_found", message: "Artifact not found." });
    }
    const upload = await uploads.get(release.upload_id);
    if (!upload.storage_path) {
      return res.status(404).json({ error: "not_found", message: "Artifact not found." });
    }
    const filename = (upload.original_filename || `${release.slug}.apk`).replace(/[^a-zA-Z0-9._-]/g, "_");
    res.download(upload.storage_path, filename, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: "not_found", message: "Artifact not found." });
      }
    });
  } catch (err) {
    res.status(404).json({ error: "not_found", message: "Release not found." });
  }
});

function notFoundPage() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="theme-color" content="#0b0f17"/><link rel="icon" href="/favicon.ico"/><title>Not Found</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#0b0f17;color:#e8edf6;min-height:100vh;display:flex;align-items:center;justify-content:center}main{text-align:center;padding:32px}h1{font-size:64px;margin:0;color:#4f8cff}a{color:#8b96ad;text-decoration:none}a:hover{color:#e8edf6}</style></head>
<body><main><h1>404</h1><p>Release not found.</p><a href="/releases">&larr; All releases</a></main></body></html>`;
}

app.use("/api/admin", router);

async function initFoundation() {
  const repo = getRepository();
  if (config.databaseUrl && typeof repo.migrate === "function") {
    await repo.migrate();
  }
  if (config.adminEmail && config.adminPassword) {
    await auth.createInitialAdmin(config.adminEmail, config.adminPassword, config.adminName);
  } else {
    const crypto = require("node:crypto");
    const email = "admin@crowmods.test";
    const password = crypto.randomBytes(12).toString("base64url");
    const created = await auth.createInitialAdmin(email, password, "Super Admin");
    if (created) {
      console.log(`ADMIN_BOOTSTRAP email=${email} password=${password} (set ADMIN_EMAIL/ADMIN_PASSWORD env vars to use your own credentials)`);
    }
  }
  return { app, config };
}

module.exports = { app, config, initFoundation };