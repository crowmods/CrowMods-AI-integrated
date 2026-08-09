use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Operations(){
  const [data,setData]=useState(null);
  const [ready,setReady]=useState(null);

  async function load(){
    const [o,r]=await Promise.all([
      fetch(`${API}/api/operations/overview`).then(x=>x.json()),
      fetch(`${API}/ready`).then(x=>x.json())
    ]);
    setData(o);
    setReady(r);
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / OPERATIONS</p>
      <h1>Security & Observability</h1>
      <p style={{opacity:.7}}>
        Health, incidents, metrics and operational telemetry.
      </p>

      <section style={{
        marginTop:24,padding:18,border:"1px solid #292932",
        borderRadius:12
      }}>
        <strong>Readiness: {ready?.ready?"READY":"NOT READY"}</strong>
      </section>

      <section style={{marginTop:32}}>
        <h2>Open Incidents</h2>
        {data?.openIncidents?.length
          ?data.openIncidents.map((x,i)=><article key={i}
            style={{padding:14,border:"1px solid #292932",
            borderRadius:12,marginTop:10}}>
            {x.severity} · {x.status} · {x.count}
          </article>)
          :<p>No open incidents.</p>}
      </section>

      <section style={{marginTop:32}}>
        <h2>Recent Metrics</h2>
        {data?.recentMetrics?.map((x,i)=><article key={i}
          style={{padding:14,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{x.metric_name}</strong> · {x.metric_value}
        </article>)}
      </section>
    </div>
  </main>;
}
