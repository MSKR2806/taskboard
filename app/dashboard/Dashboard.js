'use client';
import { useState, useEffect, useCallback } from 'react';

const STATUSES = ['To Do', 'In Progress', 'Blocked', 'Done'];
const slug = (s) => s.toLowerCase().replace(' ', '-');
const today = () => new Date().toISOString().slice(0, 10);
const post = (url, data, method = 'POST') =>
  fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

export default function Dashboard({ user }) {
  const [tab, setTab] = useState('mine');
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [f, setF] = useState({ date: today(), status: '', owner: '' });
  const [title, setTitle] = useState('');
  const [member, setMember] = useState({ name: '', email: '', password: '' });
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const q = new URLSearchParams({
      scope: tab === 'team' ? 'team' : 'mine', date: f.date, status: f.status,
      owner: tab === 'team' ? f.owner : '',
    });
    const r = await fetch('/api/tasks?' + q);
    if (r.status === 401) { location.href = '/login'; return; }
    setTasks(await r.json());
  }, [tab, f]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch('/api/users').then((r) => r.json()).then(setUsers); }, []);

  async function update(id, patch) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    await post('/api/tasks/' + id, patch, 'PATCH');
  }
  const setPercentLocal = (id, percent) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, percent } : t)));

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await post('/api/tasks', { title, date: f.date });
    setTitle(''); load();
  }
  async function remove(id) {
    await fetch('/api/tasks/' + id, { method: 'DELETE' }); load();
  }
  async function addMember(e) {
    e.preventDefault();
    const r = await post('/api/users', member);
    const d = await r.json();
    setNote(r.ok ? `${member.name} can now log in.` : d.error);
    if (r.ok) { setMember({ name: '', email: '', password: '' }); fetch('/api/users').then((x) => x.json()).then(setUsers); }
  }
  async function logout() { await fetch('/api/logout', { method: 'POST' }); location.href = '/login'; }

  function exportCsv() {
    const rows = [['Owner', 'Date', 'Task', 'Status', 'Percent'], ...tasks.map((t) => [t.owner, t.date, t.title, t.status, t.percent])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `tasks-${f.date || 'all-dates'}.csv`; a.click();
  }

  const groups = Object.values(tasks.reduce((a, t) => {
    (a[t.owner_id] ??= { name: t.owner, items: [] }).items.push(t); return a;
  }, {}));
  const blocked = tasks.filter((t) => t.status === 'Blocked').length;

  return (
    <div className="shell">
      <header>
        <div><h1>Team Task Board</h1><span className="mute">Signed in as {user.name}</span></div>
        <button className="ghost" onClick={logout}>Log out</button>
      </header>

      <nav className="tabs">
        <button className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>My tasks</button>
        <button className={tab === 'team' ? 'on' : ''} onClick={() => setTab('team')}>Team board</button>
      </nav>

      <section className="filters">
        <label>Date<input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
        <label>Status
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="">All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        {tab === 'team' && (
          <label>Owner
            <select value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })}>
              <option value="">Everyone</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
        )}
        <button className="ghost" onClick={() => setF({ date: '', status: '', owner: '' })}>Show all dates</button>
        {tab === 'team' && <button className="btn" onClick={exportCsv}>Export CSV</button>}
      </section>

      {tab === 'mine' && (
        <>
          <form className="add" onSubmit={addTask}>
            <input placeholder="What are you working on today?" value={title} onChange={(e) => setTitle(e.target.value)} />
            <button className="btn">Add task</button>
          </form>
          {tasks.length === 0 && <p className="empty">No tasks for this filter. Add one above.</p>}
          {tasks.map((t) => (
            <article key={t.id} className={`task s-${slug(t.status)}`}>
              <div className="row">
                <strong>{t.title}</strong>
                <select value={t.status} onChange={(e) => update(t.id, { status: e.target.value, ...(e.target.value === 'Done' ? { percent: 100 } : {}) })}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <button className="ghost small" onClick={() => remove(t.id)} aria-label="Delete task">Delete</button>
              </div>
              <div className="row">
                <input type="range" min="0" max="100" step="5" value={t.percent}
                  onChange={(e) => setPercentLocal(t.id, +e.target.value)}
                  onPointerUp={(e) => update(t.id, { percent: +e.target.value })}
                  onKeyUp={(e) => update(t.id, { percent: +e.target.value })} />
                <span className="pct">{t.percent}%</span>
              </div>
            </article>
          ))}
        </>
      )}

      {tab === 'team' && (
        <>
          <p className="summary">{tasks.length} tasks · {blocked > 0 ? <b className="warn">{blocked} blocked</b> : 'nothing blocked'}</p>
          {groups.length === 0 && <p className="empty">No tasks match these filters.</p>}
          <div className="grid">
            {groups.map((g) => {
              const avg = Math.round(g.items.reduce((s, t) => s + t.percent, 0) / g.items.length);
              return (
                <section key={g.name} className="panel">
                  <div className="row"><h2>{g.name}</h2><span className="mute">{avg}% average</span></div>
                  {g.items.map((t) => (
                    <div key={t.id} className={`line s-${slug(t.status)}`}>
                      <div className="row"><span>{t.title}</span><em>{t.status}</em></div>
                      <div className="bar"><i style={{ width: t.percent + '%' }} /></div>
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
          {user.role === 'admin' && (
            <form className="panel add-member" onSubmit={addMember}>
              <h2>Add a team member</h2>
              <input placeholder="Name" value={member.name} onChange={(e) => setMember({ ...member, name: e.target.value })} required />
              <input type="email" placeholder="Email" value={member.email} onChange={(e) => setMember({ ...member, email: e.target.value })} required />
              <input type="text" placeholder="Password (6+ characters)" value={member.password} onChange={(e) => setMember({ ...member, password: e.target.value })} required />
              <button className="btn">Add member</button>
              {note && <p className="mute">{note}</p>}
            </form>
          )}
        </>
      )}
    </div>
  );
}
