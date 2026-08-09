use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Campaigns(){
  const [campaigns,setCampaigns]=useState([]);
  const [selected,setSelected]=useState(null);
  const [posts,setPosts]=useState([]);

  async function load(){
    const r=await fetch(`${API}/api/campaigns`);
    const d=await r.json();
    setCampaigns(d.campaigns||[]);
  }

  async function viewPosts(id){
    const r=await fetch(`${API}/api/campaigns/${id}/posts`);
    const d=await r.json();
    setSelected(id);
    setPosts(d.posts||[]);
  }

  async function approvePost(id,approved){
    await fetch(`${API}/api/campaign-posts/${id}/approve`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({approved})
    });
    if(selected)viewPosts(selected);
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / CAMPAIGNS</p>
      <h1>Multi-Platform Campaign Engine</h1>
      <p style={{opacity:.7}}>
        One approved release → platform-specific campaign drafts.
      </p>

      <section style={{marginTop:32}}>
        {campaigns.map(c=><article key={c.id}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:14,marginTop:12}}>
          <strong>{c.name}</strong>
          <p>{c.status} · {c.objective}</p>
          <button onClick={()=>viewPosts(c.id)}
            style={{padding:"8px 14px"}}>View Posts</button>
        </article>)}
        {!campaigns.length&&<p>No campaigns yet.</p>}
      </section>

      {selected&&<section style={{marginTop:36}}>
        <h2>Platform Drafts</h2>
        {posts.map(p=><article key={p.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{p.platform}</strong> · {p.status}
          <pre style={{whiteSpace:"pre-wrap",opacity:.85}}>
            {JSON.stringify(p.content,null,2)}
          </pre>
          {p.status==="REVIEW"&&<div>
            <button onClick={()=>approvePost(p.id,true)}
              style={{padding:"8px 14px",marginRight:8}}>Approve</button>
            <button onClick={()=>approvePost(p.id,false)}
              style={{padding:"8px 14px"}}>Reject</button>
          </div>}
        </article>)}
      </section>
    </div>
  </main>;
}
