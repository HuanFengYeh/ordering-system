import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/items/[id]  body: { name?, description?, available? }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { name, description, available, imageUrl } = await req.json();
  // 照片以 data URL 存於 DB；過大則拒絕（前端已壓縮，這裡設 1.5MB 上限保險）
  if (typeof imageUrl === 'string' && imageUrl.length > 1_500_000) {
    return NextResponse.json(
      { error: '照片太大，請換較小的圖片' },
      { status: 413 }
    );
  }
  const item = await prisma.menuItem.update({
    where: { id: Number(params.id) },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(description !== undefined
        ? { description: String(description).trim() || null }
        : {}),
      ...(available !== undefined ? { available: Boolean(available) } : {}),
      ...(imageUrl !== undefined
        ? { imageUrl: imageUrl ? String(imageUrl) : null }
        : {}),
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
