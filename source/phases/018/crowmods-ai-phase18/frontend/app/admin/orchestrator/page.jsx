use client";

import {useState} from "react";

const API="http://localhost:4000";

export default function Orchestrator(){
  const [releaseId,setReleaseId]=useState("");
  const [plan,setPlan]=useState(null);
  const [status,setStatus]=useState(null);
  const [message,setMessage]=useState("");

  async function preview(){
    const r=await fetch(`${API}/api/orchestrator/${releaseId}/plan`);
    const d=await r.json();
    setPlan(d.plan||null);
    setMessage(d.error||"");
  }

  async function run(){
    const r=await fetch(`${API}/api/orchestrator/${releaseId}/run`,{method:"POST"});
    const d=await r.json();
    setMessage(d.error||d.message);
    if(!d.error) await refresh();
  }

  async function refresh(){
    const r=await fetch(`${API}/api/orchestrator/${releaseId}/status`);
    const d=await r.json();
    setStatus(d.jobs||[]);
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>Crow AI — Orchestrator</h1>
    <p>Policy-driven workflow coordinator. High-impact actions remain approval-gated.</p>

    <div style={{display:"flex",gap:10,marginTop:24}}>
      <input placeholder="Release UUID" value={releaseId}
        onChange={e=>setReleaseId(e.target.value)} style={{padding:12,width:380}}/>
      <button onClick={preview} disabled={!releaseId} style={{padding:"12px 18px"}}>Preview</button>
      <button onClick={run} disabled={!releaseId} style={{padding:"12px 18px"}}>Run Safe Plan</button>
      <button onClick={refresh} disabled={!releaseId} style={{padding:"12px 18px"}}>Refresh</button>
    </div>

    {plan&&<section style={{marginTop:28,border:"1px solid #292932",borderRadius:16,padding:20}}>
      <h2>Workflow Plan</h2>
      <p>Status: {plan.status}</p>
      <p>Human approval required: {String(plan.requiresHumanApproval)}</p>
      {plan.jobs.map((j,i)=><p key={i}>→ {j.jobType}</p>)}
    </section>}

    {status&&<section style={{marginTop:20}}>
      <h2>Jobs</h2>
      {status.map((j,i)=><article key={i} style={{marginTop:10,padding:14,border:"1px solid #292932",borderRadius:12}}>
        <strong>{j.job_type}</strong> — {j.status}
        <div>Attempts: {j.attempts}</div>
        {j.last_error&&<div>Error: {j.last_error}</div>}
      </article>)}
    </section>}

    {message&&<p style={{marginTop:20}}>{message}</p>}
  </main>;
}
