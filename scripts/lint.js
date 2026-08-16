const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const targets = ["apps/api/src/foundation", "apps/api/src/server.js", "tests/foundation", "scripts"];

let failed = false;
const files = [];

for (const target of targets) {
  const abs = path.resolve(root, target);
  if (fs.statSync(abs).isDirectory()) {
    walk(abs);
  } else {
    files.push(abs);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".js")) files.push(p);
  }
}

for (const file of files) {
  try {
    execSync(`node --check "${file}"`, { stdio: "pipe" });
  } catch (err) {
    console.error(`SYNTAX ERROR in ${path.relative(root, file)}`);
    console.error(String(err.stderr || err.message).trim());
    failed = true;
  }
}

console.log(`Lint: checked ${files.length} JavaScript files for syntax errors.`);

if (failed) {
  process.exit(1);
}
console.log("Lint passed.");