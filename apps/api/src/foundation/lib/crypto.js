const crypto = require("node:crypto");
const argon2 = require("argon2");

async function hashPassword(plain) {
  return argon2.hash(plain, { type: argon2.argon2id });
}

async function verifyPassword(hash, plain) {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sha256Hex(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function randomInternalName(extension) {
  return `${crypto.randomBytes(16).toString("hex")}${extension ? "." + extension : ""}`;
}

module.exports = { hashPassword, verifyPassword, generateToken, hashToken, sha256Hex, randomInternalName };