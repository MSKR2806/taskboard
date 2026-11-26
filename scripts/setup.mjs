import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);

await sql`CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'
)`;
await sql`CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'To Do',
  percent INT NOT NULL DEFAULT 0,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE
)`;

const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM users`;
if (n === 0) {
  const adminHash = await bcrypt.hash('admin123', 10);
  const demoHash = await bcrypt.hash('demo123', 10);
  const [admin] = await sql`INSERT INTO users (name,email,password_hash,role) VALUES ('Team Lead','admin@demo.com',${adminHash},'admin') RETURNING id`;
  const people = [['Ravi','ravi@demo.com'],['Priya','priya@demo.com'],['Arjun','arjun@demo.com']];
  const ids = [];
  for (const [name, email] of people) {
    const [u] = await sql`INSERT INTO users (name,email,password_hash) VALUES (${name},${email},${demoHash}) RETURNING id`;
    ids.push(u.id);
  }
  const samples = [
    [ids[0],'Reconcile warehouse stock counts','In Progress',60],
    [ids[0],'Update dispatch sheet','Done',100],
    [ids[1],'Call courier about delayed pickups','Blocked',20],
    [ids[1],'Prepare weekly vendor report','In Progress',45],
    [ids[2],'Audit returns backlog','To Do',0],
    [ids[2],'Train new packer on labelling','In Progress',80],
    [admin.id,'Review team targets','To Do',0],
  ];
  for (const [uid, title, status, pct] of samples) {
    await sql`INSERT INTO tasks (user_id,title,status,percent) VALUES (${uid},${title},${status},${pct})`;
  }
  console.log('Sample data added.');
}
console.log('Database ready.');
