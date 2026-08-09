use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase147(){
 const [d,setD]=useState(null);

 useEffect(()=>{
  fetch(`${API}/api/security/phase147-dashboard`)
   .then(r=>r.json()).then(setD);
 },[]);

 const cards=[
  ["Repair Redrives / 30d",d?.redrives30d],
  ["Critical Burn Rates / 24h",
   d?.criticalBurnRates24h],
  ["Lease Conflict Spikes / 30d",
   d?.leaseConflictSpikes30d],
  ["Evidence Chain Entries / 30d",
   d?.evidenceChainEntries30d]
 ];

 return <main style={{
  minHeight:"100vh",
  background:"#08080b",
  color:"#fff",
  padding:36
 }}>
  <div style={{maxWidth:1200,margin:"0 auto"}}>
   <p style={{opacity:.55}}>CROWMODS AI / PHASE 147</p>
   <h1>Redrive, Burn Severity & Evidence Chain Control Plane</h1>

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
