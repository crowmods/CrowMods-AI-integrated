function money(amountMinor,currency){
  return {
    amountMinor:String(amountMinor),
    currency:String(currency||"").toUpperCase()
  };
}

function lifecycle(events){
  const counts={
    checkoutStarted:0,
    paid:0,
    refunded:0,
    failed:0
  };

  for(const e of events){
    if(e.event_type==="CHECKOUT_STARTED")counts.checkoutStarted++;
    if(e.event_type==="PAYMENT_SUCCEEDED")counts.paid++;
    if(e.event_type==="REFUND")counts.refunded++;
    if(e.event_type==="PAYMENT_FAILED")counts.failed++;
  }

  return counts;
}

function recommendations(metrics){
  const out=[];

  if(metrics.checkoutStarted>0 && metrics.paid===0)
    out.push("Review checkout configuration and payment-provider errors.");

  if(metrics.failed>metrics.paid && metrics.failed>0)
    out.push("Investigate payment failures before changing pricing.");

  if(metrics.refunded>0)
    out.push("Review refund reasons and product expectations.");

  if(!out.length)
    out.push("Collect more lifecycle data before changing monetization.");

  return out;
}

module.exports={money,lifecycle,recommendations};
