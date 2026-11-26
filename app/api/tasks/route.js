import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  const s = await getSession();
  if (!s) return Response.json([], { status: 401 });
  const p = new URL(req.url).searchParams;
  const team = p.get('scope') === 'team';
  const date = p.get('date') || '';
  const status = p.get('status') || '';
  const owner = p.get('owner') || '';
  const rows = await sql`
    SELECT t.id, t.title, t.status, t.percent, to_char(t.task_date,'YYYY-MM-DD') AS date,
           u.id AS owner_id, u.name AS owner
    FROM tasks t JOIN users u ON u.id = t.user_id
    WHERE (${team}::boolean OR t.user_id = ${s.id})
      AND (${date}::text = '' OR t.task_date = ${date}::date)
      AND (${status}::text = '' OR t.status = ${status})
      AND (${owner}::text = '' OR t.user_id::text = ${owner})
    ORDER BY u.name, t.id`;
  return Response.json(rows);
}

export async function POST(req) {
  const s = await getSession();
  if (!s) return Response.json({ error: 'Not logged in' }, { status: 401 });
  const { title = '', date = '' } = await req.json();
  if (!title.trim()) return Response.json({ error: 'Task title is required.' }, { status: 400 });
  await sql`INSERT INTO tasks (user_id, title, task_date)
            VALUES (${s.id}, ${title.trim()}, COALESCE(NULLIF(${date}::text,'')::date, CURRENT_DATE))`;
  return Response.json({ ok: true });
}
