use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Releases(){
  const [data,setData]=useState(null);

  async function load(){
    const r=await fetch(`${API}/api/releases/dashboard`);
    setData(await r.json());
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1300,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / RELEASES</p>
      <h1>Progressive Release Dashboard</h1>

      <section style={{
        display:"grid",gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:24
      }}>
        {data?.stages?.map(stage=><article key={stage.name}
          style={{padding:18,border:"1px solid #292932",borderRadius:12}}>
          <strong>{stage.name}</strong>
          <p>{stage.trafficPercent}% traffic</p>
        </article>)}
      </section>

      <section style={{marginTop:36}}>
        <h2>Release Manifests</h2>
        {data?.releases?.map(release=><article key={release.id}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{release.release_version}</strong>
          <p>{release.status}</p>
          <small>Commit: {release.commit_sha}</small>
        </article>)}
      </section>
    </div>
  </main>;
}
