function renderReleasePage(release, upload) {
  const manifest = upload?.metadata?.manifest || {};
  const statusColor = {
    PUBLISHED: "#2ecc71",
    FAILED: "#e74c3c",
    PUBLISHING: "#f1c40f"
  }[release.status] || "#888";

  const permissions = manifest.permissions || [];
  const meta = [
    { label: "Version", value: release.version || upload?.metadata?.versionName || "—" },
    { label: "Package", value: release.package_name || manifest.package || "—" },
    { label: "Size", value: upload ? formatBytes(upload.size_bytes) : "—" },
    { label: "SHA-256", value: upload?.sha256 || "—" },
    { label: "Published", value: release.published_at ? new Date(release.published_at).toLocaleDateString() : "—" }
  ];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(release.name)}</title>
<style>
  :root{--bg:#0b0f17;--panel:#121828;--border:#232c3f;--text:#e8edf6;--muted:#8b96ad;--accent:#4f8cff}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--text)}
  main{max-width:860px;margin:0 auto;padding:32px 16px}
  .badge{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;background:${statusColor}22;color:${statusColor}}
  h1{font-size:28px;margin:12px 0 4px}
  .sub{color:var(--muted);margin-bottom:20px}
  .card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
  .kv label{display:block;color:var(--muted);font-size:12px;margin-bottom:4px}
  .kv div{font-size:14px;word-break:break-all}
  .btn{display:inline-block;background:var(--accent);color:#fff;border:0;border-radius:8px;padding:12px 20px;text-decoration:none;font-weight:600}
  .desc{line-height:1.6;color:#d5dcea}
  ul.perms{margin:0;padding-left:18px;color:var(--muted)}
</style>
</head>
<body>
<main>
  <span class="badge">${esc(release.status)}</span>
  <h1>${esc(release.name)}</h1>
  <div class="sub">${esc(release.slug)}</div>
  <div class="card desc">${esc(release.description || "No description provided.")}</div>
  <div class="card"><div class="grid">
    ${meta.map(m => `<div class="kv"><label>${esc(m.label)}</label><div>${esc(m.value)}</div></div>`).join("")}
  </div></div>
  ${permissions.length ? `<div class="card"><h3>Permissions</h3><ul class="perms">${permissions.map(p => `<li>${esc(p)}</li>`).join("")}</ul></div>` : ""}
  <a class="btn" href="/releases/${esc(release.slug)}/download">Download</a>
</main>
</body>
</html>`;
}

function esc(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = Number(bytes);
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
}

module.exports = { renderReleasePage, esc };