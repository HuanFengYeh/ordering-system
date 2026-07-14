import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

// GET /api/admin/tables — 所有桌位
export async function GET() {
  const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } });
  return NextResponse.json(tables);
}

// POST /api/admin/tables  body: { number? } — 未給 number 則自動取下一個
export async function POST(req: Request) {
  let number: number | undefined;
  try {
    const body = await req.json();
    number = body.number ? Number(body.number) : undefined;
  } catch {
    number = undefined;
  }

  if (!number) {
    const max = await prisma.table.aggregate({ _max: { number: true } });
    number = (max._max.number ?? 0) + 1;
  }

  const exists = await prisma.table.findUnique({ where: { number } });
  if (exists) {
    return NextResponse.json({ error: `桌號 ${number} 已存在` }, { status: 409 });
  }

  const table = await prisma.table.create({
    data: { number, token: crypto.randomBytes(8).toString('hex') },
  });
  return NextResponse.json(table, { status: 201 });
}
