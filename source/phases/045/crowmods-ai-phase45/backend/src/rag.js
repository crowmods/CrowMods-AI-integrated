function chunkText(text,size=900){
  const clean=String(text||"").trim();
  if(!clean)return [];

  const words=clean.split(/\s+/);
  const chunks=[];

  for(let i=0;i<words.length;i+=size){
    chunks.push(words.slice(i,i+size).join(" "));
  }

  return chunks;
}

function buildGroundedPrompt(question,sources){
  const context=sources.map((s,i)=>
    `[SOURCE ${i+1}] ${s.title}\n${s.content}`
  ).join("\n\n");

  return {
    instruction:
      "Answer only using the supplied sources. If the sources do not support the answer, say that the information is unavailable and escalate.",
    question,
    context
  };
}

function confidence(sources){
  if(!sources.length)return 0;
  const verified=sources.filter(x=>x.trust_level==="VERIFIED").length;
  return Math.min(0.98,0.35+(verified/sources.length)*0.6);
}

module.exports={chunkText,buildGroundedPrompt,confidence};
