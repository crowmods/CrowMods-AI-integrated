use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function ReleasePages(){
  const [pages,setPages]=useState([]);

  async function load(){
    const r=await fetch(`${API}/api/release-pages`);
    const d=await r.json();
    setPages(d.pages||[]);
  }

  async function approve(id,approved){
    await fetch(`${API}/api/release-pages/${id}/approve`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({approved})
    });
    load();
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / WEBSITE</p>
      <h1>AI Release Page Builder</h1>
      <p style={{opacity:.7}}>
        Verified release data → website-ready page → approval → publish.
      </p>

      {pages.map(p=><article key={p.id}
        style={{padding:18,border:"1px solid #292932",
        borderRadius:14,marginTop:12}}>
        <h2 style={{marginTop:0}}>{p.title}</h2>
        <p>{p.category||"Uncategorized"} · {p.version_name||"Version unknown"}</p>
        <p>Status: {p.status}</p>
        <small>{p.slug}</small>

        {p.status==="REVIEW"&&
          <div style={{marginTop:14,display:"flex",gap:8}}>
            <button onClick={()=>approve(p.id,true)}
              style={{padding:"8px 14px"}}>Approve</button>
            <button onClick={()=>approve(p.id,false)}
              style={{padding:"8px 14px"}}>Reject</button>
          </div>}
      </article>)}

      {!pages.length&&<p>No release pages yet.</p>}
    </div>
  </main>;
}
