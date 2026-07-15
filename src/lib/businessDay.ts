// 營業日以「台灣時間（UTC+8，固定不含日光節約）」的 00:00 為分界。
// 資料庫時間存 UTC，這裡負責換算成台灣營業日的 UTC 區間。

const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// 傳回 ref 當下所屬「台灣營業日」的 UTC 起訖與日期字串
export function taipeiDayBounds(ref: Date = new Date()): {
  start: Date;
  end: Date;
  key: string; // YYYY-MM-DD（台灣時區）
} {
  // 先把時間平移到台灣牆上時間，再取其年月日
  const shifted = new Date(ref.getTime() + TAIPEI_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  // 台灣當日 00:00 對應的 UTC 時間
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0) - TAIPEI_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const key = `${y}-${pad(m + 1)}-${pad(d)}`;
  return { start, end, key };
}

// 未結帳訂單自動過期分鐘數（預設 10，可用環境變數覆寫）
export function expireMinutes(): number {
  const v = Number(process.env.ORDER_EXPIRE_MINUTES);
  return Number.isFinite(v) && v > 0 ? v : 10;
}
