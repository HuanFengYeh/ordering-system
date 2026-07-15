import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeDaySummary, expireStaleOrders } from '@/lib/ordersAdmin';
import { ownerPinOk } from '@/lib/owner';

export const dynamic = 'force-dynamic';

// GET /api/admin/close — 今日即時總結 + 歷史收班紀錄（需老闆 PIN）
export async function GET(req: Request) {
  if (!(await ownerPinOk(req))) {
    return NextResponse.json({ error: '需要老闆 PIN' }, { status: 403 });
  }
  await expireStaleOrders();
  const today = await computeDaySummary();
  const history = await prisma.dailyClose.findMany({
    orderBy: { businessDate: 'desc' },
    take: 60,
  });
  const todayClose = history.find((h) => h.businessDate === today.businessDate);
  return NextResponse.json({ today, todayClose: todayClose ?? null, history });
}

// POST /api/admin/close — 收班：把今日總結寫入 DailyClose（可重複執行，會更新）
export async function POST(req: Request) {
  if (!(await ownerPinOk(req))) {
    return NextResponse.json({ error: '需要老闆 PIN' }, { status: 403 });
  }
  // 收班前先把逾時未結的單清掉，數字才乾淨
  await expireStaleOrders();
  const s = await computeDaySummary();

  const data = {
    totalRevenue: s.totalRevenue,
    orderCount: s.orderCount,
    dineInRevenue: s.dineInRevenue,
    dineInCount: s.dineInCount,
    takeoutRevenue: s.takeoutRevenue,
    takeoutCount: s.takeoutCount,
    cancelledCount: s.cancelledCount,
  };

  const close = await prisma.dailyClose.upsert({
    where: { businessDate: s.businessDate },
    create: { businessDate: s.businessDate, ...data },
    update: { ...data, closedAt: new Date() },
  });

  return NextResponse.json(close);
}
