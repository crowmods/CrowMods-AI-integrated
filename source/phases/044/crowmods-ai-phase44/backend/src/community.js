const LABELS={
  QUESTION:"QUESTION",
  FEEDBACK:"FEEDBACK",
  BUG_REPORT:"BUG_REPORT",
  SUPPORT:"SUPPORT",
  SPAM:"SPAM",
  SAFETY:"SAFETY",
  OTHER:"OTHER"
};

function classify(text=""){
  const value=String(text).toLowerCase();

  if(/refund|payment|billing|purchase/.test(value))
    return {label:LABELS.SUPPORT,risk:0.2};

  if(/bug|error|crash|not working|broken/.test(value))
    return {label:LABELS.BUG_REPORT,risk:0.1};

  if(/how|where|what|when|can i|is there/.test(value))
    return {label:LABELS.QUESTION,risk:0.05};

  if(/free money|click here|crypto giveaway|airdrop/.test(value))
    return {label:LABELS.SPAM,risk:0.9};

  if(/threat|harm|attack|dox|exploit/.test(value))
    return {label:LABELS.SAFETY,risk:0.85};

  return {label:LABELS.OTHER,risk:0.1};
}

function suggestedAction(label,risk){
  if(risk>=0.8)return "ESCALATE_REVIEW";
  if(label==="QUESTION"||label==="SUPPORT")return "DRAFT_ANSWER";
  if(label==="BUG_REPORT")return "CREATE_SUPPORT_CASE";
  if(label==="SPAM")return "MODERATION_REVIEW";
  return "NO_ACTION";
}

function buildAnswerDraft(message){
  return {
    text:`Thanks for reaching out. Your message has been received and is being reviewed by the CrowMods team.`,
    requiresHumanApproval:true,
    source:"community-assistant"
  };
}

module.exports={LABELS,classify,suggestedAction,buildAnswerDraft};
