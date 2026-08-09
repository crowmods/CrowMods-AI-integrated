use client";

import {useEffect,useState} from "react";
const API="http://localhost:4000";

export default function Apps(){
  const [items,setItems]=useState([]);
  useEffect(()=>{fetch(`${API}/api/public/releases`).then(r=>r.json()).then(d=>setItems(d.releases||[]))},[]);
  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods</h1>
    <p>Latest published releases</p>
    <div style={{display:"grid",gap:16,marginTop:24}}>
      {items.map(x=><article key={x.id} style={{border:"1px solid #292932",borderRadius:16,padding:20}}>
        <h2>{x.title}</h2><p>{x.description}</p>
        <small>{x.category} · {(x.tags||[]).join(", ")}</small>
      </article>)}
      {!items.length && <p>No releases published yet.</p>}
    </div>
  </main>;
}
