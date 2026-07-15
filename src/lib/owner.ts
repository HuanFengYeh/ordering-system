// 老闆專屬第二道關卡：在已登入的後台之上，
// 敏感的營業額 / 收班資料再要求一組「老闆 PIN」。
// 員工用一般密碼登入照常點餐結帳，但看不到彙總營業額。
//
// PIN 由前端以 x-owner-pin 標頭（或 ?pin= 查詢字串）帶入，不存 cookie、不落地。

export function ownerPinOk(req: Request): boolean {
  const required = process.env.OWNER_PIN;
  // 安全預設：未設定 OWNER_PIN 時一律視為未授權（營業額對所有人隱藏）。
  // 部署時務必設定 OWNER_PIN，老闆才看得到收班數字。
  if (!required) return false;

  const header = req.headers.get('x-owner-pin');
  const query = new URL(req.url).searchParams.get('pin');
  const pin = header || query;
  return !!pin && pin === required;
}
