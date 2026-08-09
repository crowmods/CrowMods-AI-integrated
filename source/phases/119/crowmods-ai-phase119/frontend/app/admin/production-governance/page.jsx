use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function ProductionGovernance(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/production-governance-dashboard`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  const calibration=data?.latestCalibration;

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>
        CROWMODS AI / PHASE 119
      </p>

      <h1>Production Governance</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(5,1fr)",
        gap:12,
        marginTop:30
      }}>
        {[
          ["Blocked Downstream Fencing / 30d",
           data?.blockedDownstreamFencing30d],
          ["Canary Rollbacks / 30d",
           data?.canaryRollbacks30d],
          ["Delegation Runs / 24h",
           data?.delegationWorkerRuns24h],
          ["Forecast Confidence",
           calibration?.calibrated_confidence??"—"],
          ["KMS Signatures / 30d",
           data?.kmsSignatures30d]
        ].map(([label,value])=><article key={label}
          style={{
            padding:18,
            border:"1px solid #292932",
            borderRadius:12
          }}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <p style={{marginTop:30,opacity:.65}}>
        Phase 119 extends runtime fencing downstream, automates canary
        rollback decisions, evaluates delegation expiry, calibrates forecast
        confidence, and establishes the production KMS signing boundary.
      </p>
    </div>
  </main>;
}
