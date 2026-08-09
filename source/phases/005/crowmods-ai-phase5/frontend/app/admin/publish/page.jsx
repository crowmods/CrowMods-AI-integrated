use client";

import {useEffect,useState} from "react";
const API="http://localhost:4000";

export default function Publish(){
  const [items,setItems]=useState([]);
  const [message,setMessage]=useState("");

  async function load(){
    const r=await fetch(`${API}/api/releases`);
    const d=await r.json();
    setItems((d.releases||[]).filter(x=>x.status==="APPROVED"));
  }
  useEffect(()=>{load()},[]);

  async function publish(id){
    const r=await fetch(`${API}/api/releases/${id}/publish`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({authorizationConfirmed:true})
    });
    const d=await r.json();
    setMessage(d.error||d.message);
    load();
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods — Website Publisher</h1>
    <p>Only approved releases appear here.</p>
    {items.map(x=><div key={x.id} style={{marginTop:16,border:"1px solid #292932",borderRadius:16,padding:20}}>
      <h2>{x.aiBrief?.title||x.originalName}</h2>
      <p>{x.aiBrief?.description}</p>
      <button onClick={()=>publish(x.id)} style={{padding:"12px 18px"}}>Publish Website Listing</button>
    </div>)}
    {!items.length&&<p>No approved releases waiting for publication.</p>}
    {message&&<p>{message}</p>}
  </main>;
}
