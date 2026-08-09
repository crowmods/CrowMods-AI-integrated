use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function ProviderCertification(){
  const [data,setData]=useState(null);

  useEffect(()=>{
    fetch(`${API}/api/providers/operations`)
      .then(r=>r.json())
      .then(setData);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / PROVIDERS</p>
      <h1>Provider Certification</h1>

      <section style={{marginTop:30}}>
        <h2>Recent Certifications</h2>

        {data?.certifications?.map(item=><article
          key={item.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>
            {item.certified?"CERTIFIED":"NOT CERTIFIED"}
          </strong>
          <p>
            KMS: {String(item.kms_ready)}
            {" · "}
            WORM: {String(item.worm_ready)}
          </p>
          <p>
            Retention: {String(item.retention_ready)}
            {" · "}
            Health: {String(item.health_checks_passed)}
          </p>
        </article>)}
      </section>

      <section style={{marginTop:30}}>
        <h2>DR Validation</h2>

        {data?.drValidations?.map(item=><article
          key={item.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>
            {item.passed?"PASS":"FAIL"}
          </strong>
          <p>{item.run_name}</p>
        </article>)}
      </section>
    </div>
  </main>;
}
