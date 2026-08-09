function validateEnvironment(env=process.env){
  const required=["DATABASE_URL"];
  const missing=required.filter(k=>!env[k]);

  return {
    valid:missing.length===0,
    missing
  };
}

module.exports={validateEnvironment};
