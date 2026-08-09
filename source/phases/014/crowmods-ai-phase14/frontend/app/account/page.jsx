use client";

import {useState} from "react";

const API="http://localhost:4000";

export default function Account(){
  const [email,setEmail]=useState("");
  const [displayName,setDisplayName]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");

  async function register(){
    const r=await fetch(`${API}/api/users/register`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email,displayName,password})
    });
    const d=await r.json();
    setMessage(d.error || `Account created. User ID: ${d.user?.id}`);
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods Account</h1>
    <p>Create your account foundation.</p>
    <div style={{display:"grid",gap:12,maxWidth:480,marginTop:24}}>
      <input placeholder="Display name" value={displayName}
        onChange={e=>setDisplayName(e.target.value)} style={{padding:12}} />
      <input type="email" placeholder="Email" value={email}
        onChange={e=>setEmail(e.target.value)} style={{padding:12}} />
      <input type="password" placeholder="Password (12+ characters)"
        value={password} onChange={e=>setPassword(e.target.value)} style={{padding:12}} />
      <button onClick={register} style={{padding:"12px 18px"}}>Create Account</button>
    </div>
    {message&&<p style={{marginTop:20}}>{message}</p>}
  </main>;
}
