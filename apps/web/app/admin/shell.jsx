"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getToken, getSessionUser, clearSession, api, setSessionUser } from "./lib";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/admin/releases", label: "Releases", icon: "▤" },
  { href: "/admin/uploads", label: "Uploads", icon: "⇪" },
  { href: "/admin/approvals", label: "Approvals", icon: "✓" },
  { href: "/admin/publishing", label: "Publishing", icon: "▶" },
  { href: "/admin/customers", label: "Customers", icon: "☰" }
];

const MORE_ITEMS = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/audit", label: "Audit Logs" },
  { href: "/admin/health", label: "System Health" },
  { href: "/admin/settings", label: "Settings" }
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(getSessionUser());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    api("/auth/me").then(({ user }) => {
      if (user) setSessionUser(user);
      setUser(user);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pathname === "/admin/login") return children;

  if (!getToken()) return null;

  const logout = async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch {}
    clearSession();
    router.replace("/admin/login");
  };

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-logo"><span className="dot" /> CrowMods Admin</div>
        <div className="admin-actions">
          <span className="badge badge-blue">{user?.role || "…"}</span>
          <button className="btn btn-sm btn-secondary" onClick={logout}>Logout</button>
        </div>
      </header>

      <nav className="admin-nav">
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : ""}>
            <span>{item.icon}</span>
            <span className="admin-nav-label">{item.label}</span>
          </Link>
        ))}
        <div className="more">
          <button
            className="btn btn-sm btn-secondary"
            style={{ minHeight: 44 }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span>☰</span>
            <span className="admin-nav-label">More</span>
          </button>
          {menuOpen && (
            <div className="admin-more-menu">
              {MORE_ITEMS.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <button className="btn btn-sm btn-danger" onClick={logout} style={{ gridColumn: "1 / -1" }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="admin-content">{children}</main>
    </div>
  );
}