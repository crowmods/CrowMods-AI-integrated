"use client";

import { useEffect, useState } from "react";

const API = "https://crowmods-ai-integrated.onrender.com";

export default function Home() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/integration/status`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setStatus)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#080b12",
        color: "#fff",
        fontFamily: "system-ui",
        padding: "48px",
      }}
    >
      <h1>CrowMods AI</h1>
      <p>Unified 300-phase integration gateway.</p>

      {error && <p style={{ color: "#ff6b6b" }}>API Error: {error}</p>}

      {status && (
        <section style={{ marginTop: 30 }}>
          <h2>Integration Status</h2>
          <p>Total phases: {status.totalPhases}</p>
          <p>Loaded: {status.loaded}</p>
          <p>Failed: {status.failed}</p>
        </section>
      )}
    </main>
  );
}
