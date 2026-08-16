"use client";

import { useEffect, useState } from "react";
import { api, timeAgo } from "../lib";

const STATUS_BADGE = {
  DRAFT: "badge-gray", PROCESSING: "badge-yellow", READY_FOR_REVIEW: "badge-blue",
  APPROVED: "badge-green", REJECTED: "badge-red", CHANGES_REQUESTED: "badge-yellow",
  PUBLISHING: "badge-yellow", PUBLISHED: "badge-green", FAILED: "badge-red", ARCHIVED: "badge-gray"
};

export default function ReleasesPage() {
  const [releases, setReleases] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ name: "", uploadId: "", description: "", visibility: "PRIVATE" });
  const [uploads, setUploads] = useState([]);

  const load = () => api("/releases").then(r => setReleases(r.releases)).catch(() => {});
  const loadUploads = () => api("/uploads").then(r => setUploads(r.uploads)).catch(() => {});

  useEffect(() => { load(); }, []);
  useEffect(() => { if (showCreate) loadUploads(); }, [showCreate]);

  const create = async () => {
    if (!form.name) return setToast("Name is required.");
    setToast("");
    try {
      const { release } = await api("/releases", { method: "POST", body: { ...form, uploadId: form.uploadId || undefined } });
      setToast(`Created ${release.name}`);
      setShowCreate(false);
      load();
    } catch (err) {
      setToast(err.message);
    }
  };

  const openDetail = async (id) => {
    const d = await api(`/releases/${id}`);
    setDetail(d);
  };

  const markReady = async (id) => {
    await api(`/releases/${id}/ready`, { method: "POST" });
    setToast("Release moved to review.");
    load();
    if (detail?.release?.id === id) openDetail(id);
  };

  const archive = async (id) => {
    await api(`/releases/${id}/archive`, { method: "POST" });
    setToast("Release archived.");
    setDetail(null);
    load();
  };

  const publish = async (id, providers) => {
    setToast("");
    try {
      await api(`/releases/${id}/publish`, { method: "POST", body: { providers } });
      setToast("Publishing jobs started");
      if (detail?.release?.id === id) openDetail(id);
      load();
    } catch (err) {
      setToast(err.message);
    }
  };

  const validUploads = uploads.filter(u => u.status === "VALID");

  return (
    <>
      <div className="spread">
        <h1 className="page-title">Releases</h1>
        <button className="btn" onClick={() => setShowCreate(!showCreate)}>{showCreate ? "Cancel" : "+ New"}</button>
      </div>

      {showCreate && (
        <div className="card">
          <h2 className="section-title">Create Release</h2>
          <label className="field"><span>Name</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My App" /></label>
          <label className="field"><span>Upload (validated APK)</span>
            <select value={form.uploadId} onChange={e => setForm({ ...form, uploadId: e.target.value })}>
              <option value="">— No upload —</option>
              {validUploads.map(u => <option key={u.id} value={u.id}>{u.original_filename}</option>)}
            </select>
          </label>
          <label className="field"><span>Description</span><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          <label className="field"><span>Visibility</span>
            <select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}>
              <option value="PRIVATE">PRIVATE</option>
              <option value="PUBLIC">PUBLIC</option>
            </select>
          </label>
          <button className="btn btn-block" onClick={create}>Create Release</button>
        </div>
      )}

      {toast && <div className="toast success">{toast}</div>}

      {detail && (
        <div className="card">
          <div className="spread">
            <h2 className="section-title">{detail.release.name}</h2>
            <button className="btn btn-sm btn-secondary" onClick={() => setDetail(null)}>Close</button>
          </div>
          <p style={{ color: "var(--muted)", marginTop: 0 }}>{detail.release.slug} • v{detail.release.version || "0.0.0"}</p>
          <div className="row">
            <span className={`badge ${STATUS_BADGE[detail.release.status] || "badge-gray"}`}>{detail.release.status}</span>
            <span className="badge badge-gray">{detail.release.package_name || "no package"}</span>
            <span className="badge badge-gray">Updated {timeAgo(detail.release.updated_at)}</span>
          </div>
          {detail.release.description && <p style={{ color: "#d5dcea" }}>{detail.release.description}</p>}
          {detail.upload && (
            <div style={{ marginTop: 8 }}>
              <h3 style={{ fontSize: 14, marginBottom: 6 }}>Artifact</h3>
              <div className="stat-card">
                <div className="label">{detail.upload.original_filename}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", wordBreak: "break-all" }}>SHA-256: {detail.upload.sha256 || "—"}</div>
                <span className={`badge ${STATUS_BADGE[detail.upload.status] || "badge-gray"}`}>{detail.upload.status}</span>
              </div>
            </div>
          )}
          {detail.scans?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <h3 style={{ fontSize: 14, marginBottom: 6 }}>Security Scans</h3>
              {detail.scans.map(s => (
                <div key={s.id} className="row" style={{ justifyContent: "space-between", padding: "6px 0" }}>
                  <span className="badge badge-gray">{s.scanner}</span>
                  <span className={`badge ${s.status === "CLEAN" ? "badge-green" : "badge-yellow"}`}>{s.status}</span>
                </div>
              ))}
            </div>
          )}
          {detail.jobs?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <h3 style={{ fontSize: 14, marginBottom: 6 }}>Publishing</h3>
              {detail.jobs.map(j => (
                <div key={j.id} className="row" style={{ justifyContent: "space-between", padding: "6px 0" }}>
                  <span>{j.provider} <span className={`badge ${STATUS_BADGE[j.status] || "badge-gray"}`}>{j.status}</span></span>
                  <span className="badge badge-gray">{j.attempts}/{j.max_attempts} attempts</span>
                </div>
              ))}
            </div>
          )}
          <div className="row" style={{ marginTop: 12 }}>
            {detail.release.status === "DRAFT" && <button className="btn" onClick={() => markReady(detail.release.id)}>Submit for Review</button>}
            {(detail.release.status === "DRAFT" || detail.release.status === "ARCHIVED") && (
              <button className="btn btn-danger" onClick={() => archive(detail.release.id)}>Archive</button>
            )}
            {detail.release.status === "APPROVED" && (
              <button className="btn" onClick={() => publish(detail.release.id, ["website"])}>Publish to Website</button>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="section-title">All Releases</h2>
        {!releases.length && <div className="empty">No releases yet.</div>}
        {releases.map(r => (
          <div key={r.id} className="list-card" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="main">
              <div className="title">{r.name}</div>
              <div className="meta">{r.slug} • v{r.version || "0.0.0"}</div>
            </div>
            <div className="row">
              <span className={`badge ${STATUS_BADGE[r.status] || "badge-gray"}`}>{r.status}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => openDetail(r.id)}>View</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}