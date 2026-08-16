"use client";

import "./admin.css";
import AdminShell from "./shell";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-root">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}