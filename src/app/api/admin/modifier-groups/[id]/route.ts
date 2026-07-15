import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/modifier-groups/[id]
// body: { name?, required?, minSelect?, maxSelect? }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { name, required, minSelect, maxSelect } = await req.json();
  const group = await prisma.modifierGroup.update({
    where: { id: Number(params.id) },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(required !== undefined ? { required: Boolean(required) } : {}),
      ...(minSelect !== undefined
        ? { minSelect: Math.max(0, Number(minSelect) || 0) }
        : {}),
      ...(maxSelect !== undefined
        ? { maxSelect: Math.max(1, Number(maxSelect) || 1) }
        : {}),
    },
  });
  return NextResponse.json(group);
}

// DELETE /api/admin/modifier-groups/[id]
// 刪除群組會連同其選項一併移除；歷史訂單的客製快照不受影響（optionId 設為 null，
// 名稱/加價已另存快照）。故一律可刪，不需保護。
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.modifierGroup.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
