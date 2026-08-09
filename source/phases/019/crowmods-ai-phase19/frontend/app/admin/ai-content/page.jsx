use client";

import {useState} from "react";

const API="http://localhost:4000";

export default function AIContent(){
  const [releaseId,setReleaseId]=useState("");
  const [metadata,setMetadata]=useState(JSON.stringify({
    originalName:"Example.apk",
    appName:"Example App",
    category:"Tools",
    versionName:"1.0.0",
    packageName:"com.example.app",
    verifiedDescription:"Verified description supplied by the release reviewer.",
    verifiedFeatures:["Feature one","Feature two"],
    verifiedChanges:["Initial release"]
  },null,2));
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");

  async function preview(){
    try{
      const r=await fetch(`${API}/api/ai/content-preview`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({verifiedMetadata:JSON.parse(metadata)})
      });
      const d=await r.json();
      setResult(d);
      setError(d.error||"");
    }catch(e){setError(e.message)}
  }

  async function generateForRelease(){
    try{
      const r=await fetch(`${API}/api/releases/${releaseId}/ai/generate`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(JSON.parse(metadata))
      });
      const d=await r.json();
      setResult(d);
      setError(d.error||"");
    }catch(e){setError(e.message)}
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>Crow AI — Content Engine</h1>
    <p>Generate grounded release content. Public publishing remains approval-gated.</p>

    <div style={{display:"grid",gap:12,maxWidth:800,marginTop:24}}>
      <input placeholder="Release UUID (optional)" value={releaseId}
        onChange={e=>setReleaseId(e.target.value)} style={{padding:12}}/>
      <textarea value={metadata} onChange={e=>setMetadata(e.target.value)}
        rows={18} style={{padding:12,fontFamily:"monospace"}}/>
      <div style={{display:"flex",gap:10}}>
        <button onClick={preview} style={{padding:"12px 18px"}}>Preview AI Content</button>
        <button onClick={generateForRelease} disabled={!releaseId}
          style={{padding:"12px 18px"}}>Save to Release</button>
      </div>
    </div>

    {error&&<p style={{marginTop:20}}>{error}</p>}
    {result&&<pre style={{marginTop:24,padding:20,border:"1px solid #292932",borderRadius:14,whiteSpace:"pre-wrap"}}>
      {JSON.stringify(result,null,2)}
    </pre>}
  </main>;
}
