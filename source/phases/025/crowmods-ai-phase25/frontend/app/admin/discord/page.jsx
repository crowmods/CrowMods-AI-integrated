use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Discord(){
  const [posts,setPosts]=useState([]);
  const [draft,setDraft]=useState(null);
  const [input,setInput]=useState({
    title:"Example Release",
    version:"1.0.0",
    description:"Verified release description.",
    releaseUrl:"https://example.com/apps/example",
    features:["Verified feature one","Verified feature two"]
  });

  async function generate(){
    const r=await fetch(`${API}/api/discord/draft`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(input)
    });
    setDraft(await r.json());
  }

  async function load(){
    const r=await fetch(`${API}/api/discord/posts`);
    const d=await r.json();
    setPosts(d.posts||[]);
  }

  useEffect(()=>{load()},[]);

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods AI — Discord Engine</h1>
    <p>Generate professional embeds with approval before publishing.</p>

    <div style={{display:"grid",gap:12,maxWidth:700,marginTop:24}}>
      <input value={input.title}
        onChange={e=>setInput({...input,title:e.target.value})}
        style={{padding:12}}/>
      <input value={input.version}
        onChange={e=>setInput({...input,version:e.target.value})}
        style={{padding:12}}/>
      <textarea value={input.description}
        onChange={e=>setInput({...input,description:e.target.value})}
        rows={4} style={{padding:12}}/>
      <input value={input.releaseUrl}
        onChange={e=>setInput({...input,releaseUrl:e.target.value})}
        style={{padding:12}}/>
      <button onClick={generate} style={{padding:"12px 18px"}}>Generate Embed</button>
    </div>

    {draft&&<pre style={{marginTop:24,padding:18,border:"1px solid #292932",borderRadius:14,whiteSpace:"pre-wrap"}}>
      {JSON.stringify(draft,null,2)}
    </pre>}

    <section style={{marginTop:36}}>
      <h2>Recent Posts</h2>
      {posts.map(x=><article key={x.id}
        style={{marginTop:10,padding:16,border:"1px solid #292932",borderRadius:12}}>
        <strong>{x.status}</strong> — {x.destination_name}
        <p>{JSON.stringify(x.content).slice(0,220)}</p>
      </article>)}
    </section>
  </main>;
}
