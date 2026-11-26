import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export async function createSession(user) {
  const token = await new SignJWT({ id: user.id, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(key());
  cookies().set('session', token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, key())).payload; } catch { return null; }
}
