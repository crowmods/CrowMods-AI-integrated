use client";

import {useEffect,useState} from "react";
const API="http://localhost:4000";

export default function Discord(){
  const [items,setItems]=useState([]);
  const [message,setMessage]=useState("");

  async function load(){
    const r=await fetch(`${API}/api/releases`);
    const d=await r.json();
    setItems((d.releases||[]).filter(x=>x.status==="PUBLISHED"));
  }
  useEffect(()=>{load()},[]);

  async function announce(id){
    const r=await fetch(`${API}/api/releases/${id}/discord/announce`,{method:"POST"});
    const d=await r.json();
    setMessage(d.error||d.message);
    load();
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods AI — Discord</h1>
    <p>Dry-run is enabled until your Discord bot credentials are configured.</p>
    {items.map(x=><article key={x.id} style={{marginTop:16,padding:20,border:"1px solid #292932",borderRadius:16}}>
      <h2>{x.aiBrief?.title||x.originalName}</h2>
      <p>Discord: {x.discord?.status||"NOT PUBLISHED"}</p>
      <button onClick={()=>announce(x.id)} style={{padding:"12px 18px"}}>Generate / Publish Announcement</button>
    </article>)}
    {!items.length&&<p>No published releases available.</p>}
    {message&&<pre style={{marginTop:20,whiteSpace:"pre-wrap"}}>{message}</pre>}
  </main>;
}
