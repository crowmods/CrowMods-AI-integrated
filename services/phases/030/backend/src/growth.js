function pct(a,b){
  if(!b)return 0;
  return Math.round((a/b)*10000)/100;
}

function buildGrowthInsights(kpis){
  const insights=[];

  if(kpis.downloads>0 && kpis.views>0){
    const conversion=pct(kpis.downloads,kpis.views);
    insights.push({
      type:"DOWNLOAD_CONVERSION",
      value:conversion,
      message:`Website-view to download conversion is ${conversion}%.`,
      action:conversion<2
        ?"Review release-page clarity, trust signals and CTA placement."
        :"Continue testing release-page and campaign variants."
    });
  }

  if(kpis.campaignClicks>0 && kpis.campaignImpressions>0){
    const ctr=pct(kpis.campaignClicks,kpis.campaignImpressions);
    insights.push({
      type:"CAMPAIGN_CTR",
      value:ctr,
      message:`Campaign click-through rate is ${ctr}%.`,
      action:"Compare platform-specific headlines and approved creative variants."
    });
  }

  if(kpis.revenue>0){
    insights.push({
      type:"REVENUE",
      value:kpis.revenue,
      message:`Recorded revenue is ${kpis.revenue} ${kpis.currency}.`,
      action:"Review revenue sources and reinvest only from verified results."
    });
  }

  return insights;
}

module.exports={pct,buildGrowthInsights};
