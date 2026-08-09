const argon2 = require("argon2");

async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }
  return argon2.hash(password, { type: argon2.argon2id });
}

async function verifyPassword(hash, password) {
  return argon2.verify(hash, password);
}

module.exports = { hashPassword, verifyPassword };
