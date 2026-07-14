import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/variants  body: { menuItemId, label?, price }
export async function POST(req: Request) {
  const { menuItemId, label, price } = await req.json();
  if (!menuItemId) {
    return NextResponse.json({ error: '缺少品項' }, { status: 400 });
  }
  const max = await prisma.variant.aggregate({
    where: { menuItemId: Number(menuItemId) },
    _max: { sort: true },
  });
  const variant = await prisma.variant.create({
    data: {
      menuItemId: Number(menuItemId),
      label: (label ?? '').trim(),
      price: Math.max(0, Number(price) || 0),
      sort: (max._max.sort ?? -1) + 1,
    },
  });
  return NextResponse.json(variant, { status: 201 });
}
