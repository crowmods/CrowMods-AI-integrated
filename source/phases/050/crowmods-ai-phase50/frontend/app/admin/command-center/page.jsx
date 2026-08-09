use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

const modules=[
  ["releases","Releases"],
  ["media","Media"],
  ["campaigns","Campaigns"],
  ["connectors","Connectors"],
  ["community","Community"],
  ["support","Support"],
  ["knowledge","Knowledge"],
  ["analytics","Analytics"],
  ["revenue","Revenue"],
  ["subscriptions","Subscriptions"]
];

export default function CommandCenter(){
  const [data,setData]=useState(null);
  const [health,setHealth]=useState(null);
  const [tasks,setTasks]=useState([]);

  async function load(){
    const [d,h,t]=await Promise.all([
      fetch(`${API}/api/control/dashboard`).then(r=>r.json()),
      fetch(`${API}/api/control/health`).then(r=>r.json()),
      fetch(`${API}/api/control/ai-tasks`).then(r=>r.json())
    ]);

    setData(d);
    setHealth(h);
    setTasks(t.tasks||[]);
  }

  async function createTask(type){
    await fetch(`${API}/api/control/ai-tasks`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        taskType:type,
        priority:"NORMAL",
        inputRef:{source:"command-center"}
      })
    });
    load();
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1400,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / COMMAND CENTER</p>
      <h1>AI Command Center</h1>
      <p style={{opacity:.7}}>
        One operational view across the CrowMods platform.
      </p>

      {health&&<section style={{
        padding:18,border:"1px solid #292932",
        borderRadius:14,marginTop:24
      }}>
        <strong>System: {health.summary?.overall}</strong>
        <p>
          Healthy: {health.summary?.healthy} ·
          Degraded: {health.summary?.degraded} ·
          Down: {health.summary?.down}
        </p>
      </section>}

      {data&&<section style={{
        display:"grid",gridTemplateColumns:"repeat(5,1fr)",
        gap:12,marginTop:18
      }}>
        {[
          ["Releases",data.releases],
          ["Campaigns",data.campaigns],
          ["Support",data.supportTickets],
          ["Subscriptions",data.activeSubscriptions],
          ["AI Tasks",data.pendingAITasks]
        ].map(([label,value])=><div key={label}
          style={{padding:18,border:"1px solid #292932",borderRadius:12}}>
          <small>{label}</small>
          <h2>{value||0}</h2>
        </div>)}
      </section>}

      <section style={{marginTop:36}}>
        <h2>Modules</h2>
        <div style={{
          display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10
        }}>
          {modules.map(([id,label])=><div key={id}
            style={{padding:16,border:"1px solid #292932",borderRadius:12}}>
            {label}
          </div>)}
        </div>
      </section>

      <section style={{marginTop:36}}>
        <h2>AI Task Queue</h2>
        <button onClick={()=>createTask("DAILY_GROWTH_SUMMARY")}
          style={{padding:"10px 16px"}}>
          Queue Growth Summary
        </button>

        {tasks.map(t=><article key={t.id}
          style={{padding:14,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{t.task_type}</strong>
          <p>{t.status} · {t.priority}</p>
        </article>)}
      </section>
    </div>
  </main>;
}
