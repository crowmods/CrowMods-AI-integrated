use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Home(){
  const [releases,setReleases]=useState([]);
  const [q,setQ]=useState("");

  async function load(){
    const r=await fetch(`${API}/api/public/releases?q=${encodeURIComponent(q)}`);
    const d=await r.json();
    setReleases(d.releases||[]);
  }

  useEffect(()=>{load()},[]);

  return <main style={{minHeight:"100vh",background:"#07070a",color:"#fff",padding:32}}>
    <header style={{maxWidth:1100,margin:"0 auto"}}>
      <p style={{opacity:.65}}>CROWMODS AI</p>
      <h1>Apps & Games</h1>
      <p>Browse approved and published releases.</p>
      <div style={{display:"flex",gap:10,marginTop:20}}>
        <input placeholder="Search apps and games..." value={q}
          onChange={e=>setQ(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&load()}
          style={{padding:14,flex:1}}/>
        <button onClick={load} style={{padding:"14px 20px"}}>Search</button>
      </div>
    </header>

    <section style={{maxWidth:1100,margin:"32px auto",display:"grid",
      gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16}}>
      {releases.map(x=><a key={x.id} href={`/apps/${x.id}`}
        style={{color:"#fff",textDecoration:"none",border:"1px solid #292932",
        borderRadius:16,padding:20}}>
        <small>{x.category||"Android"}</small>
        <h2>{x.title||x.original_name}</h2>
        <p style={{opacity:.7}}>{x.short_description||"View release details."}</p>
        <small>Version {x.version_name||"—"}</small>
      </a>)}
      {!releases.length&&<p>No published releases found.</p>}
    </section>
  </main>;
}
