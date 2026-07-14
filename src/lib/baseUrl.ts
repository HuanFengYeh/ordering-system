import { headers } from 'next/headers';

// 從請求標頭推斷對外的 base URL，用來組出 QR 內含的完整點餐網址。
// 若設了環境變數 PUBLIC_BASE_URL 則優先使用（正式部署建議設定）。
export function getBaseUrl(): string {
  const fromEnv = process.env.PUBLIC_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:4000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}
