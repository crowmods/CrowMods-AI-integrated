use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

function Metric({label,value}){
  return <article style={{
    padding:20,border:"1px solid #292932",borderRadius:14
  }}>
    <small style={{opacity:.6}}>{label}</small>
    <h2 style={{margin:"8px 0 0"}}>{value??"—"}</h2>
  </article>;
}

export default function Admin(){
  const [data,setData]=useState(null);
  const [queues,setQueues]=useState(null);
  const [error,setError]=useState("");

  async function load(){
    try{
      const [a,b]=await Promise.all([
        fetch(`${API}/api/admin/overview`),
        fetch(`${API}/api/admin/queues`)
      ]);
      if(!a.ok||!b.ok)throw new Error("API unavailable");
      setData(await a.json());
      setQueues(await b.json());
    }catch(e){
      setError(e.message);
    }
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#07070a",color:"#fff",padding:32
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / ADMIN</p>
      <h1>Command Center</h1>
      <p style={{opacity:.7}}>Unified operational overview.</p>

      {error&&<p style={{padding:14,border:"1px solid #633",borderRadius:10}}>{error}</p>}

      {data&&<>
        <section style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",
          gap:14,marginTop:28
        }}>
          <Metric label="Pending Releases" value={data.releases.pending_approval}/>
          <Metric label="Published Releases" value={data.releases.published}/>
          <Metric label="Telegram Queue" value={data.telegram.queued}/>
          <Metric label="Discord Queue" value={data.discord.queued}/>
          <Metric label="Open Escalations" value={data.community.open_escalations}/>
          <Metric label="Users" value={data.users.total_users}/>
          <Metric label="Premium Users" value={data.premium.premium_users}/>
          <Metric label="30d Views" value={data.analytics30d.views}/>
          <Metric label="30d Downloads" value={data.analytics30d.downloads}/>
        </section>

        <section style={{marginTop:36}}>
          <h2>Operations</h2>
          <div style={{display:"grid",gap:12}}>
            <article style={{padding:18,border:"1px solid #292932",borderRadius:14}}>
              <strong>Telegram</strong>
              <p>Queued: {data.telegram.queued} · Failed: {data.telegram.failed}</p>
            </article>
            <article style={{padding:18,border:"1px solid #292932",borderRadius:14}}>
              <strong>Discord</strong>
              <p>Queued: {data.discord.queued} · Failed: {data.discord.failed}</p>
            </article>
            <article style={{padding:18,border:"1px solid #292932",borderRadius:14}}>
              <strong>Community</strong>
              <p>Open escalations: {data.community.open_escalations}</p>
            </article>
          </div>
        </section>

        <section style={{marginTop:36}}>
          <h2>Revenue</h2>
          <article style={{padding:18,border:"1px solid #292932",borderRadius:14}}>
            <strong>{data.revenue.currency}</strong>
            <p>{Number(data.revenue.revenue_minor||0)/100}</p>
          </article>
        </section>
      </>}

      {queues&&<section style={{marginTop:36}}>
        <h2>Attention Queue</h2>
        {queues.escalations.map(x=><article key={x.id}
          style={{padding:16,border:"1px solid #292932",borderRadius:12,marginTop:10}}>
          <strong>{x.severity}</strong> — {x.reason}
        </article>)}
      </section>}
    </div>
  </main>;
}
