use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Analytics(){
  const [data,setData]=useState(null);
  const [days,setDays]=useState(7);

  async function load(){
    const r=await fetch(`${API}/api/analytics/kpis?days=${days}`);
    setData(await r.json());
  }

  useEffect(()=>{load()},[days]);

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods AI — Growth Center</h1>
    <p>Unified website, campaign and revenue analytics.</p>

    <select value={days} onChange={e=>setDays(e.target.value)}
      style={{padding:10,marginTop:20}}>
      <option value="1">Last 24 hours</option>
      <option value="7">Last 7 days</option>
      <option value="30">Last 30 days</option>
      <option value="90">Last 90 days</option>
    </select>

    {data&&<>
      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginTop:24}}>
        {[
          ["Views",data.kpis.views],
          ["Downloads",data.kpis.downloads],
          ["Campaign Impressions",data.kpis.campaign_impressions],
          ["Campaign Clicks",data.kpis.campaign_clicks],
          ["Revenue",`${data.kpis.revenue} ${data.kpis.currency}`]
        ].map(([name,value])=><article key={name}
          style={{padding:20,border:"1px solid #292932",borderRadius:14}}>
          <small>{name}</small>
          <h2>{value}</h2>
        </article>)}
      </section>

      <section style={{marginTop:36}}>
        <h2>AI Growth Insights</h2>
        {data.insights.map((x,i)=><article key={i}
          style={{marginTop:10,padding:16,border:"1px solid #292932",borderRadius:12}}>
          <strong>{x.type}</strong>
          <p>{x.message}</p>
          <small>Recommended action: {x.action}</small>
        </article>)}
      </section>
    </>}
  </main>;
}
