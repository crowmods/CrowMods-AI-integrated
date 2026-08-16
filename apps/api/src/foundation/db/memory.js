const crypto = require("node:crypto");

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

class MemoryRepository {
  constructor() {
    this.users = [];
    this.sessions = [];
    this.passwordResets = [];
    this.roles = [];
    this.permissions = [];
    this.rolePermissions = [];
    this.plans = [];
    this.customers = [];
    this.subscriptions = [];
    this.uploads = [];
    this.scans = [];
    this.releases = [];
    this.releaseVersions = [];
    this.approvals = [];
    this.integrations = [];
    this.publishingJobs = [];
    this.publishingResults = [];
    this.jobs = [];
    this.notifications = [];
    this.auditLogs = [];
    this._seed();
  }

  _seed() {
    const roles = ["SUPER_ADMIN", "ADMIN", "OPERATOR", "SUPPORT", "VIEWER"];
    this.roles = roles.map(name => ({ id: uid(), name, description: "", created_at: now() }));

    const perms = [
      "dashboard.read", "release.read", "release.create", "release.update",
      "release.approve", "release.reject", "release.publish",
      "upload.read", "upload.create", "upload.delete",
      "customer.read", "customer.update", "analytics.read",
      "settings.read", "settings.update", "audit.read",
      "integration.manage", "user.manage", "notification.read", "job.read", "plan.read"
    ];
    this.permissions = perms.map(key => ({ id: uid(), key, description: "", created_at: now() }));

    const map = {};
    for (const p of this.permissions) map[p.key] = p.id;

    const rolePerms = {
      SUPER_ADMIN: perms,
      ADMIN: ["dashboard.read", "release.read", "release.create", "release.update", "release.approve", "release.reject", "release.publish", "upload.read", "upload.create", "customer.read", "analytics.read", "settings.read", "settings.update", "audit.read", "integration.manage", "notification.read", "job.read", "plan.read"],
      OPERATOR: ["dashboard.read", "release.read", "release.create", "release.update", "upload.read", "upload.create", "notification.read", "job.read"],
      SUPPORT: ["dashboard.read", "release.read", "customer.read", "customer.update", "notification.read", "plan.read"],
      VIEWER: ["dashboard.read", "release.read", "notification.read"]
    };
    for (const r of this.roles) {
      for (const key of rolePerms[r.name] || []) {
        this.rolePermissions.push({ role_id: r.id, permission_id: map[key] });
      }
    }

    const planDefs = [
      ["FREE", "Free", { maxUploads: 5, maxReleases: 3, maxStorage: 1073741824, maxPublishingTargets: 0, maxJobs: 10, maxUsers: 1 }],
      ["STARTER", "Starter", { maxUploads: 20, maxReleases: 10, maxStorage: 5368709120, maxPublishingTargets: 1, maxJobs: 50, maxUsers: 1 }],
      ["PRO", "Pro", { maxUploads: 100, maxReleases: 50, maxStorage: 21474836480, maxPublishingTargets: 2, maxJobs: 200, maxUsers: 3 }],
      ["PREMIUM", "Premium", { maxUploads: 500, maxReleases: 200, maxStorage: 107374182400, maxPublishingTargets: 3, maxJobs: 1000, maxUsers: 10 }],
      ["BUSINESS", "Business", { maxUploads: 2000, maxReleases: 1000, maxStorage: 536870912000, maxPublishingTargets: 5, maxJobs: 5000, maxUsers: 25 }],
      ["ENTERPRISE", "Enterprise", { maxUploads: 100000, maxReleases: 100000, maxStorage: 1099511627776, maxPublishingTargets: 100, maxJobs: 100000, maxUsers: 1000 }]
    ];
    this.plans = planDefs.map(([code, name, limits]) => ({ id: uid(), code, name, limits, created_at: now(), updated_at: now() }));
  }

  _insert(collection, row) {
    collection.push({ ...row });
    return { ...row };
  }

  _update(collection, id, fields) {
    const row = collection.find(r => r.id === id);
    if (!row) return null;
    Object.assign(row, fields, { updated_at: now() });
    return { ...row };
  }

  _findById(collection, id) {
    const row = collection.find(r => r.id === id);
    return row ? { ...row } : null;
  }

  _role(name) {
    return this.roles.find(r => r.name === name);
  }

  async migrate() {}

  async createUser({ email, name, passwordHash, role, status = "ACTIVE", mustChangePassword = false }) {
    const id = uid();
    return this._insert(this.users, { id, email, name, password_hash: passwordHash, role, status, must_change_password: mustChangePassword, last_login_at: null, created_at: now(), updated_at: now() });
  }

  async findUserByEmail(email) {
    return this.users.find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
  }

  async findUserById(id) {
    return this._findById(this.users, id);
  }

  async listUsers() {
    return this.users.map(u => ({ ...u }));
  }

  async updateUser(id, fields) {
    return this._update(this.users, id, fields);
  }

  async createSession({ userId, tokenHash, expiresAt, ip, userAgent }) {
    const id = uid();
    return this._insert(this.sessions, { id, user_id: userId, token_hash: tokenHash, expires_at: expiresAt, ip, user_agent: userAgent, revoked_at: null, created_at: now() });
  }

  async findSessionByToken(tokenHash) {
    return this.sessions.find(s => s.token_hash === tokenHash) || null;
  }

  async revokeSession(id) {
    return this._update(this.sessions, id, { revoked_at: now() });
  }

  async createPasswordReset({ userId, tokenHash, expiresAt }) {
    const id = uid();
    return this._insert(this.passwordResets, { id, user_id: userId, token_hash: tokenHash, expires_at: expiresAt, used_at: null, created_at: now() });
  }

  async findPasswordResetByToken(tokenHash) {
    return this.passwordResets.find(p => p.token_hash === tokenHash) || null;
  }

  async markPasswordResetUsed(id) {
    return this._update(this.passwordResets, id, { used_at: now() });
  }

  async revokeUserSessions(userId) {
    for (const s of this.sessions) {
      if (s.user_id === userId && !s.revoked_at) {
        await this._update(this.sessions, s.id, { revoked_at: now() });
      }
    }
    return true;
  }

  async rolesWithPermissions() {
    return this.roles.map(r => ({
      id: r.id,
      name: r.name,
      permissions: this.rolePermissions
        .filter(rp => rp.role_id === r.id)
        .map(rp => this.permissions.find(p => p.id === rp.permission_id)?.key)
        .filter(Boolean)
    }));
  }

  async hasPermission(role, key) {
    const r = this._role(role);
    if (!r) return false;
    if (r.name === "SUPER_ADMIN") return true;
    const pid = this.permissions.find(p => p.key === key)?.id;
    return !!this.rolePermissions.find(rp => rp.role_id === r.id && rp.permission_id === pid);
  }

  async listPlans() {
    return this.plans.map(p => ({ ...p }));
  }

  async findPlanByCode(code) {
    return this.plans.find(p => p.code === code) || null;
  }

  async findPlanById(id) {
    return this._findById(this.plans, id);
  }

  async createCustomer({ name, email, status = "ACTIVE", planId }) {
    const id = uid();
    return this._insert(this.customers, { id, name, email, status, plan_id: planId || null, created_at: now(), updated_at: now() });
  }

  async findCustomerById(id) {
    return this._findById(this.customers, id);
  }

  async listCustomers({ search = "", status } = {}) {
    let rows = this.customers.map(c => ({ ...c }));
    if (status) rows = rows.filter(c => c.status === status);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(c => (c.name || "").toLowerCase().includes(s) || (c.email || "").toLowerCase().includes(s));
    }
    return rows;
  }

  async updateCustomer(id, fields) {
    return this._update(this.customers, id, fields);
  }

  async countCustomers() {
    return this.customers.length;
  }

  async createUpload({ customerId, userId, originalFilename, internalFilename, mimeType, extension, sizeBytes, sha256, status = "UPLOADED", storagePath }) {
    const id = uid();
    return this._insert(this.uploads, { id, customer_id: customerId || null, user_id: userId || null, original_filename: originalFilename, internal_filename: internalFilename, mime_type: mimeType || null, extension: extension || null, size_bytes: sizeBytes || 0, sha256: sha256 || null, status, storage_path: storagePath || null, error: null, metadata: {}, created_at: now(), updated_at: now() });
  }

  async findUploadById(id) {
    return this._findById(this.uploads, id);
  }

  async listUploads({ limit = 50, offset = 0, status } = {}) {
    let rows = this.uploads.map(u => ({ ...u }));
    if (status) rows = rows.filter(u => u.status === status);
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return rows.slice(offset, offset + limit);
  }

  async updateUpload(id, fields) {
    return this._update(this.uploads, id, fields);
  }

  async deleteUpload(id) {
    const idx = this.uploads.findIndex(u => u.id === id);
    if (idx === -1) return null;
    const [removed] = this.uploads.splice(idx, 1);
    this.scans = this.scans.filter(s => s.upload_id !== id);
    return removed;
  }

  async countUploadsByStatus() {
    const counts = {};
    for (const u of this.uploads) counts[u.status] = (counts[u.status] || 0) + 1;
    return counts;
  }

  async createScan({ uploadId, scanner, version, status = "CLEAN", findings = [], metadata = {} }) {
    const id = uid();
    return this._insert(this.scans, { id, upload_id: uploadId, scanner, version: version || null, status, timestamp: now(), findings, metadata });
  }

  async listScansByUpload(uploadId) {
    return this.scans.filter(s => s.upload_id === uploadId).map(s => ({ ...s }));
  }

  async createRelease({ customerId, uploadId, name, slug, description, version, versionCode, packageName, status = "DRAFT", visibility = "PRIVATE", createdBy }) {
    const id = uid();
    return this._insert(this.releases, { id, customer_id: customerId || null, upload_id: uploadId || null, name, slug, description: description || "", version: version || "", version_code: versionCode ?? null, package_name: packageName || null, status, visibility, created_by: createdBy || null, created_at: now(), updated_at: now(), published_at: null, archived_at: null });
  }

  async findReleaseById(id) {
    return this._findById(this.releases, id);
  }

  async findReleaseBySlug(slug) {
    return this.releases.find(r => r.slug === slug) || null;
  }

  async listReleases({ limit = 50, offset = 0, status, customerId, search } = {}) {
    let rows = this.releases.map(r => ({ ...r }));
    if (status) rows = rows.filter(r => r.status === status);
    if (customerId) rows = rows.filter(r => r.customer_id === customerId);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(s) || r.slug.toLowerCase().includes(s));
    }
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return rows.slice(offset, offset + limit);
  }

  async updateRelease(id, fields) {
    return this._update(this.releases, id, fields);
  }

  async countReleasesByStatus() {
    const counts = {};
    for (const r of this.releases) counts[r.status] = (counts[r.status] || 0) + 1;
    return counts;
  }

  async createReleaseVersion({ releaseId, version, versionCode, uploadId, changelog, createdBy, metadata = {} }) {
    const id = uid();
    return this._insert(this.releaseVersions, { id, release_id: releaseId, version, version_code: versionCode ?? null, upload_id: uploadId || null, changelog: changelog || "", created_by: createdBy || null, metadata, created_at: now() });
  }

  async listReleaseVersions(releaseId) {
    return this.releaseVersions.filter(v => v.release_id === releaseId).map(v => ({ ...v }));
  }

  async createApproval({ releaseId, action, actorId, reason = "", metadata = {} }) {
    const id = uid();
    return this._insert(this.approvals, { id, release_id: releaseId, action, actor_id: actorId || null, reason, metadata, created_at: now() });
  }

  async listApprovalsByRelease(releaseId) {
    return this.approvals.filter(a => a.release_id === releaseId).map(a => ({ ...a }));
  }

  async createIntegration({ provider, name, status = "DISCONNECTED", config = {}, targetId }) {
    const id = uid();
    return this._insert(this.integrations, { id, provider, name: name || "", status, config, target_id: targetId || null, created_at: now(), updated_at: now() });
  }

  async findIntegrationById(id) {
    return this._findById(this.integrations, id);
  }

  async listIntegrations() {
    return this.integrations.map(i => ({ ...i }));
  }

  async updateIntegration(id, fields) {
    return this._update(this.integrations, id, fields);
  }

  async createPublishingJob({ releaseId, provider, status = "QUEUED", priority = 0, maxAttempts = 3, idempotencyKey, payload = {} }) {
    const id = uid();
    return this._insert(this.publishingJobs, { id, release_id: releaseId, provider, status, priority, attempts: 0, max_attempts: maxAttempts, idempotency_key: idempotencyKey || null, error: null, payload, result: {}, created_at: now(), started_at: null, completed_at: null });
  }

  async findPublishingJobById(id) {
    return this._findById(this.publishingJobs, id);
  }

  async findPublishingJobByKey(idempotencyKey) {
    return this.publishingJobs.find(j => j.idempotency_key === idempotencyKey) || null;
  }

  async listPublishingJobs({ releaseId, provider, status, limit = 50, offset = 0 } = {}) {
    let rows = this.publishingJobs.map(j => ({ ...j }));
    if (releaseId) rows = rows.filter(j => j.release_id === releaseId);
    if (provider) rows = rows.filter(j => j.provider === provider);
    if (status) rows = rows.filter(j => j.status === status);
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return rows.slice(offset, offset + limit);
  }

  async updatePublishingJob(id, fields) {
    return this._update(this.publishingJobs, id, fields);
  }

  async countPublishingJobsByStatus() {
    const counts = {};
    for (const j of this.publishingJobs) counts[j.status] = (counts[j.status] || 0) + 1;
    return counts;
  }

  async createPublishingResult({ jobId, provider, status, externalId, publishedAt, error, metadata = {} }) {
    const id = uid();
    return this._insert(this.publishingResults, { id, job_id: jobId || null, provider, status, external_id: externalId || null, published_at: publishedAt || null, error: error || null, metadata, created_at: now() });
  }

  async listPublishingResults(jobId) {
    return this.publishingResults.filter(r => r.job_id === jobId).map(r => ({ ...r }));
  }

  async createJob({ type, status = "QUEUED", priority = 0, maxAttempts = 3, payload = {} }) {
    const id = uid();
    return this._insert(this.jobs, { id, type, status, priority, attempts: 0, max_attempts: maxAttempts, payload, error: null, created_at: now(), started_at: null, completed_at: null });
  }

  async findJobById(id) {
    return this._findById(this.jobs, id);
  }

  async listJobs({ type, status, limit = 50, offset = 0 } = {}) {
    let rows = this.jobs.map(j => ({ ...j }));
    if (type) rows = rows.filter(j => j.type === type);
    if (status) rows = rows.filter(j => j.status === status);
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return rows.slice(offset, offset + limit);
  }

  async updateJob(id, fields) {
    return this._update(this.jobs, id, fields);
  }

  async createNotification({ userId, type, severity = "INFO", title, message = "", data = {} }) {
    const id = uid();
    return this._insert(this.notifications, { id, user_id: userId || null, type, severity, title, message, data, read_at: null, created_at: now() });
  }

  async listNotifications({ userId, unreadOnly = false, limit = 50 } = {}) {
    let rows = this.notifications.filter(n => !userId || n.user_id === userId);
    if (unreadOnly) rows = rows.filter(n => !n.read_at);
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return rows.slice(0, limit);
  }

  async markNotificationRead(id) {
    const row = this.notifications.find(n => n.id === id);
    if (!row) return null;
    row.read_at = now();
    return { ...row };
  }

  async markAllNotificationsRead(userId) {
    for (const n of this.notifications) {
      if (n.user_id === userId && !n.read_at) n.read_at = now();
    }
  }

  async createAuditLog({ actorId, actorEmail, action, resource, resourceId, result = "SUCCESS", ip, metadata = {} }) {
    const id = uid();
    return this._insert(this.auditLogs, { id, actor_id: actorId || null, actor_email: actorEmail || null, action, resource: resource || null, resource_id: resourceId || null, result, ip: ip || null, metadata, created_at: now() });
  }

  async listAuditLogs({ limit = 100, offset = 0, action, resource } = {}) {
    let rows = this.auditLogs.map(a => ({ ...a }));
    if (action) rows = rows.filter(a => a.action === action);
    if (resource) rows = rows.filter(a => a.resource === resource);
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return rows.slice(offset, offset + limit);
  }

  async countAuditLogs() {
    return this.auditLogs.length;
  }
}

module.exports = { MemoryRepository, uid, now };