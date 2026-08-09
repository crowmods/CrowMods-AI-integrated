use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function AlertCenter(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/alert-center`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / ALERT CENTER</p>
      <h1>Operational Alerts</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:12,marginTop:30
      }}>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Active Suppressions</strong>
          <h2>{data?.activeSuppressions??"—"}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Open Correlations</strong>
          <h2>{data?.openCorrelations??"—"}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Metrics</strong>
          <h2>{data?.metrics?.length??"—"}</h2>
        </article>
      </section>

      <section style={{marginTop:30}}>
        <h2>Delivery Status</h2>
        {data?.deliveries?.map(item=><article key={item.status}
          style={{padding:14,border:"1px solid #292932",
          borderRadius:12,marginTop:8}}>
          {item.status}: {item.count}
        </article>)}
      </section>
    </div>
  </main>;
}
