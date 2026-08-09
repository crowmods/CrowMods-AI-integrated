function buildEmbed({title,description,version,releaseUrl,features=[]}){
  return {
    title:String(title||"Release"),
    description:String(description||"").slice(0,4096),
    fields:[
      version ? {name:"Version",value:String(version).slice(0,1024),inline:true} : null,
      features.length ? {
        name:"Features",
        value:features.slice(0,8).map(x=>`• ${String(x)}`).join("\n").slice(0,1024),
        inline:false
      } : null
    ].filter(Boolean),
    footer:{text:"CrowMods"},
    url:releaseUrl||undefined
  };
}

function buildPayload(input){
  const embed=buildEmbed(input);
  return {
    content:input.content||"",
    embeds:[embed],
    components:input.releaseUrl ? [{
      type:1,
      components:[{
        type:2,
        style:5,
        label:"View Release",
        url:input.releaseUrl
      }]
    }] : []
  };
}

module.exports={buildEmbed,buildPayload};
