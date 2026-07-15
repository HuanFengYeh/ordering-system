# 桔子 點餐系統 (MVP)

掃桌上 QR → 點餐 → 送出 → 櫃檯結帳 → 出單列印。

## 技術

- Next.js 14 (App Router, TypeScript)
- Prisma + **PostgreSQL**

## 啟動（本機開發）

需要一個 PostgreSQL。`.env` 的 `DATABASE_URL` / `DIRECT_URL` 指向你的資料庫後：

```bash
npm install
npm run db:migrate   # 套用 migration（建表）
npm run db:seed      # 匯入菜單 + 產生 8 桌 QR token
npm run dev          # http://localhost:4000
```

`npm run db:reset` 可重置資料庫並重跑 migration/seed。

## 部署上線

見 [DEPLOY.md](DEPLOY.md)：Vercel + Neon Postgres 的逐步教學（含環境變數清單）。

首頁 <http://localhost:4000> 是開發用入口，列出每桌的點餐連結與櫃檯入口。

## 流程與頁面

| 角色 | 網址 | 說明 | 需登入 |
|---|---|---|---|
| 客人 | `/order/[token]` | 掃桌上 QR 進入（token 對應桌號）。可切**內用/外帶**、選菜、備註、送出 | 否 |
| 客人 | `/order/takeout` | **外帶專用**入口（不綁桌，留取餐姓名/電話末三碼）。把此頁 QR 印出貼櫃檯 | 否 |
| 櫃檯 | `/admin/orders` | 今日訂單（台灣營業日）+ 今日看板。每 4 秒刷新、新訂單嗶聲。可**結帳出單 / 作廢 / 還原**。未結超過 `ORDER_EXPIRE_MINUTES`（預設 10）分鐘自動作廢 | 是 |
| 收班 | `/admin/close` | 今日日結單（營業額、內用/外帶、作廢數）+ 收班封帳 + 列印 + 歷史紀錄 | 是 |
| 菜單 | `/admin/menu` | 新增/改名/停售/刪除 分類・品項・規格，改價 | 是 |
| 桌號 | `/admin/tables` | 新增/刪除桌、換 QR token、列印全部 QR | 是 |
| QR | `/admin/tables/print` | 各桌 QR 卡片，直接列印剪下貼桌 | 是 |
| 出單 | `/print/[id]` | 收據版面，開啟時自動叫出瀏覽器列印對話框 | 是 |

## 櫃檯登入

- 密碼設在 `.env` 的 `ADMIN_PASSWORD`（預設 `juju1234`，**正式部署請改掉**）。
- 登入後發一個 httpOnly cookie（12 小時），`/admin`、`/print`、`/api/admin` 全部由 `src/middleware.ts` 保護。
- `.env` 的 `AUTH_SECRET` 是 cookie 的驗證秘密值，正式部署請改成一長串隨機字元。

## QR code 怎麼來

每桌一組固定 token（`Table.token`）。開 `/admin/tables/print` 會自動幫**每桌產生 QR
圖**（內含 `<base>/order/<token>`），直接列印剪下貼桌即可。QR 裡的網址來源：
優先用環境變數 `PUBLIC_BASE_URL`，沒設就依請求標頭推斷。**正式部署請設定
`PUBLIC_BASE_URL=https://你的網域`**，否則 QR 可能編到 localhost。

在 `/admin/tables` 按「換 QR」會重新產生該桌 token（舊 QR 立即失效）。

## 資料模型（`prisma/schema.prisma`）

- `Table` — 桌位，含唯一 `token`
- `Category` / `MenuItem` / `Variant` — 菜單。價格掛在 `Variant`
  （同一道菜不同麵體/肉類 → 不同價；單一價格的菜色用一個 label 為空字串的 variant）
- `Order` / `OrderItem` — 訂單。菜名、規格、單價皆為**下單當下的快照**，
  之後改菜單不影響歷史訂單。`status`: `SUBMITTED` → `PAID`（或 `CANCELLED`）

## 出單 / 列印

由 `.env` 的 `PRINT_MODE` 決定：

| 模式 | 行為 |
|---|---|
| `browser`（預設） | 結帳後自動開 `/print/[id]` 網頁並跳出瀏覽器列印對話框。收據機需以系統印表機安裝在該裝置 |
| `cloudprnt` | 結帳後把訂單排入出單佇列，交給雲端出單機自動列印（免人工、自動裁紙）。不開瀏覽器 |
| `both` | 兩者都做 |

### 雲端出單機（Star CloudPRNT）

推薦 **Star mC-Print3 / TSP143IV** 這類支援 **CloudPRNT** 的 80mm 熱感機（自動裁刀、有網路孔）。
設定機器的 server URL 指向：

```
https://你的網域/api/cloudprnt
```

機器會自己輪詢抓單、印、回報。端點協定（`src/app/api/cloudprnt/route.ts`）：

- `POST` 輪詢 → 有待印單回 `{ jobReady:true, mediaTypes:['text/plain'], jobToken }`
- `GET`  抓內容 → 回收據純文字（`src/lib/receipt.ts` 產生，CJK 對齊、紙寬由 `PRINT_COLS` 控制）
- `DELETE` 回報印畢 → 寫入 `printedAt`

可選：設 `CLOUDPRNT_KEY` 後，機器 URL 要帶 `?key=xxx` 才受理。
繁中若在實機出現亂碼，代表印表機字碼表需設 UTF-8，或改用 `image/png` 出單（可再擴充）。

## 安全註記

金額一律由後端用資料庫的 `Variant.price` 重新計算，不信任前端傳來的價格；
`variantId` 不存在會回 400，重複結帳回 409。

## 尚未包含（後續可加）

- 訂單即時推播用的是**輪詢**（每 4 秒），量大時可改 WebSocket / SSE
- 多帳號 / 分級權限（目前是單一共用密碼）
- 金流串接、發票、外帶/內用區分、訂單修改與退款
