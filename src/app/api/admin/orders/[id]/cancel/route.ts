import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ORDER_STATUS } from '@/lib/config';

// POST /api/admin/orders/[id]/cancel — 手動作廢（只作廢待結帳的單）
// body: { reason? }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: '找不到訂單' }, { status: 404 });
  }
  if (order.status === ORDER_STATUS.PAID) {
    return NextResponse.json(
      { error: '已結帳的單無法作廢（需退款流程）' },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: ORDER_STATUS.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: body.reason?.trim() || '人工作廢',
    },
    include: { table: { select: { number: true } }, items: true },
  });
  return NextResponse.json(updated);
}
