const TOOLS={
  "knowledge.search":{
    permission:"knowledge.read",
    risk:"LOW",
    execute:async(input)=>({
      type:"KNOWLEDGE_SEARCH_REQUEST",
      query:input.query||""
    })
  },

  "analytics.read":{
    permission:"analytics.read",
    risk:"LOW",
    execute:async(input)=>({
      type:"ANALYTICS_READ_REQUEST",
      rangeDays:input.rangeDays||30
    })
  },

  "support.draft":{
    permission:"support.write",
    risk:"LOW",
    execute:async(input)=>({
      type:"SUPPORT_DRAFT",
      draft:"Draft generated from approved support context.",
      ticketRef:input.ticketRef||null
    })
  },

  "campaign.draft":{
    permission:"campaigns.write",
    risk:"LOW",
    execute:async(input)=>({
      type:"CAMPAIGN_DRAFT",
      channels:input.channels||[],
      requiresApproval:true
    })
  },

  "release.validate":{
    permission:"releases.write",
    risk:"MEDIUM",
    execute:async(input)=>({
      type:"RELEASE_VALIDATION",
      valid:Boolean(input.releaseRef),
      releaseRef:input.releaseRef||null
    })
  },

  "release.publish":{
    permission:"releases.write",
    risk:"HIGH",
    requiresApproval:true,
    execute:async(input)=>({
      type:"RELEASE_PUBLISH_REQUEST",
      releaseRef:input.releaseRef||null
    })
  },

  "campaign.publish":{
    permission:"campaigns.write",
    risk:"HIGH",
    requiresApproval:true,
    execute:async(input)=>({
      type:"CAMPAIGN_PUBLISH_REQUEST",
      campaignRef:input.campaignRef||null
    })
  },

  "moderation.action":{
    permission:"community.moderate",
    risk:"HIGH",
    requiresApproval:true,
    execute:async(input)=>({
      type:"MODERATION_REQUEST",
      action:input.action||"REVIEW",
      memberRef:input.memberRef||null
    })
  }
};

function getTool(name){
  return TOOLS[name]||null;
}

function listTools(){
  return Object.entries(TOOLS).map(([name,tool])=>({
    name,
    permission:tool.permission,
    risk:tool.risk,
    requiresApproval:Boolean(tool.requiresApproval)
  }));
}

module.exports={getTool,listTools};
