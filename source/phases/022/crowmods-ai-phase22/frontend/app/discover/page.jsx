use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

function Card({x}){
  return <a href={`/apps/${x.id}`} style={{
    color:"#fff",textDecoration:"none",border:"1px solid #292932",
    borderRadius:16,padding:18
  }}>
    <small>{x.category||"Android"}</small>
    <h2>{x.title||x.original_name}</h2>
    <p style={{opacity:.7}}>{x.short_description||"View release."}</p>
    <small>Downloads: {x.download_count||0}</small>
  </a>;
}

export default function Discover(){
  const [q,setQ]=useState("");
  const [results,setResults]=useState([]);
  const [trending,setTrending]=useState([]);
  const [recent,setRecent]=useState([]);

  async function search(){
    const r=await fetch(`${API}/api/discovery/search?q=${encodeURIComponent(q)}`);
    const d=await r.json();
    setResults(d.results||[]);
  }

  useEffect(()=>{
    Promise.all([
      fetch(`${API}/api/discovery/trending`).then(r=>r.json()),
      fetch(`${API}/api/discovery/recent`).then(r=>r.json())
    ]).then(([t,r])=>{
      setTrending(t.results||[]);
      setRecent(r.results||[]);
    });
  },[]);

  return <main style={{minHeight:"100vh",background:"#07070a",color:"#fff",padding:32}}>
    <header style={{maxWidth:1150,margin:"0 auto"}}>
      <p style={{opacity:.6}}>CROWMODS AI</p>
      <h1>Discover</h1>
      <div style={{display:"flex",gap:10,marginTop:20}}>
        <input value={q} onChange={e=>setQ(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&search()}
          placeholder="Search apps, games, categories..."
          style={{padding:14,flex:1}}/>
        <button onClick={search} style={{padding:"14px 20px"}}>Search</button>
      </div>

      {q&&<section style={{marginTop:32}}>
        <h2>Search Results</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
          {results.map(x=><Card key={x.id} x={x}/>)}
        </div>
      </section>}

      <section style={{marginTop:40}}>
        <h2>Trending</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
          {trending.map(x=><Card key={x.id} x={x}/>)}
        </div>
      </section>

      <section style={{marginTop:40}}>
        <h2>Recently Updated</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
          {recent.map(x=><Card key={x.id} x={x}/>)}
        </div>
      </section>
    </header>
  </main>;
}
