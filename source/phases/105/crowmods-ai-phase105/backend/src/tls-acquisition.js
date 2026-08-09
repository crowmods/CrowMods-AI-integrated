async function acquireCertificateMetadata({
  host,
  port=443,
  connector
}){
  if(!host)
    return {
      status:"BLOCKED",
      reason:"host_required"
    };

  if(!connector)
    return {
      status:"BLOCKED",
      reason:"tls_connector_not_configured"
    };

  try{
    const metadata=await connector({
      host,
      port
    });

    if(!metadata||!metadata.subject)
      return {
        status:"FAIL",
        reason:"certificate_metadata_missing"
      };

    return {
      status:"PASS",
      host,
      port,
      metadata
    };
  }catch{
    return {
      status:"FAIL",
      reason:"certificate_acquisition_failed"
    };
  }
}

module.exports={
  acquireCertificateMetadata
};
