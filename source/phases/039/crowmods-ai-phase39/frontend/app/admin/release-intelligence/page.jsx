use client";

import {useState} from "react";

const API="http://localhost:4000";

export default function ReleaseIntelligence(){
  const [facts,setFacts]=useState({
    appName:"Example App",
    packageName:"com.example.app",
    versionName:"1.0.0",
    versionCode:"1",
    category:"Apps",
    isApp:true,
    isGame:false,
    verifiedFacts:["Version supplied by uploader"],
    compatibility:["Android"],
    changelog:["Release information supplied for review"],
    releaseUrl:"https://example.com/release"
  });
  const [result,setResult]=useState(null);

  async function preview(){
    const r=await fetch(`${API}/api/releases/intelligence/preview`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(facts)
    });
    setResult(await r.json());
  }

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / RELEASE INTELLIGENCE</p>
      <h1>AI Release Intelligence</h1>
      <p style={{opacity:.7}}>
        Turn verified facts into reviewable release metadata and social drafts.
      </p>

      <textarea
        value={JSON.stringify(facts,null,2)}
        onChange={e=>{
          try{setFacts(JSON.parse(e.target.value))}catch{}
        }}
        style={{
          width:"100%",minHeight:360,marginTop:24,padding:16,
          background:"#101014",color:"#fff",border:"1px solid #292932",
          borderRadius:14,fontFamily:"monospace"
        }}
      />

      <button onClick={preview}
        style={{padding:"12px 18px",marginTop:12}}>
        Generate Intelligence
      </button>

      {result&&<pre style={{
        marginTop:24,padding:18,border:"1px solid #292932",
        borderRadius:14,whiteSpace:"pre-wrap",overflow:"auto"
      }}>{JSON.stringify(result,null,2)}</pre>}
    </div>
  </main>;
}
