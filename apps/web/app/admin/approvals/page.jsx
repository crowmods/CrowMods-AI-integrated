"use client";

import { useEffect, useState } from "react";
import { api, timeAgo } from "../lib";

const STATUS_BADGE = {
  READY_FOR_REVIEW: "badge-blue", APPROVED: "badge-green", REJECTED: "badge-red",
  DRAFT: "badge-gray", PUBLISHED: "badge-green", PUBLISHING: "badge-yellow", FAILED: "badge-red", ARCHIVED: "badge-gray"
};

export default function ApprovalsPage() {
  const [releases, setReleases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [action, setAction] = useState("");
  const [providers, setProviders] = useState(["website"]);
  const [toast, setToast] = useState("");

  const load = () => api("/releases?status=READY_FOR_REVIEW").then(r => setReleases(r.releases)).catch(() => {});

  useEffect(() => { load(); }, []);

  const open = async (id) => {
    const d = await api(`/releases/${id}`);
    setSelected(d);
    setReason("");
    setAction("");
  };

  const run = async () => {
    if (!selected) return;
    setToast("");
    try {
      if (action === "approve") {
        await api(`/releases/${selected.release.id}/approve`, { method: "POST", body: { reason } });
        setToast("Approved");
      } else if (action === "reject") {
        if (!reason.trim()) return setToast("A reason is required.");
        await api(`/releases/${selected.release.id}/reject`, { method: "POST", body: { reason } });
        setToast("Rejected");
      } else if (action === "changes") {
        if (!reason.trim()) return setToast("A reason is required.");
        await api(`/releases/${selected.release.id}/request-changes`, { method: "POST", body: { reason } });
        setToast("Changes requested");
      } else if (action === "publish") {
        await api(`/releases/${selected.release.id}/publish`, { method: "POST", body: { providers } });
        setToast("Publishing jobs started");
      }
      setSelected(null);
      load();
    } catch (err) {
      setToast(err.message);
    }
  };

  return (
    <>
      <h1 className="page-title">Approval Center</h1>

      {toast && <div className="toast success">{toast}</div>}

      {selected && (
        <div className="card">
          <div className="spread">
            <h2 className="section-title">Review — {selected.release.name}</h2>
            <button className="btn btn-sm btn-secondary" onClick={() => setSelected(null)}>Close</button>
          </div>
          <p style={{ color: "var(--muted)" }}>{selected.release.slug} • v{selected.release.version || "0.0.0"} • {selected.release.package_name || "no package"}</p>
          <span className={`badge ${STATUS_BADGE[selected.release.status] || "badge-gray"}`}>{selected.release.status}</span>
          {selected.release.description && <p style={{ color: "#d5dcea" }}>{selected.release.description}</p>}

          {selected.upload && (
            <div className="stat-card" style={{ marginTop: 8 }}>
              <div className="label">File</div>
              <div style={{ fontSize: 14 }}>{selected.upload.original_filename}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", wordBreak: "break-all" }}>SHA-256: {selected.upload.sha256 || "—"}</div>
            </div>
          )}

          {selected.scans?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <h3 style={{ fontSize: 14, marginBottom: 6 }}>Security Scan Results</h3>
              {selected.scans.map(s => (
                <div key={s.id} className="row" style={{ justifyContent: "space-between", padding: "6px 0" }}>
                  <span className="badge badge-gray">{s.scanner} {s.version}</span>
                  <span className={`badge ${s.status === "CLEAN" ? "badge-green" : "badge-yellow"}`}>{s.status}</span>
                </div>
              ))}
            </div>
          )}

          {selected.versions?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <h3 style={{ fontSize: 14, marginBottom: 6 }}>Version History</h3>
              {selected.versions.map(v => (
                <div key={v.id} className="row" style={{ justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>v{v.version}</span><span className="badge badge-gray">{timeAgo(v.created_at)}</span>
                </div>
              ))}
            </div>
          )}

          <label className="field" style={{ marginTop: 12 }}>
            <span>Reason (required for reject / request changes)</span>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this action being taken?" />
          </label>

          <div className="row">
            <button className="btn btn-success" onClick={() => { setAction("approve"); run(); }}>Approve</button>
            <button className="btn btn-danger" onClick={() => { setAction("reject"); run(); }}>Reject</button>
            <button className="btn btn-secondary" onClick={() => { setAction("changes"); run(); }}>Request Changes</button>
          </div>

          <div className="card" style={{ marginTop: 12, background: "var(--panel2)" }}>
            <h3 style={{ fontSize: 14, marginBottom: 8 }}>Publishing Targets</h3>
            <div className="row">
              {["website", "telegram", "discord"].map(p => (
                <label key={p} className="row" style={{ gap: 6, padding: "6px 0" }}>
                  <input type="checkbox" checked={providers.includes(p)} onChange={e => {
                    setProviders(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p));
                  }} style={{ width: "auto", minHeight: "auto" }} />
                  <span style={{ textTransform: "capitalize" }}>{p}</span>
                </label>
              ))}
            </div>
            <button className="btn btn-block" style={{ marginTop: 8 }} onClick={() => { setAction("publish"); run(); }}>
              Publish
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="section-title">Pending Review</h2>
        {!releases.length && <div className="empty">No releases awaiting approval.</div>}
        {releases.map(r => (
          <div key={r.id} className="list-card" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="main">
              <div className="title">{r.name}</div>
              <div className="meta">v{r.version || "0.0.0"} • {timeAgo(r.updated_at)}</div>
            </div>
            <button className="btn btn-sm" onClick={() => open(r.id)}>Review</button>
          </div>
        ))}
      </div>
    </>
  );
}