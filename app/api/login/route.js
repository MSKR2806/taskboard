import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req) {
  const { email = '', password = '' } = await req.json();
  const rows = await sql`SELECT * FROM users WHERE email = ${email.trim().toLowerCase()}`;
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }
  await createSession(user);
  return Response.json({ ok: true });
}
