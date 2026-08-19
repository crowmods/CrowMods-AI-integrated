"use client";

import { useEffect, useState } from "react";
import { api, API } from "../lib";

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState("");
  const [tgForm, setTgForm] = useState({ botToken: "", chatId: "" });
  const [dcForm, setDcForm] = useState({ webhookUrl: "" });
  const [siteForm, setSiteForm] = useState({ publicDomain: "", adminPanelUrl: "" });
  const [userForm, setUserForm] = useState({ email: "", name: "", password: "", role: "VIEWER" });

  const load = () => {
    api("/integrations").then(r => {
      setIntegrations(r.integrations);
      const ws = r.integrations.find(i => i.provider === "website");
      if (ws) setSiteForm({
        publicDomain: ws.config?.publicDomain || "",
        adminPanelUrl: ws.config?.adminPanelUrl || ws.config?.adminUrl || ""
      });
    }).catch(() => {});
    api("/plans").then(r => setPlans(r.plans)).catch(() => {});
    api("/users").then(r => setUsers(r.users)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const connectTg = async () => {
    try {
      await api("/integrations", { method: "POST", body: { provider: "telegram", name: "Telegram", config: tgForm } });
      setToast("Telegram integration connected.");
      load();
    } catch (err) { setToast(err.message); }
  };

  const connectDc = async () => {
    try {
      await api("/integrations", { method: "POST", body: { provider: "discord", name: "Discord", config: dcForm } });
      setToast("Discord integration connected.");
      load();
    } catch (err) { setToast(err.message); }
  };

  const saveSite = async () => {
    try {
      await api("/integrations", { method: "POST", body: { provider: "website", name: "Public Site", config: siteForm } });
      setToast("Public site settings saved.");
      load();
    } catch (err) { setToast(err.message); }
  };

  const setUserRole = async (user, role) => {
    try {
      await api(`/users/${user.id}`, { method: "PATCH", body: { role } });
      setToast(`Role updated for ${user.email}.`);
      load();
    } catch (err) { setToast(err.message); }
  };

  const toggleUserStatus = async (user) => {
    try {
      if (user.status === "ACTIVE") {
        await api(`/users/${user.id}`, { method: "DELETE" });
        setToast(`${user.email} deactivated.`);
      } else {
        await api(`/users/${user.id}`, { method: "PATCH", body: { status: "ACTIVE" } });
        setToast(`${user.email} reactivated.`);
      }
      load();
    } catch (err) { setToast(err.message); }
  };

  const test = async (provider) => {
    try {
      const r = await api(`/integrations/${provider}/test`, { method: "POST" });
      setToast(`${provider}: ${r.ok ? "OK" : r.detail}`);
    } catch (err) { setToast(err.message); }
  };

  const disconnect = async (id) => {
    await api(`/integrations/${id}/disconnect`, { method: "POST" });
    setToast("Integration disconnected.");
    load();
  };

  const createUser = async () => {
    try {
      await api("/users", { method: "POST", body: userForm });
      setToast("User created.");
      setUserForm({ email: "", name: "", password: "", role: "VIEWER" });
      load();
    } catch (err) { setToast(err.message); }
  };

  return (
    <>
      <h1 className="page-title">Settings</h1>

      {toast && <div className="toast success">{toast}</div>}

      <div className="card">
        <h2 className="section-title">Public Site & Custom Domain</h2>
        <p className="meta" style={{ marginBottom: 12 }}>
          Your public release pages are served at <code>https://crowmods-ai-integrated.onrender.com/releases/&lt;slug&gt;</code>.
          Point a custom domain at your API service (DNS CNAME to the onrender.com host) and set it below — release pages,
          download links and share links then use your own domain.
        </p>
        <label className="field"><span>Custom public domain</span><input value={siteForm.publicDomain} onChange={e => setSiteForm({ ...siteForm, publicDomain: e.target.value })} placeholder="https://mods.example.com" /></label>
        <label className="field"><span>Admin panel URL</span><input value={siteForm.adminPanelUrl} onChange={e => setSiteForm({ ...siteForm, adminPanelUrl: e.target.value })} placeholder="https://crowmods-ai-web.onrender.com/admin" /></label>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-block" style={{ flex: 1 }} onClick={saveSite}>Save Public Site Settings</button>
          <a className="btn btn-block" style={{ flex: 1, background: "var(--panel)", border: "1px solid var(--border)", color: "var(--text)" }} href={`${(siteForm.publicDomain || API).replace(/\/+$/, "")}/releases`} target="_blank" rel="noopener noreferrer">View Public Releases</a>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Integrations</h2>
        {integrations.map(i => (
          <div key={i.id} className="list-card" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="main">
              <div className="title" style={{ textTransform: "capitalize" }}>{i.provider}</div>
              <div className="meta">{i.name} • {i.target_id || "no target"}</div>
            </div>
            <div className="row">
              <span className={`badge ${i.status === "CONNECTED" ? "badge-green" : "badge-gray"}`}>{i.status}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => test(i.provider)}>Test</button>
              <button className="btn btn-sm btn-danger" onClick={() => disconnect(i.id)}>Disconnect</button>
            </div>
          </div>
        ))}
        {!integrations.length && <div className="empty">No integrations configured.</div>}
      </div>

      <div className="card">
        <h2 className="section-title">Telegram Bot</h2>
        <label className="field"><span>Bot Token</span><input value={tgForm.botToken} onChange={e => setTgForm({ ...tgForm, botToken: e.target.value })} type="password" /></label>
        <label className="field"><span>Chat ID</span><input value={tgForm.chatId} onChange={e => setTgForm({ ...tgForm, chatId: e.target.value })} /></label>
        <button className="btn btn-block" onClick={connectTg}>Connect Telegram</button>
      </div>

      <div className="card">
        <h2 className="section-title">Discord Webhook</h2>
        <label className="field"><span>Webhook URL</span><input value={dcForm.webhookUrl} onChange={e => setDcForm({ ...dcForm, webhookUrl: e.target.value })} type="password" /></label>
        <button className="btn btn-block" onClick={connectDc}>Connect Discord</button>
      </div>

      <div className="card">
        <h2 className="section-title">Admin Users</h2>
        {users.map(u => (
          <div key={u.id} className="list-card" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="main">
              <div className="title">{u.name || u.email}</div>
              <div className="meta">{u.email}</div>
            </div>
            <div className="row">
              <span className={`badge ${u.status === "ACTIVE" ? "badge-green" : "badge-gray"}`}>{u.status}</span>
              <select value={u.role} onChange={e => setUserRole(u, e.target.value)} style={{ padding: 6, borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }}>
                {["SUPER_ADMIN", "ADMIN", "OPERATOR", "SUPPORT", "VIEWER"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="btn btn-sm btn-secondary" onClick={() => toggleUserStatus(u)}>
                {u.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <label className="field"><span>Email</span><input value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} type="email" /></label>
          <label className="field"><span>Name</span><input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} /></label>
          <label className="field"><span>Password</span><input value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} type="password" /></label>
          <label className="field"><span>Role</span>
            <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
              {["SUPER_ADMIN", "ADMIN", "OPERATOR", "SUPPORT", "VIEWER"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <button className="btn btn-block" onClick={createUser}>Create User</button>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Plans</h2>
        {plans.map(p => (
          <div key={p.id} className="list-card" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="main">
              <div className="title">{p.name} <span className="badge badge-blue">{p.code}</span></div>
              <div className="meta">{Object.entries(p.limits).map(([k, v]) => `${k}: ${v}`).join(" • ")}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}