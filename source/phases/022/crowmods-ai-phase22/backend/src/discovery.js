function scoreRelease(release) {
  const downloads=Math.log10(Number(release.download_count||0)+1);
  const views=Math.log10(Number(release.view_count||0)+1);
  const freshness=release.published_at
    ? Math.max(0,30-(Date.now()-new Date(release.published_at).getTime())/86400000)
    : 0;

  return downloads*5 + views*2 + freshness;
}

function rankReleases(rows) {
  return rows
    .map(r=>({...r,discovery_score:scoreRelease(r)}))
    .sort((a,b)=>b.discovery_score-a.discovery_score);
}

module.exports={scoreRelease,rankReleases};
