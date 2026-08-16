"use client";

import { useEffect, useState } from "react";
import { api, timeAgo } from "../lib";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", planCode: "FREE" });
  const [toast, setToast] = useState("");

  const load = (s = "") => api(`/customers?search=${encodeURIComponent(s)}`).then(r => setCustomers(r.customers)).catch(() => {});

  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await api("/customers", { method: "POST", body: form });
      setToast("Customer created.");
      setShowCreate(false);
      setForm({ name: "", email: "", planCode: "FREE" });
      load();
    } catch (err) {
      setToast(err.message);
    }
  };

  const toggleStatus = async (c) => {
    const next = c.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await api(`/customers/${c.id}`, { method: "PATCH", body: { status: next } });
    setToast(`${c.name} ${next.toLowerCase()}.`);
    load(search);
  };

  return (
    <>
      <div className="spread">
        <h1 className="page-title">Customers</h1>
        <button className="btn" onClick={() => setShowCreate(!showCreate)}>{showCreate ? "Cancel" : "+ New"}</button>
      </div>

      {showCreate && (
        <div className="card">
          <h2 className="section-title">Create Customer</h2>
          <label className="field"><span>Name</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field"><span>Email</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label className="field"><span>Plan</span>
            <select value={form.planCode} onChange={e => setForm({ ...form, planCode: e.target.value })}>
              {["FREE", "STARTER", "PRO", "PREMIUM", "BUSINESS", "ENTERPRISE"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <button className="btn btn-block" onClick={create}>Create</button>
        </div>
      )}

      {toast && <div className="toast success">{toast}</div>}

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <input placeholder="Search customers…" value={search} onChange={e => { setSearch(e.target.value); }} />
          <button className="btn btn-secondary" onClick={() => load(search)}>Search</button>
        </div>
        {!customers.length && <div className="empty">No customers found.</div>}
        {customers.map(c => (
          <div key={c.id} className="list-card" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="main">
              <div className="title">{c.name}</div>
              <div className="meta">{c.email || "no email"} • {c.plan_id ? "plan set" : "no plan"} • {timeAgo(c.created_at)}</div>
            </div>
            <div className="row">
              <span className={`badge ${c.status === "ACTIVE" ? "badge-green" : "badge-red"}`}>{c.status}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => toggleStatus(c)}>
                {c.status === "ACTIVE" ? "Suspend" : "Reactivate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}