import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildReceiptText } from '@/lib/receipt';

// Star Micronics CloudPRNT 端點。
// 印表機設定裡把 server URL 填成： https://你的網域/api/cloudprnt
//
// 協定流程（皆打同一個 URL）：
//   1. POST  ── 印表機輪詢：有沒有要印的單？回 { jobReady, mediaTypes, jobToken }
//   2. GET   ── 有單時印表機來抓內容，回收據文字（text/plain）
//   3. DELETE ── 印完回報，我們標記 printedAt
//
// 出單條件：訂單 printQueued = true 且尚未 printedAt（結帳時設定，見 pay 路由）。

// 選用的簡易保護：若設了 CLOUDPRNT_KEY，URL 需帶 ?key=... 才受理。
// 印表機設定的 server URL 直接寫成 .../api/cloudprnt?key=xxx 即可。
function keyOk(req: Request): boolean {
  const required = process.env.CLOUDPRNT_KEY;
  if (!required) return true;
  const { searchParams } = new URL(req.url);
  return searchParams.get('key') === required;
}

// 找出下一筆待印訂單（最舊優先）
async function nextJob() {
  return prisma.order.findFirst({
    where: { printQueued: true, printedAt: null },
    orderBy: { paidAt: 'asc' },
    include: { table: { select: { number: true } }, items: true },
  });
}

// 1) 輪詢
export async function POST(req: Request) {
  if (!keyOk(req)) return NextResponse.json({ jobReady: false });
  const job = await nextJob();
  if (!job) {
    return NextResponse.json({ jobReady: false });
  }
  return NextResponse.json({
    jobReady: true,
    mediaTypes: ['text/plain'],
    jobToken: String(job.id),
  });
}

// 2) 抓取列印內容
export async function GET(req: Request) {
  if (!keyOk(req)) return new NextResponse('', { status: 200 });
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  const job = token
    ? await prisma.order.findUnique({
        where: { id: Number(token) },
        include: { table: { select: { number: true } }, items: true },
      })
    : await nextJob();

  if (!job) {
    // 沒內容：回 200 空白，印表機不會印
    return new NextResponse('', { status: 200 });
  }

  const text = buildReceiptText(job);
  // 注意：繁體中文需印表機的字碼表支援（多數 Star 機可設 UTF-8）。
  // 若實機出現亂碼，改用 image/png 出單即可（可再擴充）。
  return new NextResponse(text, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

// 3) 印完回報
export async function DELETE(req: Request) {
  if (!keyOk(req)) return NextResponse.json({ ok: false });
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (token) {
    await prisma.order
      .update({
        where: { id: Number(token) },
        data: { printedAt: new Date(), printQueued: false },
      })
      .catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
