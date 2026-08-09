function buildIdentity({
  subject,
  provider,
  roles=[],
  expiresAt=null
}){
  if(!subject||!provider)
    throw new Error("subject and provider are required");

  return {
    subject,
    provider,
    roles:[...new Set(roles)],
    expiresAt
  };
}

function isExpired(identity,now=new Date()){
  if(!identity.expiresAt) return false;
  return Date.parse(identity.expiresAt)<=
    new Date(now).getTime();
}

function hasRole(identity,role){
  return identity.roles.includes(role);
}

function requireAuthenticated(identity,now=new Date()){
  return Boolean(identity)&&
    Boolean(identity.subject)&&
    !isExpired(identity,now);
}

module.exports={
  buildIdentity,
  isExpired,
  hasRole,
  requireAuthenticated
};
