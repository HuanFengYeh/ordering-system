import { NextResponse } from 'next/server';
import { computeDaySummary, expireStaleOrders } from '@/lib/ordersAdmin';
import { ownerPinOk } from '@/lib/owner';

export const dynamic = 'force-dynamic';

// GET /api/admin/summary — 今日（台灣營業日）即時營業總結
// 敏感營業額：需老闆 PIN（x-owner-pin 標頭）。員工看不到。
export async function GET(req: Request) {
  if (!(await ownerPinOk(req))) {
    return NextResponse.json({ error: '需要老闆 PIN' }, { status: 403 });
  }
  await expireStaleOrders();
  const summary = await computeDaySummary();
  return NextResponse.json(summary);
}
