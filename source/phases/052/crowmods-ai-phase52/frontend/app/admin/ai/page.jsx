use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function AICommand(){
  const [goal,setGoal]=useState("");
  const [workflows,setWorkflows]=useState([]);
  const [plan,setPlan]=useState(null);

  async function load(){
    const r=await fetch(`${API}/api/ai/workflows`);
    const d=await r.json();
    setWorkflows(d.workflows||[]);
  }

  async function planGoal(){
    const r=await fetch(`${API}/api/ai/workflows`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        goal,
        createdBy:"admin-command-center"
      })
    });
    const d=await r.json();
    setPlan(d);
    load();
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / ORCHESTRATOR</p>
      <h1>AI Operations</h1>
      <p style={{opacity:.7}}>
        Plan multi-step work with permission and approval gates.
      </p>

      <div style={{display:"flex",gap:10,marginTop:24}}>
        <input value={goal} onChange={e=>setGoal(e.target.value)}
          placeholder="Example: prepare a release campaign"
          style={{padding:12,flex:1}}/>
        <button onClick={planGoal} style={{padding:"12px 18px"}}>
          Create Plan
        </button>
      </div>

      {plan&&<section style={{
        marginTop:24,padding:18,border:"1px solid #292932",
        borderRadius:12
      }}>
        <h2>Generated Plan</h2>
        {plan.plan?.map((x,i)=><p key={i}>
          {i+1}. {x.agent} → {x.taskType}
          {x.approvalRequired?" · APPROVAL REQUIRED":""}
        </p>)}
      </section>}

      <section style={{marginTop:36}}>
        <h2>Workflows</h2>
        {workflows.map(w=><article key={w.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{w.goal}</strong>
          <p>{w.status}</p>
        </article>)}
      </section>
    </div>
  </main>;
}
