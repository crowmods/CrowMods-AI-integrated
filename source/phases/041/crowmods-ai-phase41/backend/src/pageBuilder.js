function slugify(value){
  return String(value||"release")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"")
    .slice(0,100)||"release";
}

function buildPage(intelligence,media=[]){
  const name=intelligence.app_name||"Release";
  const version=intelligence.version_name||"";
  const title=version?`${name} ${version}`:name;
  const slug=slugify(`${name}-${version}`);

  const gallery=media
    .filter(x=>x.status==="APPROVED")
    .map(x=>({
      assetId:x.id,
      objectKey:x.object_key,
      altText:x.alt_text
    }));

  const body=[
    intelligence.description||`${name} release information.`,
    intelligence.changelog?.length
      ?`Changelog: ${intelligence.changelog.join("; ")}`
      :null
  ].filter(Boolean).join("\n\n");

  const structuredData={
    "@context":"https://schema.org",
    "@type":intelligence.category==="Games"?"VideoGame":"SoftwareApplication",
    name,
    softwareVersion:version||undefined,
    applicationCategory:intelligence.category||undefined,
    description:intelligence.description||undefined
  };

  return {
    slug,
    title,
    summary:intelligence.description||"",
    body,
    versionName:intelligence.version_name||null,
    versionCode:intelligence.version_code||null,
    category:intelligence.category||null,
    tags:intelligence.tags||[],
    seoTitle:intelligence.seo_title||title,
    seoDescription:intelligence.seo_description||"",
    gallery,
    structuredData,
    download:{
      available:false,
      message:"Attach the approved release-storage signed URL at publish time."
    },
    relatedReleases:[]
  };
}

module.exports={slugify,buildPage};
