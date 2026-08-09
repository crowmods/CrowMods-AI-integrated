use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Knowledge(){
  const [sources,setSources]=useState([]);
  const [question,setQuestion]=useState("");
  const [result,setResult]=useState(null);

  async function load(){
    const r=await fetch(`${API}/api/knowledge/sources`);
    const d=await r.json();
    setSources(d.sources||[]);
  }

  async function ask(){
    const r=await fetch(`${API}/api/knowledge/answer`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({question})
    });
    setResult(await r.json());
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / KNOWLEDGE</p>
      <h1>Knowledge Base & RAG</h1>
      <p style={{opacity:.7}}>
        Ground answers in verified CrowMods information.
      </p>

      <div style={{display:"flex",gap:10,marginTop:24}}>
        <input value={question} onChange={e=>setQuestion(e.target.value)}
          placeholder="Ask a question..."
          style={{padding:12,flex:1}}/>
        <button onClick={ask} style={{padding:"12px 18px"}}>
          Retrieve
        </button>
      </div>

      {result&&<pre style={{
        marginTop:20,padding:18,border:"1px solid #292932",
        borderRadius:12,whiteSpace:"pre-wrap"
      }}>{JSON.stringify(result,null,2)}</pre>}

      <section style={{marginTop:36}}>
        <h2>Knowledge Sources</h2>
        {sources.map(s=><article key={s.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{s.title}</strong>
          <p>{s.source_type} · {s.trust_level} · {s.status}</p>
          {s.canonical_url&&<small>{s.canonical_url}</small>}
        </article>)}
      </section>
    </div>
  </main>;
}
