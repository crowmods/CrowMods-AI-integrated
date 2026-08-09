use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Security(){
  const [controls,setControls]=useState([]);
  const [events,setEvents]=useState([]);
  const [checklist,setChecklist]=useState([]);

  async function load(){
    const [c,e,k]=await Promise.all([
      fetch(`${API}/api/security/controls`).then(r=>r.json()),
      fetch(`${API}/api/security/events?limit=50`).then(r=>r.json()),
      fetch(`${API}/api/security/checklist`).then(r=>r.json())
    ]);
    setControls(c.controls||[]);
    setEvents(e.events||[]);
    setChecklist(k.checklist||[]);
  }

  useEffect(()=>{load()},[]);

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:36}}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / SECURITY</p>
      <h1>Security & Hardening Center</h1>
      <p style={{opacity:.7}}>
        Defensive controls, security events and production-readiness checks.
      </p>

      <section style={{marginTop:32}}>
        <h2>Emergency Controls</h2>
        <div style={{display:"grid",gap:10}}>
          {controls.map(c=><article key={c.control_name}
            style={{padding:16,border:"1px solid #292932",borderRadius:12}}>
            <strong>{c.control_name}</strong>
            <p>Status: {c.enabled?"ENABLED":"DISABLED"}</p>
            <small>{c.reason||"No reason recorded."}</small>
          </article>)}
        </div>
      </section>

      <section style={{marginTop:36}}>
        <h2>Security Checklist</h2>
        {checklist.map(x=><article key={x.id}
          style={{padding:14,border:"1px solid #292932",borderRadius:10,marginTop:8}}>
          <strong>{x.control_name}</strong> — {x.status}
        </article>)}
        {!checklist.length&&<p>No checklist items have been seeded yet.</p>}
      </section>

      <section style={{marginTop:36}}>
        <h2>Recent Security Events</h2>
        {events.map(x=><article key={x.id}
          style={{padding:14,border:"1px solid #292932",borderRadius:10,marginTop:8}}>
          <strong>{x.severity}</strong> — {x.event_type}
          <p style={{opacity:.7}}>{x.service} · {new Date(x.created_at).toLocaleString()}</p>
        </article>)}
      </section>
    </div>
  </main>;
}
