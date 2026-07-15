import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/modifier-options/[id]
// body: { label?, priceDelta?, available? }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { label, priceDelta, available } = await req.json();
  const option = await prisma.modifierOption.update({
    where: { id: Number(params.id) },
    data: {
      ...(label !== undefined ? { label: String(label).trim() } : {}),
      ...(priceDelta !== undefined
        ? { priceDelta: Math.max(0, Number(priceDelta) || 0) }
        : {}),
      ...(available !== undefined ? { available: Boolean(available) } : {}),
    },
  });
  return NextResponse.json(option);
}

// DELETE /api/admin/modifier-options/[id]
// 歷史訂單客製快照以 optionId=null 保留（名稱/加價已快照），故一律可刪。
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.modifierOption.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
