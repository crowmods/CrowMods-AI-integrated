use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Orchestrator(){
  const [workflows,setWorkflows]=useState([]);
  const [aggregateId,setAggregateId]=useState("");
  const [created,setCreated]=useState(null);

  async function load(){
    const r=await fetch(`${API}/api/workflows`);
    const d=await r.json();
    setWorkflows(d.workflows||[]);
  }

  async function start(){
    const r=await fetch(`${API}/api/workflows/start`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        workflowName:"release-pipeline",
        aggregateType:"release",
        aggregateId,
        payload:{source:"admin"}
      })
    });
    setCreated(await r.json());
    load();
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / ORCHESTRATOR</p>
      <h1>AI Operations Orchestrator</h1>
      <p style={{opacity:.7}}>
        Event-driven workflow control with approval gates.
      </p>

      <div style={{display:"flex",gap:10,maxWidth:700,marginTop:24}}>
        <input value={aggregateId} onChange={e=>setAggregateId(e.target.value)}
          placeholder="Release ID" style={{padding:12,flex:1}}/>
        <button onClick={start} style={{padding:"12px 18px"}}>
          Start Pipeline
        </button>
      </div>

      {created&&<pre style={{
        marginTop:20,padding:16,border:"1px solid #292932",
        borderRadius:12,whiteSpace:"pre-wrap"
      }}>{JSON.stringify(created,null,2)}</pre>}

      <section style={{marginTop:36}}>
        <h2>Workflow Runs</h2>
        {workflows.map(w=><article key={w.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{w.workflow_name}</strong>
          <p>{w.status} · Step: {w.current_step}</p>
          <small>{w.aggregate_type}: {w.aggregate_id}</small>
        </article>)}
      </section>
    </div>
  </main>;
}
