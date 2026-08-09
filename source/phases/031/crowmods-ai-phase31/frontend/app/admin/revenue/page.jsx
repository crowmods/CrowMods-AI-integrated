use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Revenue(){
  const [data,setData]=useState(null);
  const [days,setDays]=useState(30);

  async function load(){
    const r=await fetch(`${API}/api/monetization/revenue?days=${days}`);
    setData(await r.json());
  }

  useEffect(()=>{load()},[days]);

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods AI — Revenue Center</h1>
    <p>Subscriptions, payments and affiliate revenue.</p>

    <select value={days} onChange={e=>setDays(e.target.value)}
      style={{padding:10,marginTop:20}}>
      <option value="7">Last 7 days</option>
      <option value="30">Last 30 days</option>
      <option value="90">Last 90 days</option>
      <option value="365">Last year</option>
    </select>

    {data&&<section style={{marginTop:24}}>
      {Object.entries(data.summary)
        .filter(([k])=>!["byProvider","byType"].includes(k))
        .map(([currency,value])=><article key={currency}
          style={{padding:22,border:"1px solid #292932",borderRadius:14,marginBottom:12}}>
          <small>{currency}</small>
          <h2>{value.toFixed(2)}</h2>
        </article>)}
      <pre style={{marginTop:20,padding:18,border:"1px solid #292932",
        borderRadius:14,whiteSpace:"pre-wrap"}}>
        {JSON.stringify(data.summary,null,2)}
      </pre>
    </section>}
  </main>;
}
