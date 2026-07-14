import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tables/[token] — 用 QR token 找桌位
export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const table = await prisma.table.findUnique({
    where: { token: params.token },
    select: { id: true, number: true, token: true },
  });
  if (!table) {
    return NextResponse.json({ error: '找不到桌位' }, { status: 404 });
  }
  return NextResponse.json(table);
}
