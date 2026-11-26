'use client';
import { useState } from 'react';

export default function Login() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const f = new FormData(e.target);
    const r = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: f.get('email'), password: f.get('password') }),
    });
    if (r.ok) { location.href = '/dashboard'; return; }
    setError((await r.json()).error || 'Could not log in.');
    setBusy(false);
  }

  return (
    <main className="login">
      <form onSubmit={submit} className="panel">
        <h1>Team Task Board</h1>
        <p className="mute">Log in to update today’s tasks.</p>
        <label>Email<input name="email" type="email" required autoFocus /></label>
        <label>Password<input name="password" type="password" required /></label>
        {error && <p className="err">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="mute small">Demo: ravi@demo.com / demo123 · admin: admin@demo.com / admin123</p>
      </form>
    </main>
  );
}
