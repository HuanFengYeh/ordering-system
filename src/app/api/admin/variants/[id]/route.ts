import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/variants/[id]  body: { label?, price? }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { label, price } = await req.json();
  const variant = await prisma.variant.update({
    where: { id: Number(params.id) },
    data: {
      ...(label !== undefined ? { label: String(label).trim() } : {}),
      ...(price !== undefined ? { price: Math.max(0, Number(price) || 0) } : {}),
    },
  });
  return NextResponse.json(variant);
}

// DELETE /api/admin/variants/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.variant.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: '此規格已被訂單使用，無法刪除。' },
      { status: 409 }
    );
  }
}
