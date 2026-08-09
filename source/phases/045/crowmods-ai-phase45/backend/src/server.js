const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {
  chunkText,buildGroundedPrompt,confidence
}=require("./rag");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"5mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

const topK=Number(process.env.RAG_TOP_K||5);

app.get("/health",(_req,res)=>res.json({
  ok:true,
  phase:45,
  service:"knowledge-rag"
}));

app.post("/api/knowledge/sources",async(req,res)=>{
  const {
    sourceType="DOCUMENT",
    title,
    canonicalUrl=null,
    sourceRef=null,
    content,
    trustLevel="VERIFIED"
  }=req.body||{};

  if(!title||!content)
    return res.status(400).json({error:"title and content are required"});

  const client=await pool.connect();

  try{
    await client.query("BEGIN");

    const source=(await client.query(`
      INSERT INTO knowledge_sources
        (source_type,title,canonical_url,source_ref,content,trust_level)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,[
      sourceType,title,canonicalUrl,sourceRef,content,trustLevel
    ])).rows[0];

    const chunks=chunkText(content);

    for(let i=0;i<chunks.length;i++){
      await client.query(`
        INSERT INTO knowledge_chunks
          (source_id,chunk_index,content,token_estimate)
        VALUES($1,$2,$3,$4)
      `,[
        source.id,i,chunks[i],Math.ceil(chunks[i].length/4)
      ]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      source,
      chunksCreated:chunks.length
    });
  }catch(err){
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({error:"Could not create knowledge source"});
  }finally{
    client.release();
  }
});

app.get("/api/knowledge/search",async(req,res)=>{
  const q=String(req.query.q||"").trim();

  if(!q)return res.status(400).json({error:"q is required"});

  try{
    const {rows}=await pool.query(`
      SELECT
        kc.id,
        kc.source_id,
        kc.content,
        ks.title,
        ks.canonical_url,
        ks.trust_level,
        ts_rank(kc.search_vector,plainto_tsquery('english',$1)) AS rank
      FROM knowledge_chunks kc
      JOIN knowledge_sources ks ON ks.id=kc.source_id
      WHERE ks.status='ACTIVE'
        AND kc.search_vector @@ plainto_tsquery('english',$1)
      ORDER BY rank DESC
      LIMIT $2
    `,[q,topK]);

    res.json({
      query:q,
      results:rows,
      confidence:confidence(rows)
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Knowledge search failed"});
  }
});

app.post("/api/knowledge/answer",async(req,res)=>{
  const question=String(req.body?.question||"").trim();

  if(!question)
    return res.status(400).json({error:"question is required"});

  try{
    const {rows}=await pool.query(`
      SELECT
        kc.id,
        kc.source_id,
        kc.content,
        ks.title,
        ks.canonical_url,
        ks.trust_level,
        ts_rank(kc.search_vector,plainto_tsquery('english',$1)) AS rank
      FROM knowledge_chunks kc
      JOIN knowledge_sources ks ON ks.id=kc.source_id
      WHERE ks.status='ACTIVE'
        AND kc.search_vector @@ plainto_tsquery('english',$1)
      ORDER BY rank DESC
      LIMIT $2
    `,[question,topK]);

    const minRank=Number(process.env.RAG_MIN_RANK||0.05);
    const sources=rows.filter(x=>Number(x.rank)>=minRank);
    const score=confidence(sources);

    const grounded=buildGroundedPrompt(question,sources);

    res.json({
      answer:null,
      status:sources.length?"GROUNDED_CONTEXT_READY":"INSUFFICIENT_CONTEXT",
      confidence:score,
      sources:sources.map(s=>({
        id:s.id,
        title:s.title,
        url:s.canonical_url,
        trustLevel:s.trust_level,
        rank:s.rank
      })),
      groundedPrompt:grounded,
      requiresHumanReview:score<0.7
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not build grounded answer"});
  }
});

app.get("/api/knowledge/sources",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT id,source_type,title,canonical_url,trust_level,status,
             created_at,updated_at
      FROM knowledge_sources
      ORDER BY created_at DESC LIMIT 200
    `);

    res.json({sources:rows});
  }catch{
    res.status(500).json({error:"Could not load knowledge sources"});
  }
});

app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 45 Knowledge API running"));
