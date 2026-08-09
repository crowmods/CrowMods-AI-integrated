use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

const STATES=[
  "TRIALING","ACTIVE","PAST_DUE",
  "PAUSED","CANCELLED","EXPIRED"
];

export default function Subscriptions(){
  const [data,setData]=useState(null);

  async function load(){
    const r=await fetch(`${API}/api/subscriptions/overview`);
    setData(await r.json());
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / CUSTOMERS</p>
      <h1>Subscription Lifecycle</h1>
      <p style={{opacity:.7}}>
        Subscription state, entitlement and payment lifecycle.
      </p>

      {data&&<section style={{
        display:"grid",gridTemplateColumns:"repeat(3,1fr)",
        gap:12,marginTop:30
      }}>
        {STATES.map(state=><div key={state}
          style={{padding:18,border:"1px solid #292932",borderRadius:12}}>
          <small>{state}</small>
          <h2>{data.states?.[state]||0}</h2>
        </div>)}
      </section>}

      <section style={{marginTop:36}}>
        <h2>Lifecycle</h2>
        <p>Trial → Active → Renewal</p>
        <p>Payment failure → Past Due → Grace Period → Active / Expired</p>
        <p>Cancel → End of Period → Expired → Optional Reactivation</p>
      </section>
    </div>
  </main>;
}
