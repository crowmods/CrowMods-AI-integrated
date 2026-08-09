use client";

import { useEffect, useState } from "react";

const API = "http://localhost:4000";

export default function Approvals() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    const r = await fetch(`${API}/api/releases/pending`);
    const data = await r.json();
    setItems(data.releases || []);
    setSelected(current => current || data.releases?.[0] || null);
  }

  useEffect(() => { load(); }, []);

  async function action(type) {
    if (!selected) return;
    const endpoint = type === "approve"
      ? `${API}/api/releases/${selected.id}/approve`
      : `${API}/api/releases/${selected.id}/reject`;

    const options = {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(type === "reject" ? {reason: "Rejected during review"} : {})
    };

    const r = await fetch(endpoint, options);
    const data = await r.json();
    setMessage(data.error || data.message);
    setSelected(null);
    await load();
  }

  return (
    <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:32}}>
      <h1>CrowMods AI — Approval Center</h1>
      <p>Every release stays pending until you explicitly approve it.</p>

      <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:24,marginTop:28}}>
        <aside style={{border:"1px solid #292932",borderRadius:16,padding:16}}>
          <h3>Pending ({items.length})</h3>
          {items.map(item => (
            <button key={item.id} onClick={() => setSelected(item)}
              style={{display:"block",width:"100%",textAlign:"left",marginTop:10,padding:12}}>
              {item.aiBrief?.title || item.originalName}
            </button>
          ))}
        </aside>

        <section style={{border:"1px solid #292932",borderRadius:16,padding:24}}>
          {!selected ? <p>No pending releases.</p> : (
            <>
              <h2>{selected.aiBrief?.title || selected.originalName}</h2>
              <p>Status: <strong>{selected.status}</strong></p>
              <p>SHA-256: <code>{selected.sha256}</code></p>
              <p>{selected.aiBrief?.description}</p>
              <p>Category: {selected.aiBrief?.suggestedCategory}</p>
              <p>Tags: {(selected.aiBrief?.tags || []).join(", ")}</p>

              <div style={{marginTop:24,display:"flex",gap:12}}>
                <button onClick={() => action("approve")} style={{padding:"12px 18px"}}>
                  ✓ Approve
                </button>
                <button onClick={() => action("reject")} style={{padding:"12px 18px"}}>
                  Reject
                </button>
              </div>
            </>
          )}
          {message && <p style={{marginTop:20}}>{message}</p>}
        </section>
      </div>
    </main>
  );
}
