use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Monitoring(){
  const [alerts,setAlerts]=useState([]);
  const [incidents,setIncidents]=useState([]);

  async function load(){
    const [a,i]=await Promise.all([
      fetch(`${API}/api/monitoring/alerts`).then(r=>r.json()),
      fetch(`${API}/api/monitoring/incidents`).then(r=>r.json())
    ]);
    setAlerts(a.alerts||[]);
    setIncidents(i.incidents||[]);
  }

  async function resolve(id){
    await fetch(`${API}/api/monitoring/incidents/${id}/resolve`,{
      method:"POST"
    });
    load();
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / MONITORING</p>
      <h1>Monitoring & Incident Response</h1>
      <p style={{opacity:.7}}>
        Health, alerts and authorized incident handling.
      </p>

      <section style={{marginTop:32}}>
        <h2>Open Incidents</h2>
        {incidents.map(x=><article key={x.id}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{x.severity}</strong> — {x.title}
          <p>{x.summary}</p>
          <button onClick={()=>resolve(x.id)}
            style={{padding:"8px 14px"}}>Mark Resolved</button>
        </article>)}
        {!incidents.length&&<p>No open incidents.</p>}
      </section>

      <section style={{marginTop:36}}>
        <h2>Alerts</h2>
        {alerts.map(x=><article key={x.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{x.severity}</strong> — {x.alert_type}
          <p>{x.service_name||"system"} · {x.message}</p>
        </article>)}
        {!alerts.length&&<p>No open alerts.</p>}
      </section>
    </div>
  </main>;
}
