import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { User } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function createToken(user: Omit<User, 'created_at'>): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    is_admin: user.is_admin
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<Omit<User, 'created_at'> | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      username: payload.username as string,
      is_admin: payload.is_admin as boolean,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Omit<User, 'created_at'> | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  return verifyToken(token);
}

export async function requireAuth(): Promise<Omit<User, 'created_at'>> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin(): Promise<Omit<User, 'created_at'>> {
  const session = await requireAuth();
  if (!session.is_admin) {
    throw new Error('Admin access required');
  }
  return session;
}
