"use client";

import { useEffect, useState } from "react";

const API = "https://crowmods-ai-integrated.onrender.com";

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/phases`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080b12",
        color: "#fff",
        fontFamily: "system-ui",
        padding: "40px",
      }}
    >
      <h1>CrowMods AI</h1>
      <p>Unified 300-phase integration gateway.</p>

      {error && <p>API Error: {error}</p>}

      {data && (
        <>
          <h2>Phases: {data.count}</h2>

          <div style={{ display: "grid", gap: "12px" }}>
            {data.phases.map((phase) => (
              <div
                key={phase.phase}
                style={{
                  padding: "16px",
                  border: "1px solid #252b38",
                  borderRadius: "10px",
                  background: "#101521",
                }}
              >
                <strong>
                  Phase {phase.phase}: {phase.title}
                </strong>

                <div style={{ marginTop: "6px", opacity: 0.7 }}>
                  {phase.package_names?.join(", ") || "No packages listed"}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
