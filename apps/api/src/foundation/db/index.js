const { MemoryRepository } = require("./memory");
const { PostgresRepository } = require("./postgres");
const config = require("../config/env");

let repo = null;

function getRepository() {
  if (repo) return repo;
  if (config.databaseUrl) {
    repo = new PostgresRepository(config.databaseUrl);
  } else {
    repo = new MemoryRepository();
  }
  return repo;
}

function setRepository(instance) {
  repo = instance;
  return instance;
}

function resetRepository() {
  repo = null;
}

module.exports = { getRepository, setRepository, resetRepository };