use client";

import {useState} from "react";

const API="http://localhost:4000";

export default function Media(){
  const [releaseId,setReleaseId]=useState("");
  const [name,setName]=useState("");
  const [type,setType]=useState("ICON");
  const [size,setSize]=useState("");
  const [result,setResult]=useState(null);

  async function create(){
    const r=await fetch(`${API}/api/media/create`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        releaseId,
        assetType:type,
        originalName:name,
        contentType:"image/png",
        sizeBytes:Number(size)
      })
    });
    setResult(await r.json());
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods AI — Media Pipeline</h1>
    <p>Artwork enters quarantine before processing.</p>

    <div style={{display:"grid",gap:12,maxWidth:560,marginTop:24}}>
      <input placeholder="Release UUID" value={releaseId}
        onChange={e=>setReleaseId(e.target.value)} style={{padding:12}}/>
      <select value={type} onChange={e=>setType(e.target.value)} style={{padding:12}}>
        <option>ICON</option>
        <option>SCREENSHOT</option>
        <option>BANNER</option>
        <option>THUMBNAIL</option>
        <option>TELEGRAM_ART</option>
        <option>SOCIAL_ART</option>
      </select>
      <input placeholder="Filename" value={name}
        onChange={e=>setName(e.target.value)} style={{padding:12}}/>
      <input type="number" placeholder="Size in bytes" value={size}
        onChange={e=>setSize(e.target.value)} style={{padding:12}}/>
      <button onClick={create} style={{padding:"12px 18px"}}>Create Media Intake</button>
    </div>

    {result&&<pre style={{marginTop:24,padding:18,border:"1px solid #292932",borderRadius:14,whiteSpace:"pre-wrap"}}>
      {JSON.stringify(result,null,2)}
    </pre>}
  </main>;
}
