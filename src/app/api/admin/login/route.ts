import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, sessionValue } from '@/lib/auth';
import { checkAdminPassword } from '@/lib/settings';

// POST /api/admin/login  body: { password }
export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 });
  }

  if (!body.password || !(await checkAdminPassword(body.password))) {
    return NextResponse.json({ error: '密碼錯誤' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, sessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 小時
  });
  return res;
}
