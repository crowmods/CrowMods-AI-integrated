use client";

import {useEffect,useState} from "react";

const API="http://localhost:4000";

export default function DRGameDay(){
  const [gamedays,setGamedays]=useState([]);

  useEffect(()=>{
    fetch(`${API}/api/gamedays`)
      .then(r=>r.json())
      .then(data=>setGamedays(data.gamedays||[]));
  },[]);

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",padding:36
  }}>
    <div style={{maxWidth:1250,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS AI / DR GAME DAYS</p>
      <h1>Recovery Exercises</h1>

      <section style={{marginTop:30}}>
        {gamedays.map(item=><article key={item.id}
          style={{padding:16,border:"1px solid #292932",
          borderRadius:12,marginTop:10}}>
          <strong>{item.name}</strong>
          <p>
            Environment: {item.environment}
            {" · "}
            Mode: {item.dry_run?"DRY RUN":"CONTROLLED"}
          </p>
          <p>Status: {item.status}</p>
        </article>)}
      </section>
    </div>
  </main>;
}
