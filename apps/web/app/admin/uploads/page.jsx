"use client";

import { useEffect, useRef, useState } from "react";
import { api, API, formatBytes, timeAgo } from "../lib";

const STATUS_BADGE = {
  UPLOADED: "badge-blue", VALIDATING: "badge-yellow", VALID: "badge-green",
  FAILED: "badge-red", PROCESSING: "badge-yellow"
};

export default function UploadsPage() {
  const [uploads, setUploads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);

  const load = () => api("/uploads").then(r => setUploads(r.uploads)).catch(e => setError(e.message));

  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    setToast("");
    setProgress(10);
    const fd = new FormData();
    fd.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/api/admin/uploads`);
    xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("crowmods_token")}`);
    xhr.upload.onprogress = ev => { if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 90)); };
    xhr.onload = async () => {
      try {
        const res = JSON.parse(xhr.responseText);
        setProgress(100);
        await load();
        setToast(`Uploaded ${res.upload.original_filename}`);
        if (fileRef.current) fileRef.current.value = "";
      } catch {
        setError("Upload failed.");
      } finally {
        setBusy(false);
      }
    };
    xhr.onerror = () => { setError("Upload failed."); setBusy(false); };
    xhr.send(fd);
  };

  const validate = async (id) => {
    setBusy(true);
    setToast("");
    try {
      const res = await api(`/uploads/${id}/validate`, { method: "POST" });
      setToast("Validation complete");
      await load();
      setSelected(res.upload);
    } catch (err) {
      setToast(err.message);
    } finally {
      setBusy(false);
    }
  };

  const showDetail = async (id) => {
    const { upload } = await api(`/uploads/${id}`);
    setSelected(upload);
  };

  return (
    <>
      <h1 className="page-title">Uploads</h1>

      <div className="card">
        <h2 className="section-title">Upload APK / File</h2>
        <input ref={fileRef} type="file" accept=".apk,.aab,.zip" onChange={upload} style={{ display: "none" }} />
        <button className="btn btn-block" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? "Uploading…" : "Choose file to upload"}
        </button>
        {busy && (
          <div className="upload-progress" style={{ marginTop: 12 }}>
            <div style={{ width: `${progress}%` }} />
          </div>
        )}
        <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 0 }}>APK, AAB, or ZIP archives. Files are stored securely and validated before use.</p>
      </div>

      {toast && <div className="toast success">{toast}</div>}

      {selected && (
        <div className="card">
          <div className="spread">
            <h2 className="section-title">Details — {selected.original_filename}</h2>
            <button className="btn btn-sm btn-secondary" onClick={() => setSelected(null)}>Close</button>
          </div>
          <div className="grid">
            <div className="stat-card"><div className="label">Status</div><div><span className={`badge ${STATUS_BADGE[selected.status] || "badge-gray"}`}>{selected.status}</span></div></div>
            <div className="stat-card"><div className="label">Size</div><div className="value" style={{ fontSize: 16 }}>{formatBytes(selected.size_bytes)}</div></div>
            <div className="stat-card"><div className="label">SHA-256</div><div style={{ fontSize: 11, wordBreak: "break-all" }}>{selected.sha256 || "—"}</div></div>
            <div className="stat-card"><div className="label">Uploaded</div><div style={{ fontSize: 14 }}>{timeAgo(selected.created_at)}</div></div>
          </div>
          {selected.status === "UPLOADED" && (
            <button className="btn" style={{ marginTop: 12 }} onClick={() => validate(selected.id)} disabled={busy}>
              Validate &amp; Extract Metadata
            </button>
          )}
          {selected.metadata?.manifest && (
            <div style={{ marginTop: 12 }}>
              <h3 style={{ margin: "12px 0 8px", fontSize: 14 }}>Extracted Metadata</h3>
              <div className="grid">
                <div className="stat-card"><div className="label">Package</div><div style={{ fontSize: 13, wordBreak: "break-all" }}>{selected.metadata.manifest.package || "—"}</div></div>
                <div className="stat-card"><div className="label">Version Name</div><div>{selected.metadata.manifest.versionName || "—"}</div></div>
                <div className="stat-card"><div className="label">Version Code</div><div>{selected.metadata.manifest.versionCode ?? "—"}</div></div>
                <div className="stat-card"><div className="label">Signers</div><div>{selected.metadata.signers?.length || 0}</div></div>
              </div>
            </div>
          )}
          {selected.scans?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3 style={{ margin: "12px 0 8px", fontSize: 14 }}>Security Scans</h3>
              {selected.scans.map(s => (
                <div key={s.id} className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>{s.scanner} <span className="badge badge-gray">{s.version}</span></span>
                  <span className={`badge ${s.status === "CLEAN" ? "badge-green" : "badge-yellow"}`}>{s.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="section-title">All Uploads</h2>
        {!uploads.length && <div className="empty">No uploads yet. Upload your first APK above.</div>}
        {uploads.map(u => (
          <div key={u.id} className="list-card" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="main">
              <div className="title">{u.original_filename}</div>
              <div className="meta">{formatBytes(u.size_bytes)} • {timeAgo(u.created_at)}</div>
            </div>
            <div className="row">
              <span className={`badge ${STATUS_BADGE[u.status] || "badge-gray"}`}>{u.status}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => showDetail(u.id)}>View</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}