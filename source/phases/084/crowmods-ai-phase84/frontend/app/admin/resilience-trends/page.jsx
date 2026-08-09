use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function ResilienceTrends(){
  const [data,setData]=useState(null);
  const [alerts,setAlerts]=useState([]);

  useEffect(()=>{
    fetch(`${API}/api/resilience/operations`)
      .then(r=>r.json())
      .then(setData);

    fetch(`${API}/api/resilience/alerts`)
      .then(r=>r.json())
      .then(value=>setAlerts(value.alerts||[]));
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / RESILIENCE TRENDS</p>
      <h1>Resilience Forecasting</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:12,marginTop:30
      }}>
        {[
          ["Scheduled Jobs",data?.scheduledJobs],
          ["Exercise Runs",data?.exerciseRuns],
          ["Forecasts",data?.forecasts],
          ["Open Alerts",data?.openAlerts]
        ].map(([label,value])=><article key={label}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{label}</strong>
          <h2>{value??"—"}</h2>
        </article>)}
      </section>

      <section style={{marginTop:30}}>
        <h2>Recent Alerts</h2>
        {alerts.map(alert=><article key={alert.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{alert.severity}</strong>
          <p>{alert.message}</p>
        </article>)}
      </section>
    </div>
  </main>;
}
