"use client";

import { useEffect, useState } from "react";
import { api, timeAgo } from "../lib";

const STATUS_BADGE = {
  QUEUED: "badge-blue", PROCESSING: "badge-yellow", SUCCESS: "badge-green",
  FAILED: "badge-red", CANCELLED: "badge-gray"
};

export default function PublishingPage() {
  const [jobs, setJobs] = useState([]);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState("");

  const load = () => api("/publishing/jobs").then(r => setJobs(r.jobs)).catch(() => {});

  useEffect(() => { load(); }, []);

  const open = async (id) => {
    const d = await api(`/publishing/${id}`);
    setDetail(d);
  };

  const retry = async (id) => {
    try {
      await api(`/publishing/${id}/retry`, { method: "POST" });
      setToast("Job queued for retry.");
      setDetail(null);
      load();
    } catch (err) {
      setToast(err.message);
    }
  };

  return (
    <>
      <h1 className="page-title">Publishing</h1>

      {toast && <div className="toast success">{toast}</div>}

      {detail && (
        <div className="card">
          <div className="spread">
            <h2 className="section-title">{detail.job.provider} job</h2>
            <button className="btn btn-sm btn-secondary" onClick={() => setDetail(null)}>Close</button>
          </div>
          <div className="row">
            <span className={`badge ${STATUS_BADGE[detail.job.status] || "badge-gray"}`}>{detail.job.status}</span>
            <span className="badge badge-gray">{detail.job.attempts}/{detail.job.max_attempts} attempts</span>
          </div>
          {detail.job.error && <p style={{ color: "var(--red)" }}>{detail.job.error}</p>}
          {detail.job.result?.externalId && (
            <div className="stat-card" style={{ marginTop: 8 }}>
              <div className="label">External ID</div>
              <div>{detail.job.result.externalId}</div>
            </div>
          )}
          {detail.results?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <h3 style={{ fontSize: 14, marginBottom: 6 }}>Results</h3>
              {detail.results.map(r => (
                <div key={r.id} className="row" style={{ justifyContent: "space-between", padding: "6px 0" }}>
                  <span className={`badge ${STATUS_BADGE[r.status] || "badge-gray"}`}>{r.status}</span>
                  <span className="badge badge-gray">{timeAgo(r.created_at)}</span>
                </div>
              ))}
            </div>
          )}
          {(detail.job.status === "FAILED" || detail.job.status === "CANCELLED") && (
            <button className="btn btn-block" style={{ marginTop: 12 }} onClick={() => retry(detail.job.id)}>Retry</button>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="section-title">Publishing Jobs</h2>
        {!jobs.length && <div className="empty">No publishing jobs yet.</div>}
        {jobs.map(j => (
          <div key={j.id} className="list-card" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="main">
              <div className="title" style={{ textTransform: "capitalize" }}>{j.provider}</div>
              <div className="meta">{timeAgo(j.created_at)} • {j.attempts}/{j.max_attempts} attempts</div>
            </div>
            <div className="row">
              <span className={`badge ${STATUS_BADGE[j.status] || "badge-gray"}`}>{j.status}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => open(j.id)}>View</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}