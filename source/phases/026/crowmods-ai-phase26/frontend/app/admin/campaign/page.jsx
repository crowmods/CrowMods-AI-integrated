use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

const platforms=[
  "telegram","discord","x","instagram","facebook",
  "reddit","youtube","whatsapp","linkedin"
];

export default function Campaign(){
  const [selected,setSelected]=useState(platforms);
  const [input,setInput]=useState({
    name:"CrowMods Release Campaign",
    title:"Example Release",
    description:"Verified release description.",
    releaseUrl:"https://example.com/apps/example"
  });
  const [preview,setPreview]=useState(null);
  const [campaigns,setCampaigns]=useState([]);

  function toggle(p){
    setSelected(x=>x.includes(p)?x.filter(y=>y!==p):[...x,p]);
  }

  async function generate(){
    const r=await fetch(`${API}/api/campaigns/preview`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({...input,platforms:selected})
    });
    setPreview(await r.json());
  }

  async function create(){
    await fetch(`${API}/api/campaigns`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({...input,platforms:selected})
    });
    load();
  }

  async function load(){
    const r=await fetch(`${API}/api/campaigns`);
    const d=await r.json();
    setCampaigns(d.campaigns||[]);
  }

  useEffect(()=>{load()},[]);

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:36}}>
    <h1>CrowMods AI — Campaign Studio</h1>
    <p>One release, multiple platform-specific drafts.</p>

    <div style={{display:"grid",gap:12,maxWidth:800,marginTop:24}}>
      <input value={input.name} onChange={e=>setInput({...input,name:e.target.value})}
        style={{padding:12}}/>
      <input value={input.title} onChange={e=>setInput({...input,title:e.target.value})}
        style={{padding:12}}/>
      <textarea value={input.description}
        onChange={e=>setInput({...input,description:e.target.value})}
        rows={4} style={{padding:12}}/>
      <input value={input.releaseUrl}
        onChange={e=>setInput({...input,releaseUrl:e.target.value})}
        style={{padding:12}}/>
    </div>

    <section style={{marginTop:24}}>
      <h2>Platforms</h2>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {platforms.map(p=><button key={p} onClick={()=>toggle(p)}
          style={{padding:"8px 12px",opacity:selected.includes(p)?1:.45}}>
          {p}
        </button>)}
      </div>
    </section>

    <div style={{display:"flex",gap:10,marginTop:24}}>
      <button onClick={generate} style={{padding:"12px 18px"}}>Preview All</button>
      <button onClick={create} style={{padding:"12px 18px"}}>Create Campaign</button>
    </div>

    {preview&&<pre style={{marginTop:24,padding:18,border:"1px solid #292932",borderRadius:14,whiteSpace:"pre-wrap",maxHeight:600,overflow:"auto"}}>
      {JSON.stringify(preview,null,2)}
    </pre>}

    <section style={{marginTop:36}}>
      <h2>Campaigns</h2>
      {campaigns.map(c=><article key={c.id}
        style={{marginTop:10,padding:16,border:"1px solid #292932",borderRadius:12}}>
        <strong>{c.name}</strong>
        <p>{c.status} · {c.target_count} platforms</p>
      </article>)}
    </section>
  </main>;
}
