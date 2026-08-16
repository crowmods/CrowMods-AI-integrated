"use client";

import { useEffect, useState } from "react";
import { api, timeAgo } from "../lib";

const RESULT_BADGE = { SUCCESS: "badge-green", FAILURE: "badge-red" };

export default function AuditPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api("/audit-logs?limit=100").then(r => setLogs(r.logs)).catch(() => {});
  }, []);

  return (
    <>
      <h1 className="page-title">Audit Logs</h1>
      <div className="card">
        {!logs.length && <div className="empty">No audit events yet.</div>}
        {logs.map(l => (
          <div key={l.id} className="list-card" style={{ borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
            <div className="main">
              <div className="title">{l.action}</div>
              <div className="meta">
                {l.actor_email || l.actor_id || "system"} • {l.resource ? `${l.resource}${l.resource_id ? ":" + l.resource_id.slice(0, 8) : ""}` : "—"} • {timeAgo(l.created_at)}
              </div>
            </div>
            <span className={`badge ${RESULT_BADGE[l.result] || "badge-gray"}`}>{l.result}</span>
          </div>
        ))}
      </div>
    </>
  );
}