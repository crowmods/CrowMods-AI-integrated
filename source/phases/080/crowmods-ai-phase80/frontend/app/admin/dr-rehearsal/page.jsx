use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function DRRehearsal(){
  const [rehearsals,setRehearsals]=useState([]);

  useEffect(()=>{
    fetch(`${API}/api/dr/rehearsals`)
      .then(r=>r.json())
      .then(data=>setRehearsals(data.rehearsals||[]));
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / DISASTER RECOVERY</p>
      <h1>DR Rehearsals</h1>

      <section style={{marginTop:30}}>
        {rehearsals.map(item=><article key={item.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{item.rehearsal_name}</strong>
          <p>
            {item.source_region} → {item.target_region}
          </p>
          <p>Status: {item.status}</p>
          <small>
            RTO: {item.rto_seconds ?? "—"}s
            {" · "}
            RPO: {item.rpo_seconds ?? "—"}s
          </small>
        </article>)}
      </section>
    </div>
  </main>;
}
