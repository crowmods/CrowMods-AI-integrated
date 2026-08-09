use client";

import {useState} from "react";

const API="http://localhost:4000";

export default function Strategy(){
  const [input,setInput]=useState({
    category:"Games",
    audience:"general",
    hasVideo:true,
    hasScreenshots:true
  });
  const [result,setResult]=useState(null);

  async function generate(){
    const r=await fetch(`${API}/api/strategy/recommend`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(input)
    });
    setResult(await r.json());
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>Crow AI — Social Strategy</h1>
    <p>Explainable recommendations based on release context and available analytics.</p>

    <div style={{display:"grid",gap:12,maxWidth:600,marginTop:24}}>
      <input value={input.category}
        onChange={e=>setInput({...input,category:e.target.value})}
        placeholder="Category" style={{padding:12}}/>
      <select value={input.audience}
        onChange={e=>setInput({...input,audience:e.target.value})}
        style={{padding:12}}>
        <option value="general">General</option>
        <option value="developers">Developers</option>
      </select>
      <label><input type="checkbox" checked={input.hasVideo}
        onChange={e=>setInput({...input,hasVideo:e.target.checked})}/> Video available</label>
      <label><input type="checkbox" checked={input.hasScreenshots}
        onChange={e=>setInput({...input,hasScreenshots:e.target.checked})}/> Screenshots available</label>
      <button onClick={generate} style={{padding:"12px 18px"}}>Generate Strategy</button>
    </div>

    {result&&<pre style={{marginTop:24,padding:18,border:"1px solid #292932",
      borderRadius:14,whiteSpace:"pre-wrap",maxHeight:700,overflow:"auto"}}>
      {JSON.stringify(result,null,2)}
    </pre>}
  </main>;
}
