use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Resilience(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/resilience/operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / RESILIENCE</p>
      <h1>Resilience Scorecards</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",
        gap:12,marginTop:30
      }}>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Scheduled Exercises</strong>
          <h2>{data?.schedules??"—"}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Capacity Regions</strong>
          <h2>{data?.capacity?.length??"—"}</h2>
        </article>
        <article style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Score Grades</strong>
          <h2>{data?.scorecards?.length??"—"}</h2>
        </article>
      </section>

      <section style={{marginTop:30}}>
        {data?.capacity?.map(item=><article
          key={item.region_name}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{item.region_name}</strong>
          <p>
            Average resilience capacity score:
            {" "}
            {Number(item.avg_score||0).toFixed(3)}
          </p>
        </article>)}
      </section>
    </div>
  </main>;
}
