use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Dependencies(){
  const [graph,setGraph]=useState({
    nodes:[],edges:[]
  });

  useEffect(()=>{
    fetch(`${API}/api/dependencies/graph`)
      .then(r=>r.json())
      .then(setGraph);
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / SERVICE GRAPH</p>
      <h1>Service Dependency Graph</h1>

      <section style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",
        gap:12,marginTop:30
      }}>
        {graph.nodes.map(node=><article key={node}
          style={{padding:18,border:"1px solid #292932",
          borderRadius:12}}>
          <strong>{node}</strong>
          <p>Service</p>
        </article>)}
      </section>

      <section style={{marginTop:30}}>
        <h2>Dependencies</h2>
        {graph.edges.map((edge,i)=><article key={i}
          style={{padding:14,border:"1px solid #292932",
          borderRadius:12,marginTop:8}}>
          {edge.sourceService}
          {" → "}
          {edge.targetService}
          {" · "}
          {edge.criticality}
        </article>)}
      </section>
    </div>
  </main>;
}
