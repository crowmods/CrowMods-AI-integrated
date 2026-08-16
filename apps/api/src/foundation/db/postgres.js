const { Pool } = require("pg");

class PostgresRepository {
  constructor(databaseUrl) {
    this.pool = new Pool({ connectionString: databaseUrl, max: 10 });
  }

  async close() {
    await this.pool.end();
  }

  async migrate() {
    const fs = require("node:fs");
    const path = require("node:path");
    const root = path.resolve(__dirname, "../../../../../database/migrations");
    const files = fs.readdirSync(root).filter(f => f.endsWith(".sql")).sort();
    for (const file of files) {
      const applied = await this.pool.query("SELECT 1 FROM schema_migrations WHERE version = $1", [file]).then(r => r.rowCount > 0).catch(() => false);
      if (applied) continue;
      const sql = fs.readFileSync(path.join(root, file), "utf8");
      await this.pool.query(sql);
      await this.pool.query("INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING", [file]);
    }
  }

  async _one(query, params) {
    const { rows } = await this.pool.query(query, params);
    return rows[0] || null;
  }

  async _many(query, params) {
    const { rows } = await this.pool.query(query, params);
    return rows;
  }

  async createUser({ email, name, passwordHash, role, status = "ACTIVE", mustChangePassword = false }) {
    const { rows } = await this.pool.query(
      `INSERT INTO users (email, name, password_hash, role, status, must_change_password)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [email, name, passwordHash, role, status, mustChangePassword]
    );
    return rows[0];
  }

  async findUserByEmail(email) {
    return this._one("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
  }

  async findUserById(id) {
    return this._one("SELECT * FROM users WHERE id = $1", [id]);
  }

  async listUsers() {
    return this._many("SELECT * FROM users ORDER BY created_at DESC");
  }

  async updateUser(id, fields) {
    const allowed = ["name", "password_hash", "role", "status", "must_change_password", "last_login_at"];
    return this._updateRow("users", id, fields, allowed);
  }

  async _updateRow(table, id, fields, allowed) {
    const sets = [];
    const params = [];
    let i = 1;
    for (const [key, value] of Object.entries(fields)) {
      if (!allowed.includes(key)) continue;
      if (value === undefined) continue;
      sets.push(`${key} = $${i++}`);
      params.push(value);
    }
    if (!sets.length) return this._one(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    sets.push(`updated_at = now()`);
    params.push(id);
    return this._one(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`, params);
  }

  async createSession({ userId, tokenHash, expiresAt, ip, userAgent }) {
    const { rows } = await this.pool.query(
      `INSERT INTO sessions (user_id, token_hash, expires_at, ip, user_agent) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, tokenHash, expiresAt, ip, userAgent]
    );
    return rows[0];
  }

  async findSessionByToken(tokenHash) {
    return this._one("SELECT * FROM sessions WHERE token_hash = $1", [tokenHash]);
  }

  async revokeSession(id) {
    return this._one("UPDATE sessions SET revoked_at = now() WHERE id = $1 RETURNING *", [id]);
  }

  async createPasswordReset({ userId, tokenHash, expiresAt }) {
    const { rows } = await this.pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1,$2,$3) RETURNING *`,
      [userId, tokenHash, expiresAt]
    );
    return rows[0];
  }

  async findPasswordResetByToken(tokenHash) {
    return this._one("SELECT * FROM password_resets WHERE token_hash = $1", [tokenHash]);
  }

  async markPasswordResetUsed(id) {
    return this._one("UPDATE password_resets SET used_at = now() WHERE id = $1 RETURNING *", [id]);
  }

  async revokeUserSessions(userId) {
    await this.pool.query("UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL", [userId]);
    return true;
  }

  async rolesWithPermissions() {
    const { rows } = await this.pool.query(
      `SELECT r.name AS role, p.key AS permission
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       ORDER BY r.name`
    );
    const map = {};
    for (const row of rows) {
      if (!map[row.role]) map[row.role] = [];
      if (row.permission) map[row.role].push(row.permission);
    }
    return Object.entries(map).map(([name, permissions]) => ({ name, permissions }));
  }

  async hasPermission(role, key) {
    const { rows } = await this.pool.query(
      `SELECT 1 FROM roles r
       JOIN role_permissions rp ON rp.role_id = r.id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE r.name = $1 AND p.key = $2 LIMIT 1`,
      [role, key]
    );
    return rows.length > 0 || role === "SUPER_ADMIN";
  }

  async listPlans() {
    return this._many("SELECT * FROM plans ORDER BY name");
  }

  async findPlanByCode(code) {
    return this._one("SELECT * FROM plans WHERE code = $1", [code]);
  }

  async findPlanById(id) {
    return this._one("SELECT * FROM plans WHERE id = $1", [id]);
  }

  async createCustomer({ name, email, status = "ACTIVE", planId }) {
    const { rows } = await this.pool.query(
      `INSERT INTO customers (name, email, status, plan_id) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, email, status, planId]
    );
    return rows[0];
  }

  async findCustomerById(id) {
    return this._one("SELECT * FROM customers WHERE id = $1", [id]);
  }

  async listCustomers({ search = "", status } = {}) {
    const params = [];
    let sql = "SELECT * FROM customers WHERE 1=1";
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    sql += " ORDER BY created_at DESC";
    return this._many(sql, params);
  }

  async updateCustomer(id, fields) {
    return this._updateRow("customers", id, fields, ["name", "email", "status", "plan_id"]);
  }

  async countCustomers() {
    const r = await this.pool.query("SELECT count(*)::int AS n FROM customers");
    return r.rows[0].n;
  }

  async createUpload({ customerId, userId, originalFilename, internalFilename, mimeType, extension, sizeBytes, sha256, status = "UPLOADED", storagePath }) {
    const { rows } = await this.pool.query(
      `INSERT INTO uploads (customer_id, user_id, original_filename, internal_filename, mime_type, extension, size_bytes, sha256, status, storage_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [customerId, userId, originalFilename, internalFilename, mimeType, extension, sizeBytes, sha256, status, storagePath]
    );
    return rows[0];
  }

  async findUploadById(id) {
    return this._one("SELECT * FROM uploads WHERE id = $1", [id]);
  }

  async listUploads({ limit = 50, offset = 0, status } = {}) {
    const params = [];
    let sql = "SELECT * FROM uploads WHERE 1=1";
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    sql += " ORDER BY created_at DESC LIMIT " + limit + " OFFSET " + offset;
    return this._many(sql, params);
  }

  async updateUpload(id, fields) {
    return this._updateRow("uploads", id, fields, ["status", "error", "metadata", "sha256"]);
  }

  async deleteUpload(id) {
    const row = await this._one("DELETE FROM uploads WHERE id = $1 RETURNING *", [id]);
    await this.pool.query("DELETE FROM scans WHERE upload_id = $1", [id]);
    return row;
  }

  async countUploadsByStatus() {
    const rows = await this._many("SELECT status, count(*)::int AS n FROM uploads GROUP BY status");
    const counts = {};
    for (const r of rows) counts[r.status] = r.n;
    return counts;
  }

  async createScan({ uploadId, scanner, version, status = "CLEAN", findings = [], metadata = {} }) {
    const { rows } = await this.pool.query(
      `INSERT INTO scans (upload_id, scanner, version, status, findings, metadata) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [uploadId, scanner, version, status, JSON.stringify(findings), JSON.stringify(metadata)]
    );
    return rows[0];
  }

  async listScansByUpload(uploadId) {
    return this._many("SELECT * FROM scans WHERE upload_id = $1 ORDER BY timestamp DESC", [uploadId]);
  }

  async createRelease({ customerId, uploadId, name, slug, description, version, versionCode, packageName, status = "DRAFT", visibility = "PRIVATE", createdBy }) {
    const { rows } = await this.pool.query(
      `INSERT INTO releases (customer_id, upload_id, name, slug, description, version, version_code, package_name, status, visibility, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [customerId, uploadId, name, slug, description, version, versionCode, packageName, status, visibility, createdBy]
    );
    return rows[0];
  }

  async findReleaseById(id) {
    return this._one("SELECT * FROM releases WHERE id = $1", [id]);
  }

  async findReleaseBySlug(slug) {
    return this._one("SELECT * FROM releases WHERE slug = $1", [slug]);
  }

  async deleteRelease(id) {
    return this._one("DELETE FROM releases WHERE id = $1 RETURNING *", [id]);
  }

  async listReleases({ limit = 50, offset = 0, status, customerId, search } = {}) {
    const params = [];
    let sql = "SELECT * FROM releases WHERE 1=1";
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    if (customerId) { params.push(customerId); sql += ` AND customer_id = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR slug ILIKE $${params.length})`;
    }
    sql += " ORDER BY created_at DESC LIMIT " + limit + " OFFSET " + offset;
    return this._many(sql, params);
  }

  async updateRelease(id, fields) {
    return this._updateRow("releases", id, fields, ["name", "slug", "description", "version", "version_code", "package_name", "status", "visibility", "published_at", "archived_at"]);
  }

  async countReleasesByStatus() {
    const rows = await this._many("SELECT status, count(*)::int AS n FROM releases GROUP BY status");
    const counts = {};
    for (const r of rows) counts[r.status] = r.n;
    return counts;
  }

  async createReleaseVersion({ releaseId, version, versionCode, uploadId, changelog, createdBy, metadata = {} }) {
    const { rows } = await this.pool.query(
      `INSERT INTO release_versions (release_id, version, version_code, upload_id, changelog, created_by, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [releaseId, version, versionCode, uploadId, changelog, createdBy, JSON.stringify(metadata)]
    );
    return rows[0];
  }

  async listReleaseVersions(releaseId) {
    return this._many("SELECT * FROM release_versions WHERE release_id = $1 ORDER BY created_at DESC", [releaseId]);
  }

  async createApproval({ releaseId, action, actorId, reason = "", metadata = {} }) {
    const { rows } = await this.pool.query(
      `INSERT INTO approvals (release_id, action, actor_id, reason, metadata) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [releaseId, action, actorId, reason, JSON.stringify(metadata)]
    );
    return rows[0];
  }

  async listApprovalsByRelease(releaseId) {
    return this._many("SELECT * FROM approvals WHERE release_id = $1 ORDER BY created_at DESC", [releaseId]);
  }

  async createIntegration({ provider, name, status = "DISCONNECTED", config = {}, targetId }) {
    const { rows } = await this.pool.query(
      `INSERT INTO integrations (provider, name, status, config, target_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [provider, name, status, JSON.stringify(config), targetId]
    );
    return rows[0];
  }

  async findIntegrationById(id) {
    return this._one("SELECT * FROM integrations WHERE id = $1", [id]);
  }

  async listIntegrations() {
    const rows = await this._many("SELECT * FROM integrations ORDER BY provider, created_at");
    return rows.map(r => ({ ...r }));
  }

  async updateIntegration(id, fields) {
    return this._updateRow("integrations", id, fields, ["name", "status", "config", "target_id"]);
  }

  async createPublishingJob({ releaseId, provider, status = "QUEUED", priority = 0, maxAttempts = 3, idempotencyKey, payload = {} }) {
    const { rows } = await this.pool.query(
      `INSERT INTO publishing_jobs (release_id, provider, status, priority, max_attempts, idempotency_key, payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [releaseId, provider, status, priority, maxAttempts, idempotencyKey, JSON.stringify(payload)]
    );
    return rows[0];
  }

  async findPublishingJobById(id) {
    return this._one("SELECT * FROM publishing_jobs WHERE id = $1", [id]);
  }

  async findPublishingJobByKey(idempotencyKey) {
    return this._one("SELECT * FROM publishing_jobs WHERE idempotency_key = $1", [idempotencyKey]);
  }

  async listPublishingJobs({ releaseId, provider, status, limit = 50, offset = 0 } = {}) {
    const params = [];
    let sql = "SELECT * FROM publishing_jobs WHERE 1=1";
    if (releaseId) { params.push(releaseId); sql += ` AND release_id = $${params.length}`; }
    if (provider) { params.push(provider); sql += ` AND provider = $${params.length}`; }
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    sql += " ORDER BY created_at DESC LIMIT " + limit + " OFFSET " + offset;
    return this._many(sql, params);
  }

  async updatePublishingJob(id, fields) {
    return this._updateRow("publishing_jobs", id, fields, ["status", "attempts", "max_attempts", "error", "payload", "result", "started_at", "completed_at"]);
  }

  async countPublishingJobsByStatus() {
    const rows = await this._many("SELECT status, count(*)::int AS n FROM publishing_jobs GROUP BY status");
    const counts = {};
    for (const r of rows) counts[r.status] = r.n;
    return counts;
  }

  async createPublishingResult({ jobId, provider, status, externalId, publishedAt, error, metadata = {} }) {
    const { rows } = await this.pool.query(
      `INSERT INTO publishing_results (job_id, provider, status, external_id, published_at, error, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [jobId, provider, status, externalId, publishedAt, error, JSON.stringify(metadata)]
    );
    return rows[0];
  }

  async listPublishingResults(jobId) {
    return this._many("SELECT * FROM publishing_results WHERE job_id = $1 ORDER BY created_at DESC", [jobId]);
  }

  async createJob({ type, status = "QUEUED", priority = 0, maxAttempts = 3, payload = {} }) {
    const { rows } = await this.pool.query(
      `INSERT INTO jobs (type, status, priority, max_attempts, payload) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [type, status, priority, maxAttempts, JSON.stringify(payload)]
    );
    return rows[0];
  }

  async findJobById(id) {
    return this._one("SELECT * FROM jobs WHERE id = $1", [id]);
  }

  async listJobs({ type, status, limit = 50, offset = 0 } = {}) {
    const params = [];
    let sql = "SELECT * FROM jobs WHERE 1=1";
    if (type) { params.push(type); sql += ` AND type = $${params.length}`; }
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    sql += " ORDER BY created_at DESC LIMIT " + limit + " OFFSET " + offset;
    return this._many(sql, params);
  }

  async updateJob(id, fields) {
    return this._updateRow("jobs", id, fields, ["status", "attempts", "max_attempts", "error", "started_at", "completed_at"]);
  }

  async createNotification({ userId, type, severity = "INFO", title, message = "", data = {} }) {
    const { rows } = await this.pool.query(
      `INSERT INTO notifications (user_id, type, severity, title, message, data) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [userId, type, severity, title, message, JSON.stringify(data)]
    );
    return rows[0];
  }

  async listNotifications({ userId, unreadOnly = false, limit = 50 } = {}) {
    const params = [];
    let sql = "SELECT * FROM notifications WHERE 1=1";
    if (userId) { params.push(userId); sql += ` AND user_id = $${params.length}`; }
    if (unreadOnly) sql += " AND read_at IS NULL";
    params.push(limit);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
    return this._many(sql, params);
  }

  async markNotificationRead(id) {
    return this._one("UPDATE notifications SET read_at = now() WHERE id = $1 RETURNING *", [id]);
  }

  async markAllNotificationsRead(userId) {
    await this.pool.query("UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL", [userId]);
  }

  async createAuditLog({ actorId, actorEmail, action, resource, resourceId, result = "SUCCESS", ip, metadata = {} }) {
    const { rows } = await this.pool.query(
      `INSERT INTO audit_logs (actor_id, actor_email, action, resource, resource_id, result, ip, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [actorId, actorEmail, action, resource, resourceId, result, ip, JSON.stringify(metadata)]
    );
    return rows[0];
  }

  async listAuditLogs({ limit = 100, offset = 0, action, resource } = {}) {
    const params = [];
    let sql = "SELECT * FROM audit_logs WHERE 1=1";
    if (action) { params.push(action); sql += ` AND action = $${params.length}`; }
    if (resource) { params.push(resource); sql += ` AND resource = $${params.length}`; }
    sql += " ORDER BY created_at DESC LIMIT " + limit + " OFFSET " + offset;
    return this._many(sql, params);
  }

  async countAuditLogs() {
    const r = await this.pool.query("SELECT count(*)::int AS n FROM audit_logs");
    return r.rows[0].n;
  }
}

module.exports = { PostgresRepository };