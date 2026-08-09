use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase123(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/phase123-dashboard`)
      .then(r=>r.json()).then(setData);
  },[]);

  const cards=[
    ["Aborted CAS Fencing / 30d",data?.abortedCasFencing30d],
    ["Canary Rollbacks / 30d",data?.canaryRollbacks30d],
    ["Fenced Lease Renewals / 24h",data?.fencedLeaseRenewals24h],
    ["Online Calibration Coverage",data?.latestOnlineCalibration?.empirical_coverage??"—"],
    ["Active Drift Alerts",data?.activeDriftAlerts]
  ];

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:36}}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / PHASE 123</p>
      <h1>Resilient Governance Control Plane</h1>
      <section style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginTop:30}}>
        {cards.map(([label,value])=><article key={label} style={{padding:18,border:"1px solid #292932",borderRadius:12}}>
          <strong>{label}</strong><h2>{value??"—"}</h2>
        </article>)}
      </section>
      <p style={{marginTop:30,opacity:.65}}>
        Phase 123 adds compare-and-swap fencing, rollback hysteresis,
        fencing-aware lease renewal, online conformal recalibration and
        automated forecast drift alerts.
      </p>
    </div>
  </main>;
}
