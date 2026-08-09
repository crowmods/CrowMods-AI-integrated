use client";

import {useState} from "react";
const API="http://localhost:4000";

export default function Analytics(){
  const [metrics,setMetrics]=useState({
    pageViews:10000,downloads:180,socialClicks:500,
    communityMembers:1200,communityGrowth7d:4,revenue7d:5000,revenuePrev7d:4200
  });
  const [recommendations,setRecommendations]=useState([]);

  async function analyze(){
    const r=await fetch(`${API}/api/growth/recommendations`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify(metrics)
    });
    const d=await r.json();
    setRecommendations(d.recommendations||[]);
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods AI — Growth Intelligence</h1>
    <p>AI-assisted recommendations from your measured metrics.</p>

    <div style={{display:"grid",gap:10,maxWidth:500,marginTop:24}}>
      {Object.entries(metrics).map(([key,value])=>
        <label key={key}>{key}
          <input type="number" value={value}
            onChange={e=>setMetrics({...metrics,[key]:Number(e.target.value)})}
            style={{display:"block",width:"100%",padding:10,marginTop:4}} />
        </label>
      )}
      <button onClick={analyze} style={{padding:"12px 18px",marginTop:10}}>
        Analyze Growth
      </button>
    </div>

    <section style={{marginTop:30}}>
      <h2>AI Recommendations</h2>
      {recommendations.map((r,i)=>
        <article key={i} style={{border:"1px solid #292932",borderRadius:14,padding:18,marginTop:12}}>
          <strong>{r.priority} — {r.type}</strong>
          <p>{r.message}</p>
          <small>Suggested action: {r.action}</small>
        </article>
      )}
    </section>
  </main>;
}
