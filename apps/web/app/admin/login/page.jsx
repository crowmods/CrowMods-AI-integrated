"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken, setSessionUser } from "../lib";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api("/auth/login", { method: "POST", body: { email, password }, auth: false });
      setToken(res.token);
      setSessionUser(res.user);
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-root login-page">
      <div className="card login-card">
        <h1 className="page-title">CrowMods Admin</h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Sign in to the foundation console.</p>
        {error && <div className="card" style={{ background: "rgba(231,76,60,0.1)", borderColor: "var(--red)", color: "var(--red)" }}>{error}</div>}
        <form onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>
          <button className="btn btn-block" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}