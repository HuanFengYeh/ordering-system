import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ORDER_STATUS } from '@/lib/config';

// 出單方式：browser（瀏覽器列印，預設）/ cloudprnt（雲端出單機）/ both
function printMode(): 'browser' | 'cloudprnt' | 'both' {
  const m = (process.env.PRINT_MODE || 'browser').toLowerCase();
  return m === 'cloudprnt' || m === 'both' ? m : 'browser';
}

// POST /api/admin/orders/[id]/pay — 結帳，狀態改為 PAID，並依設定排入出單佇列
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: '找不到訂單' }, { status: 404 });
  }
  if (order.status === ORDER_STATUS.PAID) {
    return NextResponse.json({ error: '此訂單已結帳' }, { status: 409 });
  }

  const mode = printMode();
  const queueCloud = mode === 'cloudprnt' || mode === 'both';
  const openBrowserPrint = mode === 'browser' || mode === 'both';

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: ORDER_STATUS.PAID,
      paidAt: new Date(),
      printQueued: queueCloud, // 雲端出單機會輪詢抓走
    },
    include: { table: { select: { number: true } }, items: true },
  });

  return NextResponse.json({ order: updated, openBrowserPrint });
}
