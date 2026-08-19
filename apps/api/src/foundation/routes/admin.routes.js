const express = require("express");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const { login, logout, authenticateToken, createUser, listUsers, updateUser, deactivateUser, requestPasswordReset, resetPassword } = require("../modules/auth/service");
const { requirePermission } = require("../lib/rbac");
const audit = require("../modules/audit/service");
const notifications = require("../modules/notifications/service");
const uploads = require("../modules/uploads/service");
const validation = require("../modules/validation/service");
const releases = require("../modules/releases/service");
const publishing = require("../modules/publishing/service");
const { preview: websitePreview, publish: websitePublish } = require("../modules/publishing/website");
const { preview: telegramPreview } = require("../modules/publishing/telegram");
const { preview: discordPreview } = require("../modules/publishing/discord");
const jobs = require("../modules/jobs/service");
const customers = require("../modules/customers/service");
const plans = require("../modules/plans/service");
const analytics = require("../modules/analytics/service");
const health = require("../modules/health/service");
const integrations = require("../modules/integrations/service");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024, files: 1 }
});

function asyncHandler(fn) {
  return (req, res) => {
    Promise.resolve(fn(req, res)).catch(err => {
      const status = err.status || (err.code === "INVALID_TRANSITION" ? 409 : 500);
      res.status(status).json({
        error: err.code || "internal_error",
        message: status >= 500 ? "An internal error occurred." : err.message
      });
    });
  };
}

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress;
}

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => clientIp(req),
  message: { error: "rate_limited", message: "Too many login attempts. Try again later." }
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => clientIp(req),
  message: { error: "rate_limited", message: "Too many password reset requests. Try again later." }
});

router.get("/auth/me", authenticate, asyncHandler(async (req, res) => {
  res.json({ user: req.user || null });
}));

router.post("/auth/login", loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "invalid_request", message: "Email and password are required." });
  }
  const ip = clientIp(req);
  const result = await login({ email, password, ip, userAgent: req.headers["user-agent"] });
  if (!result.ok) {
    return res.status(result.status).json({ error: result.code, message: "Invalid credentials." });
  }
  await audit.log({
    actorId: result.user.id, actorEmail: result.user.email,
    action: "ADMIN_LOGIN", resource: "session", result: "SUCCESS", ip
  });
  res.json({ token: result.token, expiresAt: result.expiresAt, user: result.user });
}));

router.post("/auth/logout", asyncHandler(async (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  await logout(token, clientIp(req));
  res.json({ ok: true });
}));

router.post("/auth/password-reset/request", passwordResetLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "invalid_request", message: "Email is required." });
  }
  const result = await requestPasswordReset(email);
  res.json({ ok: result.ok, token: result.token });
}));

router.post("/auth/password-reset/confirm", asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  await resetPassword(token, password);
  res.json({ ok: true });
}));

router.use(authenticate);

async function authenticate(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const user = await authenticateToken(token);
  if (!user) {
    return res.status(401).json({ error: "unauthenticated", message: "Authentication required." });
  }
  req.user = user;
  next();
}

router.get("/dashboard", requirePermission("dashboard.read"), asyncHandler(async (req, res) => {
  res.json(await analytics.dashboard());
}));

router.get("/analytics", requirePermission("analytics.read"), asyncHandler(async (req, res) => {
  const days = Number(req.query.days || 30);
  res.json(await analytics.analytics({ days }));
}));

router.get("/system/health", requirePermission("dashboard.read"), asyncHandler(async (req, res) => {
  res.json(await health.check());
}));

router.get("/uploads", requirePermission("upload.read"), asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit || 50);
  const offset = Number(req.query.offset || 0);
  res.json({ uploads: await uploads.list({ limit, offset, status: req.query.status }) });
}));

router.post("/uploads", requirePermission("upload.create"), upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "missing_file", message: "A file is required." });
  const created = await uploads.create({
    buffer: req.file.buffer,
    originalFilename: req.file.originalname,
    mimeType: req.file.mimetype,
    customerId: req.body.customerId,
    userId: req.user.id,
    ip: clientIp(req)
  });
  res.status(201).json({ upload: created });
}));

router.get("/uploads/:id", requirePermission("upload.read"), asyncHandler(async (req, res) => {
  const upload = await uploads.get(req.params.id);
  res.json({ upload });
}));

router.post("/uploads/:id/validate", requirePermission("upload.create"), asyncHandler(async (req, res) => {
  const result = await validation.validateUpload(req.params.id, clientIp(req));
  res.json(result);
}));

router.delete("/uploads/:id", requirePermission("upload.delete"), asyncHandler(async (req, res) => {
  res.json(await uploads.remove(req.params.id, req.user.id, clientIp(req)));
}));

router.get("/releases", requirePermission("release.read"), asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit || 50);
  const offset = Number(req.query.offset || 0);
  res.json({
    releases: await releases.list({
      limit, offset, status: req.query.status,
      customerId: req.query.customerId, search: req.query.search
    })
  });
}));

router.post("/releases", requirePermission("release.create"), asyncHandler(async (req, res) => {
  const b = req.body || {};
  const created = await releases.create({
    customerId: b.customerId, uploadId: b.uploadId, name: b.name,
    description: b.description, version: b.version, versionCode: b.versionCode,
    packageName: b.packageName, visibility: b.visibility,
    createdBy: req.user.id, ip: clientIp(req), changelog: b.changelog
  });
  res.status(201).json({ release: created });
}));

router.get("/releases/:id", requirePermission("release.read"), asyncHandler(async (req, res) => {
  res.json(await releases.detail(req.params.id));
}));

router.patch("/releases/:id", requirePermission("release.update"), asyncHandler(async (req, res) => {
  const updated = await releases.update(req.params.id, req.body || {}, req.user.id, clientIp(req));
  res.json({ release: updated });
}));

router.post("/releases/:id/ready", requirePermission("release.update"), asyncHandler(async (req, res) => {
  res.json({ release: await releases.markReady(req.params.id, req.user.id, clientIp(req)) });
}));

router.post("/releases/:id/approve", requirePermission("release.approve"), asyncHandler(async (req, res) => {
  const reason = req.body?.reason || "";
  res.json({ release: await releases.approve(req.params.id, req.user.id, clientIp(req), reason) });
}));

router.post("/releases/:id/reject", requirePermission("release.reject"), asyncHandler(async (req, res) => {
  const reason = req.body?.reason || "";
  res.json({ release: await releases.reject(req.params.id, req.user.id, clientIp(req), reason) });
}));

router.post("/releases/:id/request-changes", requirePermission("release.reject"), asyncHandler(async (req, res) => {
  const reason = req.body?.reason || "";
  res.json({ release: await releases.requestChanges(req.params.id, req.user.id, clientIp(req), reason) });
}));

router.post("/releases/:id/publish", requirePermission("release.publish"), asyncHandler(async (req, res) => {
  const providers = (req.body?.providers || ["website"]).filter(Boolean);
  const jobs = await publishing.createJobs(req.params.id, providers, req.user.id, clientIp(req));
  const results = [];
  for (const job of jobs) {
    results.push(await publishing.processJob(job.id));
  }
  res.json({ jobs: results });
}));

router.post("/releases/:id/archive", requirePermission("release.update"), asyncHandler(async (req, res) => {
  res.json({ release: await releases.archive(req.params.id, req.user.id, clientIp(req)) });
}));

router.delete("/releases/:id", requirePermission("release.update"), asyncHandler(async (req, res) => {
  res.json(await releases.removeDraft(req.params.id, req.user.id, clientIp(req)));
}));

router.get("/releases/:id/preview", requirePermission("release.read"), asyncHandler(async (req, res) => {
  const { release, upload } = await releases.detail(req.params.id);
  res.json({
    website: await websitePreview(release, upload),
    telegram: telegramPreview(release, upload),
    discord: discordPreview(release, upload)
  });
}));

router.get("/publishing/jobs", requirePermission("job.read"), asyncHandler(async (req, res) => {
  res.json({
    jobs: await publishing.list({
      releaseId: req.query.releaseId, provider: req.query.provider,
      status: req.query.status, limit: Number(req.query.limit || 50), offset: Number(req.query.offset || 0)
    })
  });
}));

router.get("/publishing/:id", requirePermission("job.read"), asyncHandler(async (req, res) => {
  res.json(await publishing.get(req.params.id));
}));

router.post("/publishing/:id/retry", requirePermission("release.publish"), asyncHandler(async (req, res) => {
  res.json({ job: await publishing.retry(req.params.id, req.user.id, clientIp(req)) });
}));

router.get("/jobs", requirePermission("job.read"), asyncHandler(async (req, res) => {
  res.json({
    jobs: await jobs.list({
      type: req.query.type, status: req.query.status,
      limit: Number(req.query.limit || 50), offset: Number(req.query.offset || 0)
    })
  });
}));

router.get("/customers", requirePermission("customer.read"), asyncHandler(async (req, res) => {
  res.json({ customers: await customers.list({ search: req.query.search, status: req.query.status }) });
}));

router.post("/customers", requirePermission("customer.update"), asyncHandler(async (req, res) => {
  const b = req.body || {};
  res.status(201).json({ customer: await customers.create({ name: b.name, email: b.email, status: b.status, planCode: b.planCode }) });
}));

router.get("/customers/:id", requirePermission("customer.read"), asyncHandler(async (req, res) => {
  res.json(await customers.releases(req.params.id, Number(req.query.limit || 50), Number(req.query.offset || 0)));
}));

router.patch("/customers/:id", requirePermission("customer.update"), asyncHandler(async (req, res) => {
  res.json({ customer: await customers.update(req.params.id, req.body || {}, req.user.id, clientIp(req)) });
}));

router.get("/plans", requirePermission("plan.read"), asyncHandler(async (req, res) => {
  res.json({ plans: await plans.list() });
}));

router.get("/plans/:code", requirePermission("plan.read"), asyncHandler(async (req, res) => {
  res.json({ plan: await plans.getByCode(req.params.code) });
}));

router.get("/notifications", requirePermission("notification.read"), asyncHandler(async (req, res) => {
  res.json({ notifications: await notifications.list({ userId: req.user.id, unreadOnly: req.query.unread === "true", limit: 50 }) });
}));

router.post("/notifications/read-all", requirePermission("notification.read"), asyncHandler(async (req, res) => {
  res.json(await notifications.markAllRead(req.user.id));
}));

router.post("/notifications/:id/read", requirePermission("notification.read"), asyncHandler(async (req, res) => {
  res.json({ notification: await notifications.markRead(req.params.id) });
}));

router.get("/audit-logs", requirePermission("audit.read"), asyncHandler(async (req, res) => {
  res.json({
    logs: await audit.list({
      limit: Number(req.query.limit || 100), offset: Number(req.query.offset || 0),
      action: req.query.action, resource: req.query.resource
    })
  });
}));

router.get("/integrations", requirePermission("integration.manage"), asyncHandler(async (req, res) => {
  res.json({ integrations: await integrations.list() });
}));

router.post("/integrations", requirePermission("integration.manage"), asyncHandler(async (req, res) => {
  const b = req.body || {};
  res.status(201).json({ integration: await integrations.connect({ provider: b.provider, name: b.name, config: b.config, targetId: b.targetId }, req.user.id, clientIp(req)) });
}));

router.post("/integrations/:provider/test", requirePermission("integration.manage"), asyncHandler(async (req, res) => {
  res.json(await integrations.test(req.params.provider));
}));

router.post("/integrations/:id/disconnect", requirePermission("integration.manage"), asyncHandler(async (req, res) => {
  res.json(await integrations.disconnect(req.params.id, req.user.id, clientIp(req)));
}));

router.get("/users", requirePermission("user.manage"), asyncHandler(async (req, res) => {
  res.json({ users: await listUsers() });
}));

router.post("/users", requirePermission("user.manage"), asyncHandler(async (req, res) => {
  const b = req.body || {};
  const user = await createUser({ email: b.email, name: b.name, password: b.password, role: b.role || "VIEWER", status: b.status });
  await audit.log({
    actorId: req.user.id, actorEmail: req.user.email, action: "USER_CREATED",
    resource: "user", resourceId: user.id, ip: clientIp(req)
  });
  res.status(201).json({ user });
}));

router.patch("/users/:id", requirePermission("user.manage"), asyncHandler(async (req, res) => {
  const b = req.body || {};
  const user = await updateUser(req.params.id, {
    email: b.email, name: b.name, role: b.role, status: b.status
  }, req.user.id);
  await audit.log({
    actorId: req.user.id, actorEmail: req.user.email, action: "USER_UPDATED",
    resource: "user", resourceId: user.id, ip: clientIp(req),
    metadata: { changes: Object.keys(b).filter(k => ["email", "name", "role", "status"].includes(k)) }
  });
  res.json({ user });
}));

router.delete("/users/:id", requirePermission("user.manage"), asyncHandler(async (req, res) => {
  const user = await deactivateUser(req.params.id, req.user.id);
  await audit.log({
    actorId: req.user.id, actorEmail: req.user.email, action: "USER_DEACTIVATED",
    resource: "user", resourceId: user.id, ip: clientIp(req)
  });
  res.json({ user });
}));

module.exports = { router, authenticate, loginLimiter, passwordResetLimiter };