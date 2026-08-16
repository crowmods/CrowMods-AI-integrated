const { getRepository } = require("../db");

const ROLE_RANK = { SUPER_ADMIN: 5, ADMIN: 4, OPERATOR: 3, SUPPORT: 2, VIEWER: 1 };

function requirePermission(key) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "unauthenticated", message: "Authentication required." });
    }
    const repo = getRepository();
    if (req.user.role === "SUPER_ADMIN") return next();
    const allowed = await repo.hasPermission(req.user.role, key);
    if (!allowed) {
      return res.status(403).json({ error: "forbidden", message: `Missing permission: ${key}` });
    }
    return next();
  };
}

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "unauthenticated", message: "Authentication required." });
    if ((ROLE_RANK[req.user.role] || 0) < (ROLE_RANK[minRole] || 0)) {
      return res.status(403).json({ error: "forbidden", message: `Requires role ${minRole} or above.` });
    }
    return next();
  };
}

module.exports = { requirePermission, requireRole, ROLE_RANK };