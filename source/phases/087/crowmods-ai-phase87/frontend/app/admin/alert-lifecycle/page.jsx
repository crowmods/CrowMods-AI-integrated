use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function AlertLifecycle(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/operations/alert-lifecycle`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / ALERT LIFECYCLE</p>
      <h1>Incident & Alert Operations</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Incident States</strong>
          <h2>{data?.incidents?.length??"—"}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Delivery States</strong>
          <h2>{data?.deliveries?.length??"—"}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Lifecycle Events</strong>
          <h2>{data?.lifecycle?.length??"—"}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Exported Metrics</strong>
          <h2>{data?.exportedMetrics??"—"}</h2>
        </article>
      </section>

      <p style={{marginTop:30,opacity:.65}}>
        Acknowledgement, resolution, retry workers, DLQ replay,
        incident correlation, and telemetry export.
      </p>
    </div>
  </main>;
}
