import { checkOwnerPin } from './settings';

// 老闆專屬第二道關卡：在已登入的後台之上，
// 敏感的營業額 / 收班資料再要求一組「老闆 PIN」。
// PIN 由前端以 x-owner-pin 標頭（或 ?pin= 查詢字串）帶入，不存 cookie、不落地。
// 密碼驗證改由 lib/settings 處理（DB 雜湊，未設定則回退環境變數）。

export async function ownerPinOk(req: Request): Promise<boolean> {
  const header = req.headers.get('x-owner-pin');
  const query = new URL(req.url).searchParams.get('pin');
  const pin = header || query;
  if (!pin) return false;
  return checkOwnerPin(pin);
}
