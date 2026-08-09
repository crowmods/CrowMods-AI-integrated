use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function ReleaseValidation(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/security/release-validation`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  const summary=data?.summary;

  return <main style={{
    minHeight:"100vh",
    background:"#08080b",
    color:"#fff",
    padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>
        CROWMODS AI / PHASE 100
      </p>

      <h1>Final Release Validation</h1>

      <section style={{
        marginTop:30,
        padding:24,
        border:"1px solid #292932",
        borderRadius:12
      }}>
        <p>Release</p>
        <h2>{data?.release??"—"}</h2>
        <p>Status</p>
        <h2>{summary?.status??"—"}</h2>
        <p>
          Passed: {summary?.passed??"—"} ·
          Failed: {summary?.failed??"—"} ·
          Blocked: {summary?.blocked??"—"}
        </p>
      </section>

      <section style={{marginTop:30}}>
        <h2>Control validation</h2>

        {(data?.checks||[]).map(check=>
          <div key={check.name} style={{
            display:"flex",
            justifyContent:"space-between",
            padding:"10px 0",
            borderBottom:"1px solid #1e1e25"
          }}>
            <span>{check.name}</span>
            <strong>{check.status}</strong>
          </div>
        )}
      </section>
    </div>
  </main>;
}
