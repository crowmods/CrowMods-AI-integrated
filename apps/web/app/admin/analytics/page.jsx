"use client";

import { useEffect, useState } from "react";
import { api } from "../lib";

export default function AnalyticsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/analytics?days=30").then(setData).catch(() => {});
  }, []);

  if (!data) {
    return <div className="grid-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 96 }} />)}</div>;
  }

  const cards = [
    { label: "Uploads (30d)", value: data.uploads },
    { label: "Releases (30d)", value: data.releases },
    { label: "Approved", value: data.approved },
    { label: "Published", value: data.published },
    { label: "Failed Publications", value: data.failedPublications },
    { label: "Avg Job Duration", value: `${(data.avgJobDurationMs / 1000).toFixed(2)}s` }
  ];

  return (
    <>
      <h1 className="page-title">Analytics</h1>
      <div className="grid-4">
        {cards.map(c => (
          <div key={c.label} className="stat-card">
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="section-title">Publishing Provider Success Rate</h2>
        {!Object.keys(data.providerSuccessRate).length && <div className="empty">No publishing activity yet.</div>}
        {Object.entries(data.providerSuccessRate).map(([provider, stats]) => {
          const rate = stats.total ? Math.round((stats.success / stats.total) * 100) : 0;
          return (
            <div key={provider} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="spread">
                <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{provider}</span>
                <span className="badge badge-green">{rate}%</span>
              </div>
              <div className="upload-progress" style={{ marginTop: 8 }}>
                <div style={{ width: `${rate}%`, background: rate >= 50 ? "var(--green)" : "var(--yellow)" }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                {stats.success} success • {stats.failed} failed • {stats.total} total
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}