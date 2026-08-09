use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function EventOperations(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/events/operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / EVENT PLATFORM</p>
      <h1>Event Operations</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:12,marginTop:30
      }}>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Registered Schemas</strong>
          <h2>{data?.schemas?.length||0}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Pending DLQ</strong>
          <h2>{data?.pendingDlq||0}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Replay States</strong>
          <h2>{data?.replays?.length||0}</h2>
        </article>
      </section>

      <section style={{marginTop:30}}>
        <h2>Event Schemas</h2>
        {data?.schemas?.map((s,i)=><article key={i}
          style={{padding:14,border:"1px solid #292932",
          borderRadius:12,marginTop:8}}>
          {s.event_type} · v{s.schema_version} · {s.compatibility}
        </article>)}
      </section>
    </div>
  </main>;
}
