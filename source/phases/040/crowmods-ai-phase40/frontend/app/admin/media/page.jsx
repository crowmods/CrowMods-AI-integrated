use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function MediaStudio(){
  const [assets,setAssets]=useState([]);
  const [appName,setAppName]=useState("Example App");

  async function load(){
    const r=await fetch(`${API}/api/media/assets`);
    const d=await r.json();
    setAssets(d.assets||[]);
  }

  async function create(){
    await fetch(`${API}/api/media/assets`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        originalName:"release-artwork.png",
        appName,
        mediaType:"image",
        mimeType:"image/png",
        width:1920,
        height:1080,
        sizeBytes:1024
      })
    });
    load();
  }

  async function approve(id,approved){
    await fetch(`${API}/api/media/assets/${id}/approve`,{
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
      <p style={{opacity:.55}}>CROWMODS AI / MEDIA</p>
      <h1>Media Intelligence & Asset Studio</h1>
      <p style={{opacity:.7}}>
        Central artwork library with platform-specific variants.
      </p>

      <div style={{display:"flex",gap:10,marginTop:24}}>
        <input value={appName} onChange={e=>setAppName(e.target.value)}
          style={{padding:12,flex:1}}/>
        <button onClick={create} style={{padding:"12px 18px"}}>
          Register Asset
        </button>
      </div>

      <section style={{marginTop:36}}>
        {assets.map(a=><article key={a.id}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:14,marginTop:12}}>
          <strong>{a.original_name}</strong>
          <p>Status: {a.status}</p>
          <p>{a.caption}</p>
          <small>SHA-256: {a.sha256||"pending"}</small>

          {a.status==="REVIEW"&&
            <div style={{marginTop:12,display:"flex",gap:8}}>
              <button onClick={()=>approve(a.id,true)}
                style={{padding:"8px 14px"}}>Approve</button>
              <button onClick={()=>approve(a.id,false)}
                style={{padding:"8px 14px"}}>Reject</button>
            </div>}
        </article>)}
      </section>
    </div>
  </main>;
}
