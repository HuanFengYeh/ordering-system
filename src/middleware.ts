import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/auth';

// 保護 /admin、/print 頁面與 /api/admin API。
// 例外：登入頁與登入 API 必須可未登入存取。
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === '/admin/login';
  const isLoginApi = pathname === '/api/admin/login';
  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  const valid = !!cookie && cookie === process.env.AUTH_SECRET;
  if (valid) {
    return NextResponse.next();
  }

  // 未登入：API 回 401，頁面導向登入
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: '未授權' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.searchParams.set('next', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*', '/print/:path*', '/api/admin/:path*'],
};
