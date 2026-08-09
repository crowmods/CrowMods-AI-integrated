use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function BrokerOperations(){
  const [topics,setTopics]=useState([]);
  const [assignments,setAssignments]=useState([]);
  const [workers,setWorkers]=useState([]);
  const [scale,setScale]=useState(null);

  async function load(){
    const [t,a,w,s]=await Promise.all([
      fetch(`${API}/api/broker/topics`).then(r=>r.json()),
      fetch(`${API}/api/broker/assignments`).then(r=>r.json()),
      fetch(`${API}/api/broker/workers`).then(r=>r.json()),
      fetch(`${API}/api/broker/scaling`).then(r=>r.json())
    ]);

    setTopics(t.topics||[]);
    setAssignments(a.assignments||[]);
    setWorkers(w.workers||[]);
    setScale(s);
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / BROKER OPS</p>
      <h1>Broker & Worker Coordination</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        <article style={{padding:16,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Topics</strong>
          <h2>{topics.length}</h2>
        </article>
        <article style={{padding:16,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Assignments</strong>
          <h2>{assignments.length}</h2>
        </article>
        <article style={{padding:16,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Workers</strong>
          <h2>{workers.length}</h2>
        </article>
        <article style={{padding:16,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>Lag Signal</strong>
          <h2>{scale?.signal?.action||"—"}</h2>
        </article>
      </section>

      <section style={{marginTop:30}}>
        <h2>Topics</h2>
        {topics.map(t=><article key={t.topic}
          style={{padding:14,border:"1px solid #292932",
          borderRadius:12,marginTop:8}}>
          {t.topic} · {t.partitions} partitions
        </article>)}
      </section>
    </div>
  </main>;
}
