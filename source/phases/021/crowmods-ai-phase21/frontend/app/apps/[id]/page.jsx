use client";

import {useEffect,useState} from "react";
import {useParams} from "next/navigation";

const API="http://localhost:4000";

export default function ReleasePage(){
  const params=useParams();
  const [data,setData]=useState(null);
  const [error,setError]=useState("");

  useEffect(()=>{
    if(!params?.id)return;
    fetch(`${API}/api/public/releases/${params.id}`)
      .then(r=>r.json())
      .then(d=>d.error?setError(d.error):setData(d))
      .catch(()=>setError("Release unavailable."));
  },[params?.id]);

  async function download(){
    await fetch(`${API}/api/public/releases/${params.id}/download-event`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({source:"release-page"})
    });
    alert("Signed download storage is not configured in this prototype.");
  }

  if(error)return <main style={{padding:40,color:"#fff",background:"#07070a",minHeight:"100vh"}}>{error}</main>;
  if(!data)return <main style={{padding:40,color:"#fff",background:"#07070a",minHeight:"100vh"}}>Loading…</main>;

  const r=data.release;

  return <main style={{minHeight:"100vh",background:"#07070a",color:"#fff",padding:40}}>
    <article style={{maxWidth:900,margin:"0 auto"}}>
      <small>{r.category||"Android"}</small>
      <h1>{r.title||r.original_name}</h1>
      <p>{r.short_description}</p>

      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <span>Version: {r.version_name||"—"}</span>
        <span>Size: {Math.round((r.size_bytes||0)/1024/1024)} MB</span>
        <span>SHA-256: {r.sha256||"—"}</span>
      </div>

      <button onClick={download} style={{marginTop:24,padding:"14px 22px"}}>
        Download
      </button>

      <section style={{marginTop:32}}>
        <h2>Description</h2>
        <p>{r.description||r.short_description}</p>
      </section>

      <section style={{marginTop:32}}>
        <h2>Features</h2>
        {(r.features||[]).map((x,i)=><p key={i}>• {x}</p>)}
      </section>

      <section style={{marginTop:32}}>
        <h2>What's New</h2>
        {(r.whats_new||[]).map((x,i)=><p key={i}>• {x}</p>)}
      </section>

      <section style={{marginTop:32}}>
        <h2>Related Releases</h2>
        {(data.related||[]).map(x=><a key={x.id} href={`/apps/${x.id}`}
          style={{display:"block",color:"#fff",marginTop:8}}>
          {x.title||x.id}
        </a>)}
      </section>
    </article>
  </main>;
}
