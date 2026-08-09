use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Recovery(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/recovery/observability`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / RECOVERY</p>
      <h1>Recovery Operations</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        <article style={{padding:16,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Healthy Workers</strong>
          <h2>{data?.healthyWorkers??"—"}</h2>
        </article>

        <article style={{padding:16,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Open Lag Alerts</strong>
          <h2>{data?.openLagAlerts??"—"}</h2>
        </article>

        <article style={{padding:16,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>DLQ States</strong>
          <h2>{data?.dlqJobs?.length??"—"}</h2>
        </article>

        <article style={{padding:16,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Rebalances / 1h</strong>
          <h2>{data?.recentRebalances??"—"}</h2>
        </article>
      </section>
    </div>
  </main>;
}
