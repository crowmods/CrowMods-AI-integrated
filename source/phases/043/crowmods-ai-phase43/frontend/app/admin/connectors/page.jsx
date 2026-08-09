use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Connectors(){
  const [connections,setConnections]=useState([]);
  const [jobs,setJobs]=useState([]);

  async function load(){
    const [c,j]=await Promise.all([
      fetch(`${API}/api/connectors`).then(r=>r.json()),
      fetch(`${API}/api/connectors/jobs`).then(r=>r.json())
    ]);
    setConnections(c.connections||[]);
    setJobs(j.jobs||[]);
  }

  async function health(id){
    await fetch(`${API}/api/connectors/connections/${id}/health`,{
      method:"POST"
    });
    load();
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / CONNECTORS</p>
      <h1>Official Platform Connector Hub</h1>
      <p style={{opacity:.7}}>
        Connection health, permissions and publishing jobs.
      </p>

      <section style={{marginTop:32}}>
        <h2>Connections</h2>
        {connections.map(c=><article key={c.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{c.platform}</strong> · {c.account_label}
          <p>Status: {c.status}</p>
          <p>Scopes: {(c.scopes||[]).join(", ")||"None recorded"}</p>
          <button onClick={()=>health(c.id)}
            style={{padding:"8px 14px"}}>Health Check</button>
        </article>)}
        {!connections.length&&<p>No platform connections configured.</p>}
      </section>

      <section style={{marginTop:36}}>
        <h2>Connector Jobs</h2>
        {jobs.map(j=><article key={j.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{j.platform}</strong> · {j.operation}
          <p>{j.status} · Attempts: {j.attempts}/{j.max_attempts}</p>
          {j.external_post_ref&&<small>External ref: {j.external_post_ref}</small>}
          {j.last_error&&<p>{j.last_error}</p>}
        </article>)}
        {!jobs.length&&<p>No connector jobs.</p>}
      </section>
    </div>
  </main>;
}
