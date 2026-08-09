use client";

import {useEffect,useState} from "react";
const API="http://localhost:4000";

export default function Social(){
  const [platforms,setPlatforms]=useState([]);
  const [items,setItems]=useState([]);
  const [selected,setSelected]=useState("");
  const [chosen,setChosen]=useState({});
  const [message,setMessage]=useState("");

  async function load(){
    const [p,r]=await Promise.all([
      fetch(`${API}/api/platforms`).then(x=>x.json()),
      fetch(`${API}/api/releases`).then(x=>x.json())
    ]);
    setPlatforms(p.platforms||[]);
    setItems((r.releases||[]).filter(x=>x.status==="PUBLISHED"));
  }
  useEffect(()=>{load()},[]);

  function toggle(name){
    setChosen(x=>({...x,[name]:!x[name]}));
  }

  async function createCampaign(){
    const selectedPlatforms=Object.entries(chosen).filter(([,v])=>v).map(([k])=>k);
    const r=await fetch(`${API}/api/releases/${selected}/social/campaign`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({platforms:selectedPlatforms})
    });
    const d=await r.json();
    setMessage(d.error||`Campaign created for ${(d.campaign?.platforms||[]).length} platforms.`);
  }

  async function queue(){
    const r=await fetch(`${API}/api/releases/${selected}/social/publish`,{method:"POST"});
    const d=await r.json();
    setMessage(d.error||d.message);
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods AI — Social Distribution</h1>
    <p>One campaign, platform-specific content, official API connectors.</p>

    <select value={selected} onChange={e=>setSelected(e.target.value)} style={{padding:10,marginTop:20}}>
      <option value="">Select release</option>
      {items.map(x=><option key={x.id} value={x.id}>{x.aiBrief?.title||x.originalName}</option>)}
    </select>

    <section style={{marginTop:24,display:"grid",gap:10,maxWidth:520}}>
      {platforms.map(p=><label key={p.name} style={{padding:12,border:"1px solid #292932",borderRadius:10}}>
        <input type="checkbox" checked={!!chosen[p.name]} onChange={()=>toggle(p.name)} />{" "}
        {p.name} — <strong>{p.status}</strong>
      </label>)}
    </section>

    <div style={{marginTop:24,display:"flex",gap:10}}>
      <button disabled={!selected} onClick={createCampaign} style={{padding:"12px 18px"}}>Build Campaign</button>
      <button disabled={!selected} onClick={queue} style={{padding:"12px 18px"}}>Queue Distribution</button>
    </div>

    {message&&<pre style={{marginTop:24,whiteSpace:"pre-wrap"}}>{message}</pre>}
  </main>;
}
