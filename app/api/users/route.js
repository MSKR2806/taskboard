import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return Response.json([], { status: 401 });
  return Response.json(await sql`SELECT id, name FROM users ORDER BY name`);
}

export async function POST(req) {
  const s = await getSession();
  if (!s || s.role !== 'admin') return Response.json({ error: 'Only the admin can add members.' }, { status: 403 });
  const { name = '', email = '', password = '' } = await req.json();
  if (!name.trim() || !email.trim() || password.length < 6) {
    return Response.json({ error: 'Enter a name, an email and a password of 6+ characters.' }, { status: 400 });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await sql`INSERT INTO users (name,email,password_hash) VALUES (${name.trim()},${email.trim().toLowerCase()},${hash})`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'That email is already in use.' }, { status: 409 });
  }
}
