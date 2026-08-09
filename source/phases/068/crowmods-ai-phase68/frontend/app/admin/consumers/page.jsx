use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Consumers(){
  const [consumers,setConsumers]=useState([]);
  const [dlq,setDlq]=useState([]);

  async function load(){
    const [a,b]=await Promise.all([
      fetch(`${API}/api/consumers`).then(r=>r.json()),
      fetch(`${API}/api/consumers/dlq`).then(r=>r.json())
    ]);

    setConsumers(a.consumers||[]);
    setDlq(b.deadLetters||[]);
  }

  useEffect(()=>{load()},[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / CONSUMERS</p>
      <h1>Consumer Operations</h1>

      <section style={{marginTop:30}}>
        <h2>Consumer Groups</h2>

        {consumers.map(item=><article key={item.name}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{item.name}</strong>
          <p>Topic: {item.topic}</p>
          <small>Offset: {item.last_event_stream_id||0}</small>
        </article>)}
      </section>

      <section style={{marginTop:30}}>
        <h2>Pending Dead Letters</h2>
        <p>{dlq.length} pending</p>

        {dlq.map(item=><article key={item.id}
          style={{padding:14,border:"1px solid #292932",
          borderRadius:12,marginTop:8}}>
          Event: {item.event_id}
          <br/>
          Consumer: {item.consumer_group}
        </article>)}
      </section>
    </div>
  </main>;
}
