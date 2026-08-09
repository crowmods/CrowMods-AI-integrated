function pct(a,b){
  if(!b)return 0;
  return Math.round((a/b)*10000)/100;
}

function recommend(metrics){
  const rec=[];

  if(metrics.downloads > 0 && metrics.pageViews > 0){
    const conversion=pct(metrics.downloads,metrics.pageViews);
    if(conversion < 2){
      rec.push({
        type:"CONVERSION",
        priority:"HIGH",
        message:"Release pages have traffic but relatively low download conversion.",
        action:"Review page clarity, screenshots, CTA placement and release metadata."
      });
    }
  }

  if(metrics.socialClicks > metrics.downloads && metrics.socialClicks > 100){
    rec.push({
      type:"FUNNEL",
      priority:"MEDIUM",
      message:"Social traffic is high relative to downloads.",
      action:"Review landing-page speed and download flow."
    });
  }

  if(metrics.communityMembers > 100 && metrics.communityGrowth7d > 0){
    rec.push({
      type:"COMMUNITY",
      priority:"MEDIUM",
      message:"Community is growing.",
      action:"Prioritize release announcements and useful community updates."
    });
  }

  if(metrics.revenue7d > metrics.revenuePrev7d){
    rec.push({
      type:"REVENUE",
      priority:"LOW",
      message:"Revenue is trending upward.",
      action:"Identify the campaigns and traffic sources contributing to the increase."
    });
  }

  if(!rec.length){
    rec.push({
      type:"STATUS",
      priority:"LOW",
      message:"No major growth anomaly detected from the supplied metrics.",
      action:"Continue collecting clean data."
    });
  }

  return rec;
}

module.exports={recommend};
