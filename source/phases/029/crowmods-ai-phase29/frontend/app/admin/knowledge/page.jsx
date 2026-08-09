use client";

import {useState} from "react";

const API="http://localhost:4000";

export default function Knowledge(){
  const [question,setQuestion]=useState("How do I find the latest release?");
  const [answer,setAnswer]=useState(null);

  async function ask(){
    const r=await fetch(`${API}/api/knowledge/ask`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({question})
    });
    setAnswer(await r.json());
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>Crow AI — Knowledge Base</h1>
    <p>Ground answers in verified, published documentation.</p>

    <div style={{display:"grid",gap:12,maxWidth:750,marginTop:24}}>
      <textarea value={question} onChange={e=>setQuestion(e.target.value)}
        rows={5} style={{padding:12}}/>
      <button onClick={ask} style={{padding:"12px 18px"}}>Ask Knowledge Base</button>
    </div>

    {answer&&<pre style={{marginTop:24,padding:18,border:"1px solid #292932",
      borderRadius:14,whiteSpace:"pre-wrap",maxHeight:700,overflow:"auto"}}>
      {JSON.stringify(answer,null,2)}
    </pre>}
  </main>;
}
