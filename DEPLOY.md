# 部署上線指南（Vercel + Neon Postgres）

資料庫已改為 **PostgreSQL**，可直接上 Vercel（serverless）。以下用 **Neon**（免費 Postgres）示範，全程免費即可跑起來，之後再視流量升級。

---

## 一次性準備

### 1. 建 Neon 資料庫
1. 到 <https://neon.tech> 註冊、建一個 Project（區域選離台灣近的，如 Singapore）。
2. 建好後在 **Connection Details** 會看到連線字串。你需要兩條：
   - **Pooled**（含 `-pooler`，給 app 用）→ 之後填入 `DATABASE_URL`
   - **Direct**（不含 `-pooler`，給 migration 用）→ 之後填入 `DIRECT_URL`
   兩條都要加上 `?sslmode=require`。Pooled 那條再加 `&pgbouncer=true`，例如：
   ```
   DATABASE_URL = postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
   DIRECT_URL   = postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

### 2. 程式碼推上 GitHub
```bash
cd ordering-system
git init && git add -A && git commit -m "init ordering system"
# 在 GitHub 建一個 repo 後：
git remote add origin git@github.com:你的帳號/ordering-system.git
git push -u origin main
```
（`.env`、`node_modules` 已被 `.gitignore` 排除，不會外洩密碼。）

### 3. 匯入 Vercel
1. 到 <https://vercel.com> 用 GitHub 登入 → **Add New… → Project** → 選這個 repo。
2. Framework 會自動偵測為 **Next.js**，Build/Output 設定用預設即可
   （build 指令已在 `package.json` 設為 `prisma generate && prisma migrate deploy && next build`，
   會在部署時自動套用資料庫 migration）。
3. 在 **Environment Variables** 填入下面這些，然後 Deploy。

### 4. 環境變數（Vercel → Settings → Environment Variables）

| 變數 | 值 | 說明 |
|---|---|---|
| `DATABASE_URL` | Neon **pooled** 字串 | app 連線用 |
| `DIRECT_URL` | Neon **direct** 字串 | migration 用 |
| `ADMIN_PASSWORD` | 你的櫃檯密碼 | **務必改掉** |
| `AUTH_SECRET` | 一長串隨機字元 | 產生方式：`openssl rand -hex 32` |
| `PRINT_MODE` | `browser`（或 `cloudprnt`/`both`） | 出單方式 |
| `PRINT_COLS` | `48`（80mm）或 `32`（58mm） | 收據紙寬 |
| `PUBLIC_BASE_URL` | 你的正式網址，如 `https://juju-order.vercel.app` | QR/連結才正確 |
| `CLOUDPRNT_KEY` | （選用）自訂金鑰 | 用雲端出單機時保護端點 |

> `PUBLIC_BASE_URL` 第一次部署還不知道網址，可先留空，部署後拿到 `xxx.vercel.app`
> 再回來填、重新 Deploy 一次。

### 5. 灌入菜單種子資料（只做一次）
Migration 只建表、不含菜單。第一次部署後在本機對著 Neon 灌一次資料：
```bash
# 用 Neon 的 direct 字串
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" node prisma/seed.mjs
```
之後改菜單改用後台 `/admin/menu`，不需要再跑 seed。

---

## 完成後
- 正式網址：`https://你的專案.vercel.app`
- 櫃檯後台：`/admin/login`
- 各桌 QR：`/admin/tables/print`（記得 `PUBLIC_BASE_URL` 已設對，QR 才會指向正式網址）

## 日後更新
改完程式 `git push`，Vercel 會自動重新部署並套用新的 migration。
改了 `schema.prisma` 要先在本機 `npm run db:migrate` 產生 migration 檔再 push。

## 備份
Neon 免費方案有分支/還原點；重要資料建議定期到 Neon 後台匯出，或升級付費方案取得自動備份。

---

## 想省錢改用其他平台？
- **Zeabur / Railway**：一樣填上面這些環境變數即可；它們也能直接跑這個 Next.js 專案。
- 若改回 SQLite（僅限有持久硬碟的平台），把 `schema.prisma` 的 `provider` 改回 `sqlite`、
  `DATABASE_URL` 改為 `file:./dev.db`、移除 `directUrl`，並掛一個 volume 存該檔。
