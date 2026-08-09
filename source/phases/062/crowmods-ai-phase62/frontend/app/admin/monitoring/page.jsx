use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Monitoring(){
  const [data,setData]=useState(null);

  async function load(){
    const r=await fetch(`${API}/api/monitoring/summary`);
    setData(await r.json());
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / MONITORING</p>
      <h1>Live SLO Monitoring</h1>

      <section style={{marginTop:30}}>
        <h2>Active Alerts</h2>
        {data?.alerts?.length
          ?data.alerts.map(alert=><article key={alert.id}
            style={{padding:16,border:"1px solid #292932",
            borderRadius:12,marginTop:10}}>
            <strong>{alert.severity}</strong>
            <p>{alert.alert_name}</p>
            <small>{alert.condition}</small>
          </article>)
          :<p>No active alerts.</p>}
      </section>

      <section style={{marginTop:30}}>
        <h2>Recent Telemetry</h2>
        {data?.metrics?.map((m,i)=><article key={i}
          style={{padding:14,border:"1px solid #292932",
          borderRadius:12,marginTop:8}}>
          <strong>{m.metric_name}</strong> · {m.metric_value}
        </article>)}
      </section>
    </div>
  </main>;
}
