function normalize(text){
  return String(text||"").trim().toLowerCase();
}

function findFaq(message,faqs){
  const text=normalize(message);
  let best=null;
  let bestScore=0;

  for(const faq of faqs){
    const terms=[
      faq.question,
      ...(Array.isArray(faq.keywords)?faq.keywords:[])
    ].map(normalize);

    let score=0;
    for(const term of terms){
      if(term && text.includes(term))score++;
    }

    if(score>bestScore){
      bestScore=score;
      best=faq;
    }
  }

  return best ? {faq:best,score:bestScore} : null;
}

function moderationSignals(text){
  const t=normalize(text);
  const signals=[];

  if(/password|seed phrase|private key|api key|token/.test(t))
    signals.push({type:"sensitive_data",severity:"HIGH"});

  if(/refund|payment|charge|money/.test(t))
    signals.push({type:"financial_support",severity:"MEDIUM"});

  if(/bug|crash|not working|error/.test(t))
    signals.push({type:"technical_support",severity:"MEDIUM"});

  return signals;
}

function buildDraft(message,faqMatch){
  if(faqMatch){
    return {
      replyText:faqMatch.faq.answer,
      confidence:Math.min(.95,.55+faqMatch.score*.12),
      reason:"Matched an approved FAQ."
    };
  }

  return {
    replyText:"Thanks for reaching out. We’ve received your message and will review it.",
    confidence:.42,
    reason:"No approved FAQ match; human review recommended."
  };
}

module.exports={findFaq,moderationSignals,buildDraft};
