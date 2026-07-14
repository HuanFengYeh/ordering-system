// 櫃檯後台認證（單一共用密碼，MVP 等級）
export const ADMIN_COOKIE = 'admin_session';

// 登入成功後 cookie 存的值就是 AUTH_SECRET。
// middleware 只需比對 cookie 值 === AUTH_SECRET。
// AUTH_SECRET 只存在伺服器端，前端無法得知，因此無法偽造。
export function sessionValue(): string {
  return process.env.AUTH_SECRET ?? '';
}

export function isValidSession(cookieValue: string | undefined): boolean {
  const secret = sessionValue();
  return !!secret && cookieValue === secret;
}
