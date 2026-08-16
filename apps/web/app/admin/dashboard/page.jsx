"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../lib";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/dashboard").then(setData).catch(e => setError(e.message));
    api("/system/health").then(setHealth).catch(() => {});
  }, []);

  if (error) return <div className="card"><p style={{ color: "var(--red)" }}>Failed to load dashboard: {error}</p></div>;
  if (!data) {
    return (
      <div className="grid-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 96 }} />)}
      </div>
    );
  }

  const stats = [
    { label: "Total Releases", value: data.totalReleases },
    { label: "Pending Approval", value: data.pendingApproval },
    { label: "Published", value: data.published },
    { label: "Failed", value: data.failed },
    { label: "Processing", value: data.processing },
    { label: "Total Uploads", value: data.totalUploads },
    { label: "Active Customers", value: data.activeCustomers },
    { label: "Active Jobs", value: data.activeJobs }
  ];

  const healthMap = health ? Object.entries(health).map(([k, v]) => ({ k, v })) : [];

  return (
    <>
      <h1 className="page-title">Dashboard</h1>

      <div className="grid-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div className="value">{s.value ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="spread">
          <h2 className="section-title">System Health</h2>
          <Link href="/admin/health" className="btn btn-sm btn-secondary">Details</Link>
        </div>
        {!health && <div className="empty">Loading health…</div>}
        {health && (
          <div className="grid" style={{ marginTop: 8 }}>
            {healthMap.map(({ k, v }) => (
              <div key={k} className="row" style={{ justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ color: "var(--muted)", textTransform: "capitalize" }}>{k}</span>
                <span className="row">
                  <span className={`health-dot health-${v}`} />
                  <span className="badge badge-gray">{v}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="spread">
          <h2 className="section-title">Quick Actions</h2>
        </div>
        <div className="grid" style={{ marginTop: 8 }}>
          <Link href="/admin/uploads" className="btn btn-block">Upload APK</Link>
          <Link href="/admin/releases" className="btn btn-block btn-secondary">Manage Releases</Link>
          <Link href="/admin/approvals" className="btn btn-block btn-secondary">Approval Center</Link>
          <Link href="/admin/publishing" className="btn btn-block btn-secondary">Publishing</Link>
        </div>
      </div>
    </>
  );
}