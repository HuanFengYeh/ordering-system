import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/tables/[id]  body: { regenerate: true } — 重新產生 token（換新 QR）
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  if (body.regenerate) {
    const table = await prisma.table.update({
      where: { id: Number(params.id) },
      data: { token: crypto.randomBytes(8).toString('hex') },
    });
    return NextResponse.json(table);
  }
  return NextResponse.json({ error: '無效的操作' }, { status: 400 });
}

// DELETE /api/admin/tables/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.table.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: '此桌位已有訂單紀錄，無法刪除。' },
      { status: 409 }
    );
  }
}
