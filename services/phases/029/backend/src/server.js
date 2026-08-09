const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {Pool}=require("pg");
const {retrieve,buildGroundedAnswer}=require("./retrieval");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"2mb"}));

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

app.get("/health",(_req,res)=>res.json({ok:true,phase:29}));

app.post("/api/knowledge/documents",async(req,res)=>{
  const {title,content,sourceType="MANUAL",sourceRef=null,version=null}=req.body||{};
  if(!title||!content)return res.status(400).json({error:"title and content are required"});

  try{
    const client=await pool.connect();
    try{
      await client.query("BEGIN");

      const doc=(await client.query(`
        INSERT INTO knowledge_documents
          (title,content,source_type,source_ref,version,is_published)
        VALUES($1,$2,$3,$4,$5,FALSE)
        RETURNING *
      `,[title,content,sourceType,sourceRef,version])).rows[0];

      const pieces=String(content).match(/[\s\S]{1,900}/g)||[];
      for(let i=0;i<pieces.length;i++){
        const keywords=[...new Set(
          pieces[i].toLowerCase().replace(/[^a-z0-9\s]/g," ")
            .split(/\s+/).filter(x=>x.length>=4)
        )].slice(0,50);

        await client.query(`
          INSERT INTO knowledge_chunks(document_id,chunk_index,content,keywords)
          VALUES($1,$2,$3,$4)
        `,[doc.id,i,pieces[i],keywords]);
      }

      await client.query("COMMIT");
      res.status(201).json({document:doc,chunkCount:pieces.length});
    }catch(err){
      await client.query("ROLLBACK");
      throw err;
    }finally{
      client.release();
    }
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Could not create knowledge document"});
  }
});

app.post("/api/knowledge/ask",async(req,res)=>{
  const question=String(req.body?.question||"").trim();
  if(!question)return res.status(400).json({error:"question is required"});

  try{
    const {rows}=await pool.query(`
      SELECT c.id,c.document_id,c.content,c.keywords,
             d.title,d.source_ref
      FROM knowledge_chunks c
      JOIN knowledge_documents d ON d.id=c.document_id
      WHERE d.is_published=TRUE
    `);

    const sources=retrieve(question,rows,5);
    const answer=buildGroundedAnswer(question,sources);

    const q=(await pool.query(`
      INSERT INTO support_questions(question,answer_status,source_ids)
      VALUES($1,$2,$3)
      RETURNING *
    `,[
      question,
      answer.requiresEscalation?"UNRESOLVED":"ANSWERED",
      JSON.stringify(answer.citations||[])
    ])).rows[0];

    res.json({
      questionId:q.id,
      ...answer,
      sources:sources.map(x=>({
        id:x.id,title:x.title,score:x.score,content:x.content
      }))
    });
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Knowledge search failed"});
  }
});

app.get("/api/knowledge/unresolved",async(_req,res)=>{
  try{
    const {rows}=await pool.query(`
      SELECT * FROM support_questions
      WHERE answer_status='UNRESOLVED'
      ORDER BY created_at DESC LIMIT 100
    `);
    res.json({questions:rows});
  }catch{
    res.status(500).json({error:"Could not load unresolved questions"});
  }
});

if (!process.env.CROWMODS_INTEGRATED) app.listen(process.env.PORT||4000,()=>console.log("CrowMods Phase 29 Knowledge API running"));


module.exports = app;
