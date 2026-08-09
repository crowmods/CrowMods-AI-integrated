use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Autoscaling(){
  const [actions,setActions]=useState([]);

  useEffect(()=>{
    fetch(`${API}/api/autoscaling/operations`)
      .then(r=>r.json())
      .then(data=>setActions(data.actions||[]));
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / AUTOSCALING</p>
      <h1>Autoscaling Controller</h1>

      <section style={{marginTop:30}}>
        <h2>Recent Scaling Actions</h2>

        {actions.map(action=><article key={action.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{action.consumer_group}</strong>
          <p>
            {action.action} · {action.current_workers}
            {" → "}
            {action.requested_workers}
          </p>
          <small>
            Approval: {action.approval_status}
            {" · "}
            Execution: {action.execution_status}
          </small>
        </article>)}
      </section>
    </div>
  </main>;
}
