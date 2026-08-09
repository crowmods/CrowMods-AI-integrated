use client";
import {useEffect,useState} from "react";
const API="http://localhost:4000";
export default function Phase131(){const [d,setD]=useState(null);useEffect(()=>{fetch(`${API}/api/security/phase131-dashboard`).then(r=>r.json()).then(setD)},[]);
const cards=[["Successful Failovers",d?.successfulFailovers],["Renewals / 24h",d?.renewals24h],["Retry Samples / 24h",d?.retryLatencySamples24h],["Immutable Exports / 30d",d?.immutableExports30d]];
return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:36}}><div style={{maxWidth:1200,margin:"0 auto"}}><p style={{opacity:.55}}>CROWMODS AI / PHASE 131</p><h1>Database-Enforced Reliability Control Plane</h1><section style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:30}}>{cards.map(([l,v])=><article key={l} style={{padding:18,border:"1px solid #292932",borderRadius:12}}><strong>{l}</strong><h2>{v??"—"}</h2></article>)}</section><p style={{marginTop:30,opacity:.65}}>Phase 131 adds database CAS enforcement, retry latency histograms, calibration hysteresis, and immutable alert-review export hashes.</p></div></main>}
