use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Community(){
  const [content,setContent]=useState("How do I download the latest release?");
  const [platform,setPlatform]=useState("telegram");
  const [result,setResult]=useState(null);
  const [escalations,setEscalations]=useState([]);

  async function analyze(){
    const r=await fetch(`${API}/api/community/analyze`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        platform,
        channelRef:"demo-channel",
        content
      })
    });
    setResult(await r.json());
    loadEscalations();
  }

  async function loadEscalations(){
    const r=await fetch(`${API}/api/community/escalations`);
    const d=await r.json();
    setEscalations(d.escalations||[]);
  }

  useEffect(()=>{loadEscalations()},[]);

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>Crow AI — Community Manager</h1>
    <p>AI assists with replies and escalation; public moderation remains controlled.</p>

    <div style={{display:"grid",gap:12,maxWidth:750,marginTop:24}}>
      <select value={platform} onChange={e=>setPlatform(e.target.value)} style={{padding:12}}>
        <option>telegram</option>
        <option>discord</option>
        <option>website</option>
      </select>
      <textarea value={content} onChange={e=>setContent(e.target.value)}
        rows={6} style={{padding:12}}/>
      <button onClick={analyze} style={{padding:"12px 18px"}}>Analyze Message</button>
    </div>

    {result&&<pre style={{marginTop:24,padding:18,border:"1px solid #292932",
      borderRadius:14,whiteSpace:"pre-wrap"}}>
      {JSON.stringify(result,null,2)}
    </pre>}

    <section style={{marginTop:36}}>
      <h2>Open Escalations</h2>
      {escalations.map(x=><article key={x.id}
        style={{marginTop:10,padding:16,border:"1px solid #292932",borderRadius:12}}>
        <strong>{x.severity}</strong> — {x.reason}
        <p>{x.content}</p>
      </article>)}
    </section>
  </main>;
}
