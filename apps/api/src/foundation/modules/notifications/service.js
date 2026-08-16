const { getRepository } = require("../../db");

async function create({ userId, type, severity = "INFO", title, message = "", data = {} }) {
  const repo = getRepository();
  return repo.createNotification({ userId, type, severity, title, message, data });
}

async function list({ userId, unreadOnly = false, limit = 50 }) {
  const repo = getRepository();
  return repo.listNotifications({ userId, unreadOnly, limit });
}

async function markRead(id) {
  const repo = getRepository();
  return repo.markNotificationRead(id);
}

async function markAllRead(userId) {
  const repo = getRepository();
  await repo.markAllNotificationsRead(userId);
  return { ok: true };
}

module.exports = { create, list, markRead, markAllRead };