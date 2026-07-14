import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/orders?status=SUBMITTED — 櫃檯訂單列表
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;

  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      table: { select: { number: true } },
      items: true,
    },
  });
  return NextResponse.json(orders);
}
