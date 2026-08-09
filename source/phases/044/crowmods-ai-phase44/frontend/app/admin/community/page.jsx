use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Community(){
  const [messages,setMessages]=useState([]);
  const [metrics,setMetrics]=useState(null);

  async function load(){
    const [m,x]=await Promise.all([
      fetch(`${API}/api/community/review`).then(r=>r.json()),
      fetch(`${API}/api/community/metrics`).then(r=>r.json())
    ]);
    setMessages(m.messages||[]);
    setMetrics(x);
  }

  async function action(id,approved){
    await fetch(`${API}/api/community/messages/${id}/action`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        actionType:"REPLY",
        content:{text:"Thanks for contacting CrowMods."},
        approved
      })
    });
    load();
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / COMMUNITY</p>
      <h1>AI Community Manager</h1>
      <p style={{opacity:.7}}>
        Questions, support, moderation signals and member insights.
      </p>

      {metrics&&<div style={{
        display:"grid",gridTemplateColumns:"repeat(3,1fr)",
        gap:12,marginTop:28
      }}>
        <div style={{padding:18,border:"1px solid #292932",borderRadius:12}}>
          Messages<br/><strong>{metrics.messages}</strong>
        </div>
        <div style={{padding:18,border:"1px solid #292932",borderRadius:12}}>
          Review Queue<br/><strong>{metrics.reviewQueue}</strong>
        </div>
        <div style={{padding:18,border:"1px solid #292932",borderRadius:12}}>
          Members<br/><strong>{metrics.members}</strong>
        </div>
      </div>}

      <section style={{marginTop:36}}>
        <h2>AI Review Queue</h2>

        {messages.map(m=><article key={m.id}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12,marginTop:12}}>
          <strong>{m.platform}</strong> · {m.ai_label}
          <p>{m.message_text}</p>
          <p>Risk: {m.risk_score} · Suggested: {m.suggested_action}</p>

          <button onClick={()=>action(m.id,true)}
            style={{padding:"8px 14px",marginRight:8}}>
            Approve Action
          </button>
          <button onClick={()=>action(m.id,false)}
            style={{padding:"8px 14px"}}>
            Reject
          </button>
        </article>)}

        {!messages.length&&<p>No messages awaiting review.</p>}
      </section>
    </div>
  </main>;
}
