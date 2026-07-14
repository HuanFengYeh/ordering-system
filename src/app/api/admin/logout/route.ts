import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/auth';

// POST /api/admin/logout — 清除 session cookie
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
