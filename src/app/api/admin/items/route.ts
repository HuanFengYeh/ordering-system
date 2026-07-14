import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/items  body: { categoryId, name, description?, price? }
// 建立菜色時同時建立一個預設變體（單一價），price 未給預設 0
export async function POST(req: Request) {
  const { categoryId, name, description, price } = await req.json();
  if (!categoryId || !name?.trim()) {
    return NextResponse.json({ error: '請輸入品項名稱' }, { status: 400 });
  }
  const max = await prisma.menuItem.aggregate({
    where: { categoryId: Number(categoryId) },
    _max: { sort: true },
  });
  const item = await prisma.menuItem.create({
    data: {
      categoryId: Number(categoryId),
      name: name.trim(),
      description: description?.trim() || null,
      sort: (max._max.sort ?? -1) + 1,
      variants: {
        create: [{ label: '', price: Math.max(0, Number(price) || 0), sort: 0 }],
      },
    },
    include: { variants: true },
  });
  return NextResponse.json(item, { status: 201 });
}
