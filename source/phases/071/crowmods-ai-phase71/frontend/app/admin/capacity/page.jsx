use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Capacity(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/capacity/operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / CAPACITY</p>
      <h1>Capacity & Recovery</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(2,1fr)",
        gap:12,marginTop:30
      }}>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Scaling Recommendations</strong>
          <h2>{data?.recommendations?.length??"—"}</h2>
        </article>

        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Recovery Verifications</strong>
          <h2>{data?.recoveries?.length??"—"}</h2>
        </article>
      </section>

      <section style={{marginTop:30}}>
        <h2>Recent Recommendations</h2>
        {data?.recommendations?.slice(0,20).map(item=>
          <article key={item.id}
            style={{padding:14,border:"1px solid #292932",
            borderRadius:12,marginTop:8}}>
            {item.consumer_group} · {item.action}
            <br/>
            {item.current_workers} → {item.desired_workers}
            <br/>
            Lag: {item.lag_value}
          </article>
        )}
      </section>
    </div>
  </main>;
}
