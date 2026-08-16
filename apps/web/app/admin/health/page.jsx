"use client";

import { useEffect, useState } from "react";
import { api } from "../lib";

export default function HealthPage() {
  const [health, setHealth] = useState(null);

  const load = () => api("/system/health").then(setHealth).catch(() => {});

  useEffect(() => { load(); }, []);

  if (!health) return <div className="card"><div className="empty">Loading system health…</div></div>;

  return (
    <>
      <div className="spread">
        <h1 className="page-title">System Health</h1>
        <button className="btn btn-secondary" onClick={load}>Refresh</button>
      </div>
      <div className="card">
        {Object.entries(health).map(([k, v]) => (
          <div key={k} className="row" style={{ justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{k}</span>
            <span className="row">
              <span className={`health-dot health-${v}`} />
              <span className={`badge ${v === "HEALTHY" ? "badge-green" : v === "DOWN" ? "badge-red" : v === "DEGRADED" ? "badge-yellow" : "badge-gray"}`}>{v}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}