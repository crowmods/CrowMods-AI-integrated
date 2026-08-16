"use client";

export const API = process.env.NEXT_PUBLIC_API_URL || "https://crowmods-ai-integrated.onrender.com";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("crowmods_token");
}

export function setToken(token) {
  localStorage.setItem("crowmods_token", token || "");
}

export function getSessionUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("crowmods_user") || "null");
  } catch {
    return null;
  }
}

export function setSessionUser(user) {
  localStorage.setItem("crowmods_user", JSON.stringify(user || null));
}

export function clearSession() {
  localStorage.removeItem("crowmods_token");
  localStorage.removeItem("crowmods_user");
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}/api/admin${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  });

  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && auth) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/admin/login";
  }
  if (!res.ok) {
    const err = new Error(json.message || json.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = Number(bytes);
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
}

export function timeAgo(value) {
  if (!value) return "—";
  const ms = Date.now() - new Date(value).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}