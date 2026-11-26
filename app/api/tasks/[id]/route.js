import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

const STATUSES = ['To Do', 'In Progress', 'Blocked', 'Done'];

export async function PATCH(req, { params }) {
  const s = await getSession();
  if (!s) return Response.json({ error: 'Not logged in' }, { status: 401 });
  const body = await req.json();
  const status = STATUSES.includes(body.status) ? body.status : null;
  const percent = Number.isFinite(body.percent) ? Math.min(100, Math.max(0, Math.round(body.percent))) : null;
  await sql`UPDATE tasks SET status = COALESCE(${status}::text, status), percent = COALESCE(${percent}::int, percent)
            WHERE id = ${Number(params.id)} AND user_id = ${s.id}`;
  return Response.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const s = await getSession();
  if (!s) return Response.json({ error: 'Not logged in' }, { status: 401 });
  await sql`DELETE FROM tasks WHERE id = ${Number(params.id)} AND user_id = ${s.id}`;
  return Response.json({ ok: true });
}
