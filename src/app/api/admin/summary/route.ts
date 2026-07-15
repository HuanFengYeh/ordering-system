import { NextResponse } from 'next/server';
import { computeDaySummary, expireStaleOrders } from '@/lib/ordersAdmin';

export const dynamic = 'force-dynamic';

// GET /api/admin/summary — 今日（台灣營業日）即時營業總結
export async function GET() {
  await expireStaleOrders();
  const summary = await computeDaySummary();
  return NextResponse.json(summary);
}
