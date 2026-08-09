use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function Account(){
  const [token,setToken]=useState("");
  const [user,setUser]=useState(null);

  useEffect(()=>{
    const saved=localStorage.getItem("crowmods_session");
    if(saved){
      setToken(saved);
      fetch(`${API}/api/account/me`,{
        headers:{Authorization:`Bearer ${saved}`}
      }).then(r=>r.json()).then(d=>setUser(d.user||null));
    }
  },[]);

  async function logout(){
    if(!token)return;
    await fetch(`${API}/api/auth/logout`,{
      method:"POST",
      headers:{Authorization:`Bearer ${token}`}
    });
    localStorage.removeItem("crowmods_session");
    setToken("");
    setUser(null);
  }

  if(!user)return <main style={{padding:40,color:"#fff",background:"#08080b",minHeight:"100vh"}}>
    <h1>Account</h1>
    <p>Sign in to view your account.</p>
  </main>;

  return <main style={{padding:40,color:"#fff",background:"#08080b",minHeight:"100vh"}}>
    <div style={{maxWidth:700,margin:"0 auto"}}>
      <p style={{opacity:.6}}>CROWMODS ACCOUNT</p>
      <h1>{user.displayName||user.email}</h1>
      <p>{user.email}</p>
      <p>Role: {user.role}</p>
      <p>Premium: {user.premium?"Active":"Free"}</p>
      {user.premiumUntil&&<p>Premium until: {new Date(user.premiumUntil).toLocaleString()}</p>}
      <button onClick={logout} style={{padding:"12px 18px",marginTop:20}}>Log out</button>
    </div>
  </main>;
}
