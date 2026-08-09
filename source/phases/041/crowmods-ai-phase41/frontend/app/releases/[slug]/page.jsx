async function getPage(slug){
  const base=process.env.API_INTERNAL_URL||"http://localhost:4000";
  const r=await fetch(`${base}/api/release-pages/${slug}`,{
    cache:"no-store"
  });

  if(!r.ok)return null;
  return (await r.json()).page;
}

export default async function ReleasePage({params}){
  const page=await getPage(params.slug);

  if(!page){
    return <main style={{padding:40}}>
      <h1>Release not found</h1>
    </main>;
  }

  return <main style={{
    minHeight:"100vh",background:"#08080b",color:"#fff",
    padding:"50px 24px",fontFamily:"system-ui"
  }}>
    <article style={{maxWidth:900,margin:"0 auto"}}>
      <p style={{opacity:.55}}>CROWMODS</p>
      <h1>{page.title}</h1>
      <p>{page.summary}</p>

      <div style={{
        marginTop:28,padding:20,border:"1px solid #292932",
        borderRadius:14,whiteSpace:"pre-wrap"
      }}>
        {page.body}
      </div>

      <section style={{marginTop:28}}>
        <h2>Release</h2>
        <p>Version: {page.version_name||"Not specified"}</p>
        <p>Category: {page.category||"Not specified"}</p>
      </section>

      <section style={{marginTop:28}}>
        <button disabled={!page.download?.available}
          style={{padding:"13px 22px"}}>
          {page.download?.available?"Download":"Download unavailable"}
        </button>
      </section>
    </article>
  </main>;
}
