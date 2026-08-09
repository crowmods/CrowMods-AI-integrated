const crypto = require("crypto");
const argon2 = require("argon2");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createOpaqueToken() {
  return crypto.randomBytes(32).toString("base64url");
}

async function verifyPassword(hash, password) {
  return argon2.verify(hash, password);
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({error:"Authentication required."});
    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({error:"Insufficient permissions."});
    next();
  };
}

module.exports = {hashToken,createOpaqueToken,verifyPassword,requireRole};
