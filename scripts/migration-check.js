const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dir = path.join(root, "database/migrations");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort();

if (files.length === 0) {
  console.error("No migration files found in database/migrations");
  process.exit(1);
}

let failed = false;

console.log(`Migration files: ${files.length}`);

const prev = [];
for (const file of files) {
  const m = file.match(/^(\d+)_([a-z0-9_]+)\.sql$/);
  if (!m) {
    console.error(`  INVALID filename: ${file} (expected NNN_name.sql)`);
    failed = true;
    continue;
  }
  const version = m[1];
  if (prev.length && prev[prev.length - 1] >= version) {
    console.error(`  OUT OF ORDER: ${file} comes after ${prev[prev.length - 1]}`);
    failed = true;
  }
  prev.push(version);

  const sql = fs.readFileSync(path.join(dir, file), "utf8");
  if (!/CREATE TABLE IF NOT EXISTS schema_migrations/.test(sql) && file === files[0]) {
    console.error(`  First migration ${file} must create schema_migrations`);
    failed = true;
  }
  if (/DELETE FROM|DROP TABLE|DROP DATABASE/i.test(sql)) {
    console.error(`  POTENTIALLY DESTRUCTIVE statement found in ${file}`);
    failed = true;
  }
  console.log(`  OK ${file}`);
}

if (!failed) {
  console.log("Migration check passed.");
} else {
  console.error("Migration check failed.");
  process.exit(1);
}