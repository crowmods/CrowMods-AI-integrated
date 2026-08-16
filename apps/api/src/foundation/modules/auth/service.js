const { getRepository } = require("../../db");
const config = require("../../config/env");
const { hashPassword, verifyPassword, generateToken, hashToken } = require("../../lib/crypto");

async function login({ email, password, ip, userAgent }) {
  const repo = getRepository();
  const user = await repo.findUserByEmail(email);
  if (!user) {
    return { ok: false, code: "invalid_credentials", status: 401 };
  }
  if (user.status !== "ACTIVE") {
    return { ok: false, code: "account_suspended", status: 403 };
  }
  const valid = await verifyPassword(user.password_hash, password);
  if (!valid) {
    return { ok: false, code: "invalid_credentials", status: 401 };
  }
  const token = generateToken();
  const expiresAt = new Date(Date.now() + config.sessionTtlMs).toISOString();
  const session = await repo.createSession({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt,
    ip,
    userAgent
  });
  await repo.updateUser(user.id, { last_login_at: new Date().toISOString() });
  return {
    ok: true,
    token,
    expiresAt,
    user: serializeUser(user)
  };
}

async function logout(token, ip) {
  if (!token) return { ok: true };
  const repo = getRepository();
  const session = await repo.findSessionByToken(hashToken(token));
  if (session) {
    await repo.revokeSession(session.id);
    const user = await repo.findUserById(session.user_id);
    if (user) {
      await repo.createAuditLog({
        actorId: user.id, actorEmail: user.email,
        action: "ADMIN_LOGOUT", resource: "session", resourceId: session.id, ip
      });
    }
  }
  return { ok: true };
}

async function authenticateToken(token) {
  if (!token) return null;
  const repo = getRepository();
  const session = await repo.findSessionByToken(hashToken(token));
  if (!session) return null;
  if (session.revoked_at) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) return null;
  const user = await repo.findUserById(session.user_id);
  if (!user || user.status !== "ACTIVE") return null;
  return { ...serializeUser(user), sessionId: session.id };
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status
  };
}

async function createInitialAdmin(email, password, name = "Super Admin") {
  const repo = getRepository();
  if (await repo.findUserByEmail(email)) return null;
  const passwordHash = await hashPassword(password);
  const user = await repo.createUser({ email, name, passwordHash, role: "SUPER_ADMIN" });
  return user;
}

async function createUser({ email, name, password, role, status = "ACTIVE" }) {
  const repo = getRepository();
  if (await repo.findUserByEmail(email)) {
    const err = new Error("User already exists");
    err.status = 409;
    throw err;
  }
  const passwordHash = await hashPassword(password);
  return repo.createUser({ email, name, passwordHash, role, status });
}

async function listUsers() {
  const repo = getRepository();
  const users = await repo.listUsers();
  return users.map(serializeUser);
}

async function requestPasswordReset(email) {
  const repo = getRepository();
  const user = await repo.findUserByEmail(email);
  if (!user || user.status !== "ACTIVE") {
    return { ok: true };
  }
  const token = generateToken();
  const expiresAt = new Date(Date.now() + config.passwordResetTtlMs).toISOString();
  await repo.createPasswordReset({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt
  });
  return { ok: true, token };
}

async function resetPassword(token, newPassword) {
  const repo = getRepository();
  if (!token || !newPassword || newPassword.length < 8) {
    const err = new Error("Invalid token or password");
    err.status = 400;
    throw err;
  }
  const reset = await repo.findPasswordResetByToken(hashToken(token));
  if (!reset || reset.used_at) {
    const err = new Error("Invalid or used reset token");
    err.status = 400;
    throw err;
  }
  if (new Date(reset.expires_at).getTime() < Date.now()) {
    const err = new Error("Reset token has expired");
    err.status = 400;
    throw err;
  }
  const user = await repo.findUserById(reset.user_id);
  if (!user || user.status !== "ACTIVE") {
    const err = new Error("User not found");
    err.status = 400;
    throw err;
  }
  const passwordHash = await hashPassword(newPassword);
  await repo.updateUser(user.id, { password_hash: passwordHash, must_change_password: false });
  await repo.markPasswordResetUsed(reset.id);
  await repo.revokeUserSessions(user.id);
  await repo.createAuditLog({
    actorId: user.id, actorEmail: user.email, action: "PASSWORD_RESET", resource: "user", resourceId: user.id
  });
  return { ok: true };
}

module.exports = {
  login, logout, authenticateToken, createInitialAdmin, createUser, listUsers, serializeUser,
  requestPasswordReset, resetPassword
};