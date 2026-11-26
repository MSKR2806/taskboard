import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Dashboard from './Dashboard';

export default async function Page() {
  const s = await getSession();
  if (!s) redirect('/login');
  return <Dashboard user={{ id: s.id, name: s.name, role: s.role }} />;
}
