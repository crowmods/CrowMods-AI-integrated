export default function Account(){
  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",
    padding:"50px 24px",fontFamily:"system-ui"
  }}>
    <div style={{maxWidth:900,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS / ACCOUNT</p>
      <h1>Your Account</h1>

      <section style={{display:"grid",gap:12,marginTop:24}}>
        {[
          ["Profile","Manage account information"],
          ["Subscription","View plan and renewal"],
          ["Entitlements","View premium access"],
          ["Invoices","View provider invoice references"],
          ["Support","Create and track support tickets"],
          ["Notifications","Manage notification preferences"]
        ].map(([title,description])=><article key={title}
          style={{padding:18,border:"1px solid #292932",borderRadius:14}}>
          <h2>{title}</h2>
          <p style={{opacity:.7}}>{description}</p>
        </article>)}
      </section>

      <p style={{marginTop:30,opacity:.55}}>
        Authentication is required before loading private customer data.
      </p>
    </div>
  </main>;
}
