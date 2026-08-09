const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const catalogPath = path.join(root, "docs", "phase-catalog.json");
const phasesRoot = path.join(root, "source", "phases");

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

const classifications = {
  api: [],
  infrastructure: [],
  cicd: [],
  database: [],
  other: []
};

const missingSource = [];

for (const entry of catalog) {
  const phase = String(entry.phase).padStart(3, "0");
  const dir = path.join(phasesRoot, phase);

  if (!fs.existsSync(dir)) {
    missingSource.push(entry.phase);
    continue;
  }

  const files = [];

  function walk(current) {
    for (const item of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, item.name);

      if (item.isDirectory()) {
        walk(full);
      } else {
        files.push(full);
      }
    }
  }

  walk(dir);

  const relative = files.map(f =>
    path.relative(dir, f).replaceAll(path.sep, "/")
  );

  const hasServer = relative.some(f =>
    /(^|\/)backend\/src\/server\.js$/.test(f)
  );

  const hasDatabase = relative.some(f =>
    /(^|\/)(database|db)\/.*\.sql$/i.test(f)
  );

  const hasCI = relative.some(f =>
    /(^|\/)\.github\/workflows\/.*\.ya?ml$/i.test(f)
  );

  const hasDocker = relative.some(f =>
    /(^|\/)(docker|docker-compose.*|.*Dockerfile)/i.test(f)
  );

  if (hasServer) {
    classifications.api.push(entry.phase);
  } else if (hasCI) {
    classifications.cicd.push(entry.phase);
  } else if (hasDocker) {
    classifications.infrastructure.push(entry.phase);
  } else if (hasDatabase) {
    classifications.database.push(entry.phase);
  } else {
    classifications.other.push(entry.phase);
  }
}

const classifiedCount =
  classifications.api.length +
  classifications.infrastructure.length +
  classifications.cicd.length +
  classifications.database.length +
  classifications.other.length;

console.log(`Catalog phases: ${catalog.length}`);
console.log(`Source phases found: ${catalog.length - missingSource.length}`);
console.log(`Classified phases: ${classifiedCount}`);
console.log(`API phases: ${classifications.api.length}`);
console.log(`Infrastructure phases: ${classifications.infrastructure.length}`);
console.log(`CI/CD phases: ${classifications.cicd.length}`);
console.log(`Database phases: ${classifications.database.length}`);
console.log(`Other phases: ${classifications.other.length}`);

if (missingSource.length) {
  console.error("Missing source phases:", missingSource);
  process.exitCode = 1;
}

if (classifiedCount !== catalog.length) {
  console.error("Classification count does not match catalog.");
  process.exitCode = 1;
}

if (!missingSource.length && classifiedCount === catalog.length) {
  console.log("All catalog phases are accounted for.");
}
