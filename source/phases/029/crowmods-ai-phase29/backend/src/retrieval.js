function terms(text){
  return [...new Set(
    String(text||"")
      .toLowerCase()
      .replace(/[^a-z0-9\s.-]/g," ")
      .split(/\s+/)
      .filter(x=>x.length>=3)
  )];
}

function scoreChunk(query,chunk){
  const q=terms(query);
  const haystack=String(chunk.content||"").toLowerCase();
  const keywords=(chunk.keywords||[]).map(x=>String(x).toLowerCase());

  let score=0;
  for(const t of q){
    if(haystack.includes(t))score+=1;
    if(keywords.includes(t))score+=2;
  }
  return score;
}

function retrieve(query,chunks,limit=5){
  return chunks
    .map(c=>({...c,score:scoreChunk(query,c)}))
    .filter(c=>c.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0,limit);
}

function buildGroundedAnswer(question,sources){
  if(!sources.length){
    return {
      answer:"I couldn't find a verified answer in the CrowMods knowledge base.",
      confidence:0.15,
      requiresEscalation:true
    };
  }

  const strongest=sources[0];
  return {
    answer:`Based on the verified knowledge source "${strongest.title}", please review the relevant documented information before taking action.`,
    confidence:Math.min(.9,.35+strongest.score*.08),
    requiresEscalation:strongest.score<2,
    citations:sources.map(x=>({
      documentId:x.document_id,
      title:x.title,
      sourceRef:x.source_ref||null
    }))
  };
}

module.exports={retrieve,buildGroundedAnswer};
