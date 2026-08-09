use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function CapacityVerification(){
  const [runs,setRuns]=useState([]);

  useEffect(()=>{
    fetch(`${API}/api/autoscaling/verification`)
      .then(r=>r.json())
      .then(data=>setRuns(data.verifications||[]));
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / VERIFICATION</p>
      <h1>Scaling Verification</h1>

      <section style={{marginTop:30}}>
        {runs.map(run=><article key={run.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{run.status}</strong>
          <p>
            Workers: {run.observed_workers}/{run.expected_workers}
          </p>
          <p>
            Lag: {run.lag_before} → {run.lag_after}
          </p>
          <small>{run.reason}</small>
        </article>)}
      </section>
    </div>
  </main>;
}
