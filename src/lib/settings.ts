import crypto from 'node:crypto';
import { prisma } from './prisma';

// 後台可調設定：優先讀資料庫，未設定時回退環境變數。
// 密碼 / PIN 一律存 SHA-256 雜湊（加 AUTH_SECRET 當鹽），不存明文。

async function get(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

function hash(s: string): string {
  return crypto
    .createHash('sha256')
    .update(s + (process.env.AUTH_SECRET ?? ''))
    .digest('hex');
}

// —— 櫃檯密碼 ——
// 救援設計：Vercel 環境變數 ADMIN_PASSWORD 是「永久救援金鑰」，
// 即使之後在後台改過密碼、又忘記，用這組一律能登入再重設。
export async function checkAdminPassword(input: string): Promise<boolean> {
  const env = process.env.ADMIN_PASSWORD;
  if (env && input === env) return true;
  const dbHash = await get('admin_password_hash');
  return !!dbHash && hash(input) === dbHash;
}
export async function setAdminPassword(next: string): Promise<void> {
  await setSetting('admin_password_hash', hash(next));
}

// —— 老闆 PIN ——
// 同樣：環境變數 OWNER_PIN 為永久救援金鑰。
export async function checkOwnerPin(input: string): Promise<boolean> {
  const env = process.env.OWNER_PIN;
  if (env && input === env) return true;
  const dbHash = await get('owner_pin_hash');
  return !!dbHash && hash(input) === dbHash;
}
export async function setOwnerPin(next: string): Promise<void> {
  await setSetting('owner_pin_hash', hash(next));
}
export async function ownerPinConfigured(): Promise<boolean> {
  return (await get('owner_pin_hash')) !== null || !!process.env.OWNER_PIN;
}
export async function adminPasswordCustomized(): Promise<boolean> {
  return (await get('admin_password_hash')) !== null;
}

// —— 出單方式 ——
export type PrintMode = 'browser' | 'cloudprnt' | 'both';
export async function getPrintMode(): Promise<PrintMode> {
  const v = ((await get('print_mode')) ?? process.env.PRINT_MODE ?? 'browser')
    .toLowerCase()
    .trim();
  return v === 'cloudprnt' || v === 'both' ? (v as PrintMode) : 'browser';
}
export async function setPrintMode(mode: PrintMode): Promise<void> {
  await setSetting('print_mode', mode);
}

// —— CloudPRNT 保護金鑰 ——
export async function getCloudprntKey(): Promise<string> {
  return (await get('cloudprnt_key')) ?? process.env.CLOUDPRNT_KEY ?? '';
}
export async function setCloudprntKey(key: string): Promise<void> {
  await setSetting('cloudprnt_key', key);
}
