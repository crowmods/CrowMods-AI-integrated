use client";

import {useEffect,useState} from "react";
const API="http://localhost:4000";

export default function Campaign(){
  const [items,setItems]=useState([]);
  const [selected,setSelected]=useState("");
  const [template,setTemplate]=useState("release");
  const [imageUrl,setImageUrl]=useState("");
  const [scheduledFor,setScheduledFor]=useState("");
  const [message,setMessage]=useState("");

  async function load(){
    const r=await fetch(`${API}/api/releases`);
    const d=await r.json();
    setItems((d.releases||[]).filter(x=>x.status==="PUBLISHED"));
  }
  useEffect(()=>{load()},[]);

  async function prepare(){
    const r=await fetch(`${API}/api/releases/${selected}/campaign`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({template,imageUrl:imageUrl||null,scheduledFor:scheduledFor||null})
    });
    const d=await r.json();
    setMessage(d.error||d.message);
    load();
  }

  async function publish(){
    const r=await fetch(`${API}/api/releases/${selected}/campaign/publish`,{method:"POST"});
    const d=await r.json();
    setMessage(d.error||d.message);
    load();
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods AI — Campaign Studio</h1>
    <p>Create a platform-ready Telegram campaign after website publication.</p>

    <select value={selected} onChange={e=>setSelected(e.target.value)} style={{padding:10,marginTop:20}}>
      <option value="">Select release</option>
      {items.map(x=><option key={x.id} value={x.id}>{x.aiBrief?.title||x.originalName}</option>)}
    </select>

    <div style={{marginTop:20,display:"grid",gap:12,maxWidth:600}}>
      <select value={template} onChange={e=>setTemplate(e.target.value)} style={{padding:10}}>
        <option value="release">New Release</option>
        <option value="update">Update</option>
        <option value="featured">Featured</option>
      </select>
      <input placeholder="Promotional image URL (optional)" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} style={{padding:10}} />
      <input type="datetime-local" value={scheduledFor} onChange={e=>setScheduledFor(e.target.value)} style={{padding:10}} />
      <div style={{display:"flex",gap:10}}>
        <button onClick={prepare} disabled={!selected} style={{padding:"12px 18px"}}>Prepare Campaign</button>
        <button onClick={publish} disabled={!selected} style={{padding:"12px 18px"}}>Generate / Publish</button>
      </div>
    </div>

    {message&&<pre style={{marginTop:24,whiteSpace:"pre-wrap"}}>{message}</pre>}
  </main>;
}
