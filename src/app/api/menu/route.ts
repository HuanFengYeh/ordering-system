import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/menu — 回傳可販售的菜單（分類 → 菜色 → 變體）
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sort: 'asc' },
    include: {
      items: {
        where: { available: true },
        orderBy: { sort: 'asc' },
        include: {
          variants: { orderBy: { sort: 'asc' } },
        },
      },
    },
  });
  return NextResponse.json(categories);
}
