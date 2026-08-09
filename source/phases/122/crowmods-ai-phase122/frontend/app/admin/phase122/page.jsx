use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase122(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/phase122-dashboard`)
      .then(r=>r.json()).then(setData);
  },[]);

  const cards=[
    ["Aborted Fencing / 30d",data?.abortedFencingTransactions30d],
    ["Canary Rollbacks / 30d",data?.canaryRollbacks30d],
    ["Lease Renewals / 24h",data?.leaseRenewals24h],
    ["Conformal Coverage",data?.latestConformalCalibration?.empirical_coverage??"—"],
    ["KMS Operations / 30d",data?.successfulKmsOperations30d]
  ];

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:36}}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / PHASE 122</p>
      <h1>Adaptive Assurance Control Plane</h1>
      <section style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginTop:30}}>
        {cards.map(([label,value])=><article key={label} style={{padding:18,border:"1px solid #292932",borderRadius:12}}>
          <strong>{label}</strong><h2>{value??"—"}</h2>
        </article>)}
      </section>
      <p style={{marginTop:30,opacity:.65}}>
        Phase 122 adds serializable fencing, adaptive canary sizing, lease heartbeats,
        conformal calibration and forecast drift monitoring, plus isolated cloud KMS integrations.
      </p>
    </div>
  </main>;
}
