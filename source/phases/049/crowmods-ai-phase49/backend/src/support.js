function classifyTicket(message=""){
  const text=String(message).toLowerCase();

  if(/chargeback|fraud|account takeover|security incident/.test(text))
    return {category:"SECURITY",priority:"URGENT",confidence:0.92};

  if(/payment|refund|billing|subscription/.test(text))
    return {category:"BILLING",priority:"HIGH",confidence:0.9};

  if(/bug|crash|error|not working/.test(text))
    return {category:"TECHNICAL",priority:"HIGH",confidence:0.86};

  if(/how|where|what|help/.test(text))
    return {category:"GENERAL",priority:"NORMAL",confidence:0.72};

  return {category:"GENERAL",priority:"NORMAL",confidence:0.45};
}

function answerDraft(ticket){
  return {
    text:
      "Thanks for contacting CrowMods Support. We received your request and will review it. If additional information is needed, we'll ask for it.",
    requiresHumanReview:
      ticket.priority==="URGENT"||ticket.category==="SECURITY"
  };
}

const TEMPLATES={
  WELCOME:{
    subject:"Welcome to CrowMods",
    body:"Welcome to CrowMods. Your account is ready."
  },
  TRIAL_ENDING:{
    subject:"Your CrowMods trial is ending",
    body:"Your trial period is approaching its end. Review your plan if you want continued access."
  },
  PAYMENT_FAILED:{
    subject:"Action needed for your CrowMods subscription",
    body:"We couldn't confirm your latest subscription payment. Please check your payment provider."
  },
  GRACE_PERIOD:{
    subject:"Your CrowMods subscription is in its grace period",
    body:"Your subscription is temporarily in a grace period. Please resolve the payment issue to keep access."
  },
  CANCELLATION:{
    subject:"Your CrowMods cancellation is confirmed",
    body:"Your cancellation request has been recorded. Access will follow your subscription terms."
  },
  REACTIVATED:{
    subject:"Your CrowMods subscription is active again",
    body:"Your subscription has been reactivated successfully."
  }
};

module.exports={classifyTicket,answerDraft,TEMPLATES};
