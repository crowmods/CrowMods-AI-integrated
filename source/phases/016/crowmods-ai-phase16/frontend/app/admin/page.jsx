use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

const cards=[
  ["releases.total","Total Releases"],
  ["releases.pending","Pending Approval"],
  ["releases.published","Published"],
  ["users","Users"],
  ["activeMemberships","Premium Members"],
  ["revenueMinor","Revenue (minor units)"],
  ["events24h","Analytics Events / 24h"]
];

export default function AdminHome(){
  const [data,setData]=useState(null);
  const [releases,setReleases]=useState([]);
  const [error,setError]=useState("");

  async function load(){
    try{
      const [a,b]=await Promise.all([
        fetch(`${API}/api/admin/overview`).then(r=>r.json()),
        fetch(`${API}/api/admin/recent-releases`).then(r=>r.json())
      ]);
      if(a.error)throw new Error(a.error);
      setData(a);
      setReleases(b.releases||[]);
    }catch(e){
      setError(e.message||"Dashboard unavailable");
    }
  }

  useEffect(()=>{load()},[]);

  function get(obj,path){
    return path.split(".").reduce((v,k)=>v?.[k],obj) ?? 0;
  }

  return <main style={{minHeight:"100vh",background:"#07070a",color:"#fff",padding:32}}>
    <header>
      <p style={{opacity:.65}}>CROWMODS AI</p>
      <h1>Command Center</h1>
      <p>One dashboard for releases, publishing, community, revenue and security.</p>
    </header>

    {error&&<div style={{marginTop:20,padding:16,border:"1px solid #633",borderRadius:12}}>{error}</div>}

    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginTop:28}}>
      {cards.map(([path,label])=><article key={path} style={{padding:20,border:"1px solid #292932",borderRadius:16}}>
        <small style={{opacity:.6}}>{label}</small>
        <h2 style={{marginTop:8}}>{data?get(data,path):"—"}</h2>
      </article>)}
    </section>

    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginTop:28}}>
      {[
        ["Upload & AI","/admin"],
        ["Approval Center","/admin/approvals"],
        ["Website Publisher","/admin/publish"],
        ["Telegram","/admin/telegram"],
        ["Campaign Studio","/admin/campaign"],
        ["Discord","/admin/discord"],
        ["Social Distribution","/admin/social"],
        ["Analytics & Growth","/admin/analytics"],
        ["Revenue","/admin/revenue"]
      ].map(([name,url])=><a key={url} href={url} style={{padding:20,border:"1px solid #292932",borderRadius:16,color:"#fff",textDecoration:"none"}}>
        <strong>{name}</strong><br/><small style={{opacity:.6}}>Open module →</small>
      </a>)}
    </section>

    <section style={{marginTop:30}}>
      <h2>Recent Releases</h2>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",marginTop:12,borderCollapse:"collapse"}}>
          <thead><tr><th align="left">Name</th><th>Status</th><th>Category</th><th>Created</th></tr></thead>
          <tbody>
            {releases.map(x=><tr key={x.id}>
              <td style={{padding:"12px 0"}}>{x.original_name}</td>
              <td>{x.status}</td>
              <td>{x.category||"—"}</td>
              <td>{new Date(x.created_at).toLocaleString()}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>
  </main>;
}
