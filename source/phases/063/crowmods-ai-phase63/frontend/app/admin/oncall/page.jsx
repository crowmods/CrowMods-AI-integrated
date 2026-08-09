use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function OnCall(){
  const [incidents,setIncidents]=useState([]);

  async function load(){
    const r=await fetch(`${API}/api/oncall/incidents`);
    const d=await r.json();
    setIncidents(d.incidents||[]);
  }

  useEffect(()=>{load()},[]);

  async function acknowledge(id){
    await fetch(`${API}/api/oncall/incidents/${id}/acknowledge`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({actor:"on-call"})
    });
    load();
  }

  async function resolve(id){
    await fetch(`${API}/api/oncall/incidents/${id}/resolve`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        actor:"on-call",
        message:"Incident resolved after verification."
      })
    });
    load();
  }

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / ON-CALL</p>
      <h1>Incident Operations</h1>

      {incidents.length===0&&<p>No routed incidents.</p>}

      {incidents.map(item=><article key={item.id}
        style={{padding:18,border:"1px solid #292932",
        borderRadius:12,marginTop:12}}>
        <strong>{item.severity} · {item.status}</strong>
        <p>{item.service}</p>
        <small>Dedupe: {item.dedupe_key}</small>

        <div style={{marginTop:14,display:"flex",gap:8}}>
          {item.status!=="ACKNOWLEDGED" &&
           item.status!=="RESOLVED"&&
            <button onClick={()=>acknowledge(item.id)}>
              Acknowledge
            </button>}
          {item.status!=="RESOLVED"&&
            <button onClick={()=>resolve(item.id)}>
              Resolve
            </button>}
        </div>
      </article>)}
    </div>
  </main>;
}
