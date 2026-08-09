use client";

import {useState} from "react";

const API="http://localhost:4000";

export default function Intake(){
  const [name,setName]=useState("");
  const [size,setSize]=useState("");
  const [type,setType]=useState("application/vnd.android.package-archive");
  const [result,setResult]=useState(null);

  async function create(){
    const r=await fetch(`${API}/api/intake/create`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        originalName:name,
        contentType:type,
        sizeBytes:Number(size)
      })
    });
    setResult(await r.json());
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods AI — APK Intake</h1>
    <p>Files enter quarantine first. The web server never executes uploaded APKs.</p>

    <div style={{display:"grid",gap:12,maxWidth:560,marginTop:24}}>
      <input placeholder="APK filename" value={name}
        onChange={e=>setName(e.target.value)} style={{padding:12}}/>
      <input type="number" placeholder="Size in bytes" value={size}
        onChange={e=>setSize(e.target.value)} style={{padding:12}}/>
      <input value={type} onChange={e=>setType(e.target.value)}
        style={{padding:12}}/>
      <button onClick={create} style={{padding:"12px 18px"}}>Create Quarantine Intake</button>
    </div>

    {result&&<pre style={{marginTop:24,padding:18,border:"1px solid #292932",borderRadius:14,whiteSpace:"pre-wrap"}}>
      {JSON.stringify(result,null,2)}
    </pre>}
  </main>;
}
