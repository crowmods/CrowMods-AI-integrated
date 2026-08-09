const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const LOG_DIR = path.resolve(__dirname, "../storage/logs");
fs.mkdirSync(LOG_DIR, {recursive:true});

function requestId(req) {
  return req.headers["x-request-id"] || crypto.randomUUID();
}

function audit(event) {
  const line = JSON.stringify({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    ...event
  }) + "\n";
  fs.appendFileSync(path.join(LOG_DIR, "audit.log"), line);
}

function safeRole(role) {
  return ["owner","reviewer","publisher","analyst"].includes(role) ? role : "analyst";
}

module.exports = {requestId,audit,safeRole};
