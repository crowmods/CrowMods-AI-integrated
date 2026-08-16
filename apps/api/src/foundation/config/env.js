module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  sessionTtlMs: Number(process.env.SESSION_TTL_MS || 86400000),
  passwordResetTtlMs: Number(process.env.PASSWORD_RESET_TTL_MS || 3600000),
  uploadsDir: process.env.UPLOADS_DIR || "",
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 300 * 1024 * 1024),
  jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET || "change-me-in-production"
};