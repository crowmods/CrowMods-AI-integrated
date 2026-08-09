use client";

import {useEffect,useState} from "react";
const API="http://localhost:4000";

export default function Revenue(){
  const [data,setData]=useState([]);
  const [message,setMessage]=useState("");

  async function load(){
    try{
      const r=await fetch(`${API}/api/monetization/summary`);
      const d=await r.json();
      if(d.error) setMessage(d.error);
      setData(d.revenue||[]);
    }catch{
      setMessage("Backend/database unavailable.");
    }
  }
  useEffect(()=>{load()},[]);

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods AI — Revenue</h1>
    <p>Revenue reporting foundation. Payment processing is intentionally not connected yet.</p>
    <div style={{display:"grid",gap:14,maxWidth:700,marginTop:24}}>
      {data.map((x,i)=><article key={i} style={{border:"1px solid #292932",borderRadius:14,padding:18}}>
        <strong>{x.source}</strong>
        <p>{x.total_minor} {x.currency} minor units · {x.events} events</p>
      </article>)}
      {!data.length&&<p>No revenue events recorded.</p>}
    </div>
    {message&&<p style={{marginTop:20}}>{message}</p>}
  </main>;
}
