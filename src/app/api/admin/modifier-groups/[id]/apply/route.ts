import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/modifier-groups/[id]/apply
// body: { categoryIds: number[] }
// 把這個群組（含選項、連動關係）複製到所指定分類的所有品項，
// 覆蓋同名群組。用於「一組加點設定 → 一鍵套用到所有主餐」。
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { categoryIds } = await req.json();
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    return NextResponse.json({ error: '請選擇要套用的分類' }, { status: 400 });
  }

  const src = await prisma.modifierGroup.findUnique({
    where: { id: Number(params.id) },
    include: { options: { orderBy: { sort: 'asc' } } },
  });
  if (!src) {
    return NextResponse.json({ error: '找不到來源群組' }, { status: 404 });
  }

  const cats = await prisma.category.findMany({
    where: { id: { in: categoryIds.map(Number) } },
    include: { items: true },
  });

  let applied = 0;
  for (const cat of cats) {
    for (const item of cat.items) {
      if (item.id === src.menuItemId) continue; // 跳過來源品項本身
      // 覆蓋：先移除同名群組，再複製一份（保留連動 sourceVariantId）
      await prisma.modifierGroup.deleteMany({
        where: { menuItemId: item.id, name: src.name },
      });
      const mx = await prisma.modifierGroup.aggregate({
        where: { menuItemId: item.id },
        _max: { sort: true },
      });
      await prisma.modifierGroup.create({
        data: {
          menuItemId: item.id,
          name: src.name,
          required: src.required,
          minSelect: src.minSelect,
          maxSelect: src.maxSelect,
          sort: (mx._max.sort ?? -1) + 1,
          options: {
            create: src.options.map((o, i) => ({
              label: o.label,
              priceDelta: o.priceDelta,
              available: o.available,
              sort: i,
              sourceVariantId: o.sourceVariantId,
            })),
          },
        },
      });
      applied++;
    }
  }

  return NextResponse.json({ applied });
}
