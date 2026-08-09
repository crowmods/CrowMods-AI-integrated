use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Monetization(){
  const [data,setData]=useState(null);

  async function load(){
    const r=await fetch(`${API}/api/monetization/overview`);
    setData(await r.json());
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / REVENUE</p>
      <h1>Revenue & Monetization</h1>
      <p style={{opacity:.7}}>
        Provider-neutral revenue lifecycle dashboard.
      </p>

      {data&&<>
        <section style={{
          display:"grid",gridTemplateColumns:"repeat(4,1fr)",
          gap:12,marginTop:28
        }}>
          {[
            ["Checkout Started",data.lifecycle?.checkoutStarted],
            ["Paid",data.lifecycle?.paid],
            ["Refunded",data.lifecycle?.refunded],
            ["Failed",data.lifecycle?.failed]
          ].map(([label,value])=><div key={label}
            style={{padding:18,border:"1px solid #292932",borderRadius:12}}>
            <small>{label}</small>
            <h2>{value||0}</h2>
          </div>)}
        </section>

        <section style={{
          marginTop:18,padding:20,border:"1px solid #292932",
          borderRadius:12
        }}>
          <small>Gross revenue, last 30 days</small>
          <h2>{data.grossRevenueMinor||"0"} minor units</h2>
          <p>Successful payments: {data.successfulPayments||0}</p>
        </section>

        <section style={{marginTop:36}}>
          <h2>AI Recommendations</h2>
          {data.recommendations?.map((x,i)=><p key={i}>• {x}</p>)}
        </section>
      </>}
    </div>
  </main>;
}
