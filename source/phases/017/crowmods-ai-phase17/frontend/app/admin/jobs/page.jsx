use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Jobs(){
  const [jobs,setJobs]=useState([]);
  const [error,setError]=useState("");

  async function load(){
    try{
      const r=await fetch(`${API}/api/jobs?limit=50`);
      const d=await r.json();
      setJobs(d.jobs||[]);
    }catch(e){
      setError("Job service unavailable.");
    }
  }

  useEffect(()=>{
    load();
    const id=setInterval(load,5000);
    return()=>clearInterval(id);
  },[]);

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:32}}>
    <h1>CrowMods AI — Job Queue</h1>
    <p>Asynchronous processing and publishing pipeline.</p>
    {error&&<p>{error}</p>}
    <div style={{display:"grid",gap:10,marginTop:24}}>
      {jobs.map(job=><article key={job.id} style={{border:"1px solid #292932",borderRadius:12,padding:16}}>
        <strong>{job.job_type}</strong>
        <p>Status: {job.status} · Attempts: {job.attempts}/{job.max_attempts}</p>
        <small>{job.id}</small>
        {job.last_error&&<p>Error: {job.last_error}</p>}
      </article>)}
      {!jobs.length&&<p>No jobs yet.</p>}
    </div>
  </main>;
}
