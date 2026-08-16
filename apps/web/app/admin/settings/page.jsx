"use client";

import { useEffect, useState } from "react";
import { api } from "../lib";

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState("");
  const [tgForm, setTgForm] = useState({ botToken: "", chatId: "" });
  const [dcForm, setDcForm] = useState({ webhookUrl: "" });
  const [userForm, setUserForm] = useState({ email: "", name: "", password: "", role: "VIEWER" });

  const load = () => {
    api("/integrations").then(r => setIntegrations(r.integrations)).catch(() => {});
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
            <span className="badge badge-blue">{u.role}</span>
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