import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { expireStaleOrders } from '@/lib/ordersAdmin';
import { taipeiDayBounds } from '@/lib/businessDay';

export const dynamic = 'force-dynamic';

// GET /api/admin/orders?status=SUBMITTED&day=today
//   status: SUBMITTED / PAID / CANCELLED（省略=全部）
//   day: today（預設，只看台灣今天）/ all（不限日期）
// 每次讀取會先把逾時未結的單自動作廢。
export async function GET(req: Request) {
  await expireStaleOrders();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  const day = searchParams.get('day') ?? 'today';

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  if (day !== 'all') {
    const { start, end } = taipeiDayBounds();
    // 今日 = 當天建立的、或當天結帳的單都算（跨界少見，取聯集較保險）
    where.OR = [
      { createdAt: { gte: start, lt: end } },
      { paidAt: { gte: start, lt: end } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      table: { select: { number: true } },
      items: { include: { modifiers: true } },
    },
  });
  return NextResponse.json(orders);
}
