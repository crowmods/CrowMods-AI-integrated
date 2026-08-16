const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function walk(dir) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      out = out.concat(walk(p));
    } else if (entry.name.endsWith(".json")) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(root).filter(p => !p.includes("package-lock.json"));
let failed = false;

for (const file of files) {
  try {
    JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.error(`INVALID JSON: ${path.relative(root, file)} — ${err.message}`);
    failed = true;
  }
}

try {
  require(path.join(root, "apps/api/src/foundation/config/env"));
} catch (err) {
  console.error("Environment config failed to load:", err.message);
  failed = true;
}

console.log(`Typecheck: validated ${files.length} JSON files and config module.`);

if (failed) {
  process.exit(1);
}
console.log("Typecheck passed.");