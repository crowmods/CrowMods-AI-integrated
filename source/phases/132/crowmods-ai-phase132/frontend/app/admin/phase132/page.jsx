use client";
import {useEffect,useState} from "react";
const API="http://localhost:4000";
export default function Phase132(){const[d,setD]=useState(null);useEffect(()=>{fetch(`${API}/api/security/phase132-dashboard`).then(r=>r.json()).then(setD)},[]);
const c=[["Transaction Audits / 30d",d?.transactionAudits30d],["Retry Rollups",d?.retryRollups],["Held Calibrations",d?.heldCalibrations],["Signed Manifests / 30d",d?.signedManifests30d]];
return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:36}}><div style={{maxWidth:1200,margin:"0 auto"}}><p style={{opacity:.55}}>CROWMODS AI / PHASE 132</p><h1>Audit, Percentile & Calibration Control Plane</h1><section style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:30}}>{c.map(([l,v])=><article key={l} style={{padding:18,border:"1px solid #292932",borderRadius:12}}><strong>{l}</strong><h2>{v??"—"}</h2></article>)}</section></div></main>}
