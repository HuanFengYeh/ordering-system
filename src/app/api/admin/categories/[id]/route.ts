import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/categories/[id]  body: { name?, note? }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { name, note } = await req.json();
  const category = await prisma.category.update({
    where: { id: Number(params.id) },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(note !== undefined ? { note: String(note).trim() || null } : {}),
    },
  });
  return NextResponse.json(category);
}

// DELETE /api/admin/categories/[id] — 連同底下菜色與變體一併刪除
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  try {
    // 先刪變體、菜色，再刪分類（避免外鍵限制）
    const items = await prisma.menuItem.findMany({
      where: { categoryId: id },
      select: { id: true },
    });
    const itemIds = items.map((i) => i.id);
    await prisma.variant.deleteMany({ where: { menuItemId: { in: itemIds } } });
    await prisma.menuItem.deleteMany({ where: { categoryId: id } });
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: '此分類含有已被訂單使用的品項，無法刪除。請改為停售各品項。' },
      { status: 409 }
    );
  }
}
