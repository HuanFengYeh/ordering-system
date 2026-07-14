import {
  RESTAURANT_NAME,
  RESTAURANT_SUBTITLE,
  ORDER_TYPE_LABEL,
  ORDER_TYPE,
} from './config';

// 收據紙寬對應的「等寬半形字元數」：80mm 約 48、58mm 約 32。
export const RECEIPT_COLS = Number(process.env.PRINT_COLS) || 48;

type ReceiptOrder = {
  id: number;
  total: number;
  createdAt: Date | string;
  orderType: string;
  pickupName: string | null;
  table: { number: number } | null;
  items: {
    itemName: string;
    variantLabel: string;
    price: number;
    quantity: number;
    note: string | null;
  }[];
};

// 中日韓等全形字元佔 2 欄，其餘半形佔 1 欄
function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    const fullWidth =
      (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
      (code >= 0x2e80 && code <= 0xa4cf) || // CJK 部首、假名、漢字…
      (code >= 0xac00 && code <= 0xd7a3) || // Hangul 音節
      (code >= 0xf900 && code <= 0xfaff) || // CJK 相容漢字
      (code >= 0xfe30 && code <= 0xfe4f) || // CJK 相容標點
      (code >= 0xff00 && code <= 0xff60) || // 全形 ASCII
      (code >= 0xffe0 && code <= 0xffe6);
    w += fullWidth ? 2 : 1;
  }
  return w;
}

// 靠左字串 + 靠右字串，中間補空白填滿整行
function twoCols(left: string, right: string, cols = RECEIPT_COLS): string {
  const space = Math.max(1, cols - displayWidth(left) - displayWidth(right));
  return left + ' '.repeat(space) + right;
}

function center(s: string, cols = RECEIPT_COLS): string {
  const pad = Math.max(0, Math.floor((cols - displayWidth(s)) / 2));
  return ' '.repeat(pad) + s;
}

function divider(cols = RECEIPT_COLS): string {
  return '-'.repeat(cols);
}

// 產生純文字收據（text/plain，供 CloudPRNT 與畫面預覽共用）
export function buildReceiptText(order: ReceiptOrder): string {
  const isTakeout = order.orderType === ORDER_TYPE.TAKEOUT;
  const typeLabel = ORDER_TYPE_LABEL[order.orderType] ?? order.orderType;

  const lines: string[] = [];
  lines.push(center(RESTAURANT_NAME));
  lines.push(center(RESTAURANT_SUBTITLE));
  lines.push('');
  // 內用/外帶大字置中，廚房一眼可辨
  lines.push(center(`***  ${typeLabel}  ***`));
  const leftId = isTakeout
    ? '外帶'
    : `桌號 ${order.table?.number ?? '-'}`;
  lines.push(twoCols(leftId, `#${order.id}`));
  if (order.pickupName) lines.push(`取餐：${order.pickupName}`);
  lines.push(new Date(order.createdAt).toLocaleString('zh-TW'));
  lines.push(divider());

  for (const it of order.items) {
    const name =
      it.itemName + (it.variantLabel ? `(${it.variantLabel})` : '') +
      ` x${it.quantity}`;
    lines.push(twoCols(name, `$${it.price * it.quantity}`));
    if (it.note) lines.push(`  ※ ${it.note}`);
  }

  lines.push(divider());
  lines.push(twoCols('合計', `$${order.total}`));
  lines.push('');
  lines.push(center('謝謝惠顧　歡迎再度光臨'));
  lines.push('');
  lines.push('');

  return lines.join('\n');
}
