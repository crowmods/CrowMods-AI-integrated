function safeEventName(value){
  return String(value||"").trim().toLowerCase().replace(/[^a-z0-9_.-]/g,"_").slice(0,100);
}

function funnel(events){
  const names=new Set(events.map(x=>x.event_name));

  return {
    visitors:events.filter(x=>x.event_name==="page_view").length,
    releaseViews:events.filter(x=>x.event_name==="release_view").length,
    downloads:events.filter(x=>x.event_name==="download").length,
    campaignClicks:events.filter(x=>x.event_name==="campaign_click").length,
    joins:events.filter(x=>x.event_name==="community_join").length,
    purchasers:events.filter(x=>x.event_name==="purchase").length,
    hasActivity:names.size>0
  };
}

function recommendations(metrics){
  const suggestions=[];

  if(metrics.downloads===0 && metrics.releaseViews>0)
    suggestions.push("Review release-page download UX and verify download availability.");

  if(metrics.campaignClicks>0 && metrics.downloads<metrics.campaignClicks)
    suggestions.push("Compare campaign promise, landing-page copy and download conversion.");

  if(metrics.joins>metrics.downloads)
    suggestions.push("Community conversion is strong; consider improving release discovery.");

  if(!suggestions.length)
    suggestions.push("Collect more data before making major growth changes.");

  return suggestions;
}

module.exports={safeEventName,funnel,recommendations};
