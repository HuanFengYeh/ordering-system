import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/modifier-groups
// body: { menuItemId, name, required?, minSelect?, maxSelect? }
export async function POST(req: Request) {
  const { menuItemId, name, required, minSelect, maxSelect } = await req.json();
  if (!menuItemId || !name?.trim()) {
    return NextResponse.json({ error: '請輸入群組名稱' }, { status: 400 });
  }
  const max = await prisma.modifierGroup.aggregate({
    where: { menuItemId: Number(menuItemId) },
    _max: { sort: true },
  });
  const group = await prisma.modifierGroup.create({
    data: {
      menuItemId: Number(menuItemId),
      name: name.trim(),
      required: Boolean(required),
      minSelect: Math.max(0, Number(minSelect) || 0),
      maxSelect: Math.max(1, Number(maxSelect) || 1),
      sort: (max._max.sort ?? -1) + 1,
    },
    include: { options: true },
  });
  return NextResponse.json(group, { status: 201 });
}
