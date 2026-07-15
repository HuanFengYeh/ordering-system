import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/modifier-options
// body: { groupId, label, priceDelta? }
export async function POST(req: Request) {
  const { groupId, label, priceDelta } = await req.json();
  if (!groupId || !label?.trim()) {
    return NextResponse.json({ error: '請輸入選項名稱' }, { status: 400 });
  }
  const max = await prisma.modifierOption.aggregate({
    where: { groupId: Number(groupId) },
    _max: { sort: true },
  });
  const option = await prisma.modifierOption.create({
    data: {
      groupId: Number(groupId),
      label: label.trim(),
      priceDelta: Math.max(0, Number(priceDelta) || 0),
      sort: (max._max.sort ?? -1) + 1,
    },
  });
  return NextResponse.json(option, { status: 201 });
}
