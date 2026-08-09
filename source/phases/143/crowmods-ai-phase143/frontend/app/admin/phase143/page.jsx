use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase143(){
 const [d,setD]=useState(null);

 useEffect(()=>{
  fetch(`${API}/api/security/phase143-dashboard`)
   .then(r=>r.json()).then(setD);
 },[]);

 const cards=[
  ["Purge Mismatches / 30d",d?.purgeMismatches30d],
  ["Missed Recovery SLOs / 30d",
   d?.missedRecoverySLOs30d],
  ["Unresolved Replay Conflicts",
   d?.unresolvedReplayConflicts],
  ["Replay Cache Removed / 30d",
   d?.replayCacheEntriesRemoved30d]
 ];

 return <main style={{
  minHeight:"100vh",
  background:"#08080b",
  color:"#fff",
  padding:36
 }}>
  <div style={{maxWidth:1200,margin:"0 auto"}}>
   <p style={{opacity:.55}}>CROWMODS AI / PHASE 143</p>
   <h1>Reconciliation, Recovery SLO & Conflict Control Plane</h1>

   <section style={{
    display:"grid",
    gridTemplateColumns:"repeat(4,1fr)",
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
