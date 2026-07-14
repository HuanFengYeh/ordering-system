import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/items/[id]  body: { name?, description?, available? }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { name, description, available } = await req.json();
  const item = await prisma.menuItem.update({
    where: { id: Number(params.id) },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(description !== undefined
        ? { description: String(description).trim() || null }
        : {}),
      ...(available !== undefined ? { available: Boolean(available) } : {}),
    },
  });
  return NextResponse.json(item);
}

// DELETE /api/admin/items/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  try {
    await prisma.variant.deleteMany({ where: { menuItemId: id } });
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: '此品項已被訂單使用，無法刪除。請改為停售。' },
      { status: 409 }
    );
  }
}
