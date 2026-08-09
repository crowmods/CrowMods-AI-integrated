use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase150(){
 const [d,setD]=useState(null);

 useEffect(()=>{
  fetch(`${API}/api/security/phase150-dashboard`)
   .then(r=>r.json()).then(setD);
 },[]);

 const cards=[
  ["Approvals Expired / 30d",d?.approvalsExpired30d],
  ["Replay Windows Throttled/Escalated",
   d?.replaySlidingWindowsThrottledOrEscalated],
  ["Active Hysteresis Rollouts",
   d?.activeHysteresisRollouts],
  ["Confidence Samples / 30d",
   d?.confidenceSamples30d],
  ["Verified Attestations / 30d",
   d?.verifiedAttestations30d]
 ];

 return <main style={{
  minHeight:"100vh",
  background:"#08080b",
  color:"#fff",
  padding:36
 }}>
  <div style={{maxWidth:1200,margin:"0 auto"}}>
   <p style={{opacity:.55}}>CROWMODS AI / PHASE 150</p>
   <h1>Approval Lifecycle, Replay Windows & Evidence Attestation</h1>

   <section style={{
    display:"grid",
    gridTemplateColumns:"repeat(5,1fr)",
    gap:12,
    marginTop:30
   }}>
    {cards.map(([label,value])=>
     <article key={label} style={{
      padding:18,
      border:"1px solid #292932",
      borderRadius:12
     }}>
      <strong>{label}</strong>
      <h2>{value??"—"}</h2>
     </article>
    )}
   </section>
  </div>
 </main>;
}
