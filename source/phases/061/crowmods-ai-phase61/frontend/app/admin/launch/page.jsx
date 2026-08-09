use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function LaunchOperations(){
  const [template,setTemplate]=useState([]);
  const [release,setRelease]=useState("");
  const [launch,setLaunch]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/operations/checklist-template`)
      .then(r=>r.json())
      .then(d=>setTemplate(d.items||[]));
  },[]);

  async function createLaunch(){
    if(!release)return;
    const r=await fetch(`${API}/api/operations/launch`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        releaseVersion:release,
        owner:"production-owner"
      })
    });
    const d=await r.json();
    if(d.launch)setLaunch(d.launch);
  }

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / LAUNCH OPS</p>
      <h1>Production Launch Control</h1>

      <div style={{display:"flex",gap:10,marginTop:24}}>
        <input
          value={release}
          onChange={e=>setRelease(e.target.value)}
          placeholder="Release version"
          style={{padding:12,flex:1}}
        />
        <button onClick={createLaunch} style={{padding:"12px 18px"}}>
          Create Launch
        </button>
      </div>

      <section style={{marginTop:32}}>
        <h2>Required Evidence</h2>
        {template.map(item=><article key={item.itemKey}
          style={{padding:14,border:"1px solid #292932",
          borderRadius:12,marginTop:8}}>
          ☐ {item.label}
        </article>)}
      </section>

      {launch&&<section style={{
        marginTop:30,padding:18,border:"1px solid #292932",
        borderRadius:12
      }}>
        <h2>Launch Created</h2>
        <p>{launch.release_version}</p>
        <p>Status: {launch.status}</p>
        <p>Launch ID: {launch.id}</p>
      </section>}
    </div>
  </main>;
}
