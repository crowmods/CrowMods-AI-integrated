function validateContent(content, verified) {
  const issues=[];

  const required=["title","shortDescription","description","seoTitle","seoDescription"];
  for(const field of required){
    if(typeof content?.[field]!=="string" || !content[field].trim())
      issues.push({field,severity:"ERROR",message:`Missing ${field}`});
  }

  const serialized=JSON.stringify(content||{}).toLowerCase();
  const forbiddenClaims=[
    "100% safe",
    "undetectable",
    "guaranteed",
    "no ban",
    "hack-proof",
    "cannot be hacked"
  ];

  for(const phrase of forbiddenClaims){
    if(serialized.includes(phrase))
      issues.push({severity:"ERROR",message:`Unsupported claim: ${phrase}`});
  }

  if(verified?.versionName && content.title?.includes("undefined"))
    issues.push({severity:"ERROR",message:"Invalid generated title"});

  if((content?.seoDescription||"").length>160)
    issues.push({field:"seoDescription",severity:"WARNING",message:"SEO description is longer than recommended."});

  return {
    passed:!issues.some(x=>x.severity==="ERROR"),
    issues
  };
}

module.exports={validateContent};
