use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Support(){
  const [tickets,setTickets]=useState([]);

  async function load(){
    const r=await fetch(`${API}/api/support/tickets`);
    const d=await r.json();
    setTickets(d.tickets||[]);
  }

  async function resolve(id,status){
    await fetch(`${API}/api/support/tickets/${id}/resolve`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        status,
        response:status==="RESOLVED"?"Resolved by support":"Escalated to support"
      })
    });
    load();
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / SUPPORT</p>
      <h1>AI Customer Support</h1>
      <p style={{opacity:.7}}>
        AI triage, draft responses and human escalation.
      </p>

      {tickets.map(t=><article key={t.id}
        style={{padding:18,border:"1px solid #292932",
        borderRadius:12,marginTop:12}}>
        <strong>{t.subject}</strong>
        <p>{t.category} · {t.priority} · {t.status}</p>
        <p>{t.message}</p>
        <small>AI confidence: {t.ai_confidence}</small>

        <div style={{marginTop:12}}>
          <button onClick={()=>resolve(t.id,"RESOLVED")}
            style={{padding:"8px 14px",marginRight:8}}>
            Resolve
          </button>
          <button onClick={()=>resolve(t.id,"ESCALATED")}
            style={{padding:"8px 14px"}}>
            Escalate
          </button>
        </div>
      </article>)}

      {!tickets.length&&<p>No support tickets.</p>}
    </div>
  </main>;
}
