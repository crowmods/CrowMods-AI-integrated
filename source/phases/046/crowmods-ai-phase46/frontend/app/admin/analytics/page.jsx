use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Analytics(){
  const [data,setData]=useState(null);
  const [platforms,setPlatforms]=useState([]);

  async function load(){
    const [a,p]=await Promise.all([
      fetch(`${API}/api/analytics/overview?days=30`).then(r=>r.json()),
      fetch(`${API}/api/analytics/platforms?days=30`).then(r=>r.json())
    ]);
    setData(a);
    setPlatforms(p.platforms||[]);
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / ANALYTICS</p>
      <h1>Growth Intelligence</h1>
      <p style={{opacity:.7}}>30-day first-party performance overview.</p>

      {data&&<section style={{
        display:"grid",gridTemplateColumns:"repeat(3,1fr)",
        gap:12,marginTop:28
      }}>
        {[
          ["Page Views",data.metrics?.visitors],
          ["Release Views",data.metrics?.releaseViews],
          ["Downloads",data.metrics?.downloads],
          ["Campaign Clicks",data.metrics?.campaignClicks],
          ["Community Joins",data.metrics?.joins],
          ["Purchasers",data.metrics?.purchasers]
        ].map(([label,value])=><div key={label}
          style={{padding:18,border:"1px solid #292932",borderRadius:12}}>
          <small>{label}</small>
          <h2>{value||0}</h2>
        </div>)}
      </section>}

      {data&&<section style={{marginTop:36}}>
        <h2>AI Growth Recommendations</h2>
        {data.recommendations?.map((x,i)=><p key={i}>• {x}</p>)}
      </section>}

      <section style={{marginTop:36}}>
        <h2>Platform Performance</h2>
        {platforms.map(p=><article key={p.platform}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{p.platform}</strong>
          <p>
            Events: {p.events} · Clicks: {p.clicks} ·
            Joins: {p.joins} · Downloads: {p.downloads}
          </p>
        </article>)}
      </section>
    </div>
  </main>;
}
