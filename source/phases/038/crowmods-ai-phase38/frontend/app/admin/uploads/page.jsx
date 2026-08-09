use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Uploads(){
  const [uploads,setUploads]=useState([]);

  async function load(){
    const r=await fetch(`${API}/api/uploads`);
    const d=await r.json();
    setUploads(d.uploads||[]);
  }

  async function approve(id,approved){
    await fetch(`${API}/api/uploads/${id}/approve`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({approved})
    });
    load();
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / UPLOADS</p>
      <h1>Secure Upload Pipeline</h1>
      <p style={{opacity:.7}}>
        Quarantine → scan → approval → release storage.
      </p>

      {uploads.map(x=><article key={x.id}
        style={{padding:18,border:"1px solid #292932",
        borderRadius:12,marginTop:12}}>
        <strong>{x.original_name}</strong>
        <p>
          Scan: {x.scan_status} · Approval: {x.approval_status}
        </p>
        <small>
          SHA-256: {x.sha256}
        </small>

        {x.scan_status==="CLEAN"&&x.approval_status==="PENDING"&&
          <div style={{marginTop:14,display:"flex",gap:8}}>
            <button onClick={()=>approve(x.id,true)}
              style={{padding:"8px 14px"}}>Approve</button>
            <button onClick={()=>approve(x.id,false)}
              style={{padding:"8px 14px"}}>Reject</button>
          </div>
        )}
      </article>)}

      {!uploads.length&&<p>No uploads registered.</p>}
    </div>
  </main>;
}
