use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Phase139(){
 const [d,setD]=useState(null);

 useEffect(()=>{
  fetch(`${API}/api/security/phase139-dashboard`)
   .then(r=>r.json()).then(setD);
 },[]);

 const cards=[
  ["Enabled Purge Rules",d?.enabledPurgeRules],
  ["Active Recovery Cooldowns",
   d?.activeRecoveryCooldowns],
  ["Calibration Bindings / 30d",
   d?.calibrationBindings30d],
  ["Idempotent Manifest Verifications / 30d",
   d?.idempotentManifestVerifications30d]
 ];

 return <main style={{
  minHeight:"100vh",
  background:"#08080b",
  color:"#fff",
  padding:36
 }}>
  <div style={{maxWidth:1200,margin:"0 auto"}}>
   <p style={{opacity:.55}}>CROWMODS AI / PHASE 139</p>
   <h1>Locking, Recovery & Verification Idempotency</h1>

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
