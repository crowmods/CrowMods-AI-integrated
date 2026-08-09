use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function IncidentRecovery(){
  const [incidents,setIncidents]=useState([]);

  useEffect(()=>{
    fetch(`${API}/api/incidents/recovery/operations`)
      .then(r=>r.json())
      .then(data=>setIncidents(data.incidents||[]));
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / INCIDENT RECOVERY</p>
      <h1>Incident Closure Gates</h1>

      <section style={{marginTop:30}}>
        {incidents.map(item=><article key={item.incident_id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>Incident {item.incident_id}</strong>
          <p>
            Recovery: {String(item.recovery_verified)}
            {" · "}
            SLO: {String(item.slo_verified)}
          </p>
          <p>
            Timeline: {String(item.timeline_complete)}
            {" · "}
            Postmortem: {String(item.postmortem_evidence_complete)}
          </p>
          <small>
            Closure eligible: {String(item.closure_eligible)}
          </small>
        </article>)}
      </section>
    </div>
  </main>;
}
