use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function CrossRegion(){
  const [history,setHistory]=useState([]);

  useEffect(()=>{
    fetch(`${API}/api/failover/history`)
      .then(r=>r.json())
      .then(data=>setHistory(data.history||[]));
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / CROSS-REGION</p>
      <h1>Failover Analytics</h1>

      <section style={{marginTop:30}}>
        {history.map(item=><article key={item.target_region}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{item.target_region}</strong>
          <p>Simulations: {item.simulations}</p>
          <small>
            Avg RTO: {Number(item.avg_rto_seconds||0).toFixed(2)}s
            {" · "}
            Avg RPO: {Number(item.avg_rpo_seconds||0).toFixed(2)}s
          </small>
        </article>)}
      </section>
    </div>
  </main>;
}
