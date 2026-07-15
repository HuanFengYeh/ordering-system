import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/categories — 後台完整菜單（含停售品項）
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sort: 'asc' },
    include: {
      items: {
        orderBy: { sort: 'asc' },
        include: {
          variants: { orderBy: { sort: 'asc' } },
          modifierGroups: {
            orderBy: { sort: 'asc' },
            include: {
              options: {
                orderBy: { sort: 'asc' },
                include: {
                  sourceVariant: { include: { menuItem: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  return NextResponse.json(categories);
}

// POST /api/admin/categories  body: { name, note? }
export async function POST(req: Request) {
  const { name, note } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: '請輸入分類名稱' }, { status: 400 });
  }
  const max = await prisma.category.aggregate({ _max: { sort: true } });
  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      note: note?.trim() || null,
      sort: (max._max.sort ?? -1) + 1,
    },
  });
  return NextResponse.json(category, { status: 201 });
}
