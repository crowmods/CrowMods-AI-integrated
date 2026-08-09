"use client";

import { useEffect, useState } from "react";

const API = "https://crowmods-ai-integrated.onrender.com";

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState({});

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

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <div style={{
              padding: "12px 18px",
              background: "#101521",
              borderRadius: "8px",
            }}>
              Total: {data.count}
            </div>

            <div style={{
              padding: "12px 18px",
              background: "#101521",
              borderRadius: "8px",
            }}>
              Loaded: {Object.keys(health).length}
            </div>

            <div style={{
              padding: "12px 18px",
              background: "#101521",
              borderRadius: "8px",
            }}>
              Failed: {Object.values(health).filter((x) => !x.ok).length}
            </div>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phases..."
            style={{
              width: "100%",
              maxWidth: "600px",
              padding: "12px",
              marginBottom: "20px",
              borderRadius: "8px",
              border: "1px solid #252b38",
              background: "#101521",
              color: "#fff",
            }}
          />

          <div style={{ display: "grid", gap: "12px" }}>
            {data.phases
              .filter((phase) =>
                `${phase.phase} ${phase.title} ${phase.package_names?.join(" ")}`
                  .toLowerCase()
                  .includes(query.toLowerCase())
              )
              .map((phase) => (
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

                <button
                  onClick={async () => {
                    const res = await fetch(
                      `${API}/api/phases/${phase.phase}/health`
                    );
                    const result = await res.json();
                    setHealth((prev) => ({
                      ...prev,
                      [phase.phase]: {
                        ok: res.ok,
                        result,
                      },
                    }));
                  }}
                  style={{
                    marginTop: "10px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "0",
                    cursor: "pointer",
                  }}
                >
                  Check Health
                </button>

                {health[phase.phase] && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>
                      {health[phase.phase].ok ? "✓ Healthy" : "✗ Failed"}
                    </strong>

                    <pre
                      style={{
                        marginTop: "8px",
                        padding: "10px",
                        background: "#080b12",
                        borderRadius: "6px",
                        overflowX: "auto",
                      }}
                    >
                      {JSON.stringify(
                        health[phase.phase].result,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
