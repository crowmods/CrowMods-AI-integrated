use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function RecoveryAutomation(){
  const [runs,setRuns]=useState([]);

  useEffect(()=>{
    fetch(`${API}/api/recovery/runs`)
      .then(r=>r.json())
      .then(data=>setRuns(data.runs||[]));
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / RECOVERY AUTOMATION</p>
      <h1>Recovery Verification</h1>

      <section style={{marginTop:30}}>
        {runs.map(run=><article key={run.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{run.state}</strong>
          <p>
            Confidence: {run.confidence}
          </p>
          <p>
            Healthy: {run.healthy_samples}
            {" · "}
            Unhealthy: {run.unhealthy_samples}
          </p>
          <small>
            Closure eligible: {String(run.closure_eligible)}
          </small>
        </article>)}
      </section>
    </div>
  </main>;
}
