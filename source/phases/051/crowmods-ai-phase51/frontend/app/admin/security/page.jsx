use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Security(){
  const [data,setData]=useState(null);

  async function check(){
    const r=await fetch(`${API}/api/security/me`,{
      credentials:"include"
    });
    setData(await r.json());
  }

  useEffect(()=>{check()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / SECURITY</p>
      <h1>Zero-Trust Security Gateway</h1>
      <p style={{opacity:.7}}>
        Identity, session, permission and audit boundaries.
      </p>

      <section style={{
        marginTop:28,padding:20,border:"1px solid #292932",
        borderRadius:14
      }}>
        <h2>Authentication</h2>
        <pre style={{whiteSpace:"pre-wrap"}}>
          {JSON.stringify(data,null,2)}
        </pre>
      </section>

      <section style={{marginTop:24}}>
        <h2>Security Controls</h2>
        {[
          "OIDC/OAuth identity boundary",
          "MFA for privileged operations",
          "Server-side RBAC",
          "Secure session storage",
          "Step-up authentication",
          "Request correlation IDs",
          "Audit events",
          "Least-privilege permissions",
          "Provider secrets excluded from browser"
        ].map(x=><p key={x}>✓ {x}</p>)}
      </section>
    </div>
  </main>;
}
