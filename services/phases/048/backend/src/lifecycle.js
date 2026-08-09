const STATES=[
  "TRIALING","ACTIVE","PAST_DUE","PAUSED","CANCELLED","EXPIRED"
];

function entitlementStatus(subscription,now=new Date()){
  if(!subscription)return {active:false,reason:"NO_SUBSCRIPTION"};

  if(subscription.status==="ACTIVE"||subscription.status==="TRIALING")
    return {active:true,reason:subscription.status};

  if(subscription.status==="PAST_DUE"&&subscription.grace_period_end){
    if(new Date(subscription.grace_period_end)>now)
      return {active:true,reason:"GRACE_PERIOD"};
  }

  return {active:false,reason:subscription.status};
}

function transition(current,event){
  const map={
    CHECKOUT_COMPLETED:"ACTIVE",
    TRIAL_STARTED:"TRIALING",
    PAYMENT_SUCCEEDED:"ACTIVE",
    PAYMENT_FAILED:"PAST_DUE",
    SUBSCRIPTION_PAUSED:"PAUSED",
    SUBSCRIPTION_CANCELLED:"CANCELLED",
    SUBSCRIPTION_EXPIRED:"EXPIRED"
  };

  return map[event]||current;
}

function lifecycleSummary(rows){
  const result={};
  for(const state of STATES)result[state]=0;
  for(const row of rows){
    if(result[row.status]!==undefined)result[row.status]++;
  }
  return result;
}

module.exports={STATES,entitlementStatus,transition,lifecycleSummary};
