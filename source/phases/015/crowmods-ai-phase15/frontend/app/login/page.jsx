use client";

import {useState} from "react";

const API="http://localhost:4000";

export default function Login(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");

  async function login(){
    const r=await fetch(`${API}/api/auth/login`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email,password})
    });
    const d=await r.json();
    if(d.accessToken){
      // Prototype only. Production should prefer secure HttpOnly SameSite cookies.
      sessionStorage.setItem("crowmods_access_token",d.accessToken);
      setMessage(`Logged in as ${d.user.email}`);
    }else{
      setMessage(d.error||"Login failed.");
    }
  }

  return <main style={{minHeight:"100vh",background:"#08080b",color:"#fff",padding:40}}>
    <h1>CrowMods Login</h1>
    <div style={{display:"grid",gap:12,maxWidth:420,marginTop:24}}>
      <input type="email" placeholder="Email" value={email}
        onChange={e=>setEmail(e.target.value)} style={{padding:12}}/>
      <input type="password" placeholder="Password" value={password}
        onChange={e=>setPassword(e.target.value)} style={{padding:12}}/>
      <button onClick={login} style={{padding:"12px 18px"}}>Sign in</button>
    </div>
    {message&&<p style={{marginTop:20}}>{message}</p>}
  </main>;
}
