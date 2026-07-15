import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ORDER_STATUS } from '@/lib/config';

// POST /api/admin/orders/[id]/restore — 把作廢的單還原回待結帳
// 還原後設 expireExempt=true，改由人工控管、不再自動過期。
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: '找不到訂單' }, { status: 404 });
  }
  if (order.status !== ORDER_STATUS.CANCELLED) {
    return NextResponse.json(
      { error: '只有已作廢的單可以還原' },
      { status: 409 }
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: ORDER_STATUS.SUBMITTED,
      cancelledAt: null,
      cancelReason: null,
      expireExempt: true,
    },
    include: { table: { select: { number: true } }, items: true },
  });
  return NextResponse.json(updated);
}
