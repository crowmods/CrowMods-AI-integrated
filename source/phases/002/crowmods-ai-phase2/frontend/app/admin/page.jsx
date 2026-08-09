use client";

import { useState } from "react";

export default function Admin() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload() {
    if (!file) return setMessage("Select an APK first.");
    setLoading(true);
    setMessage("");

    const form = new FormData();
    form.append("apk", file);

    try {
      const response = await fetch("http://localhost:4000/api/uploads/apk", {
        method: "POST",
        body: form
      });
      const data = await response.json();
      setMessage(data.error || `Uploaded: ${data.release?.sha256}`);
    } catch {
      setMessage("Backend is not reachable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{minHeight:"100vh", background:"#08080b", color:"#fff", padding:40}}>
      <h1>CrowMods AI — Secure Upload</h1>
      <p>Files enter quarantine and remain pending until approval.</p>

      <div style={{marginTop:30, padding:24, border:"1px solid #292932", borderRadius:16}}>
        <input type="file" accept=".apk,application/vnd.android.package-archive" onChange={e => setFile(e.target.files?.[0] || null)} />
        <br />
        <button onClick={upload} disabled={loading} style={{marginTop:20, padding:"12px 18px"}}>
          {loading ? "Processing..." : "Upload to Quarantine"}
        </button>
        {message && <pre style={{marginTop:20, whiteSpace:"pre-wrap"}}>{message}</pre>}
      </div>
    </main>
  );
}
