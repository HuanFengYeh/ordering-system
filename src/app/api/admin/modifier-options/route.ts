import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/modifier-options
// body: { groupId, label?, priceDelta? }              → 自由填的選項
//   或 { groupId, sourceVariantId }                    → 連動既有菜單品項（名稱/價格跟菜單走）
export async function POST(req: Request) {
  const { groupId, label, priceDelta, sourceVariantId } = await req.json();
  if (!groupId) {
    return NextResponse.json({ error: '缺少群組' }, { status: 400 });
  }
  const max = await prisma.modifierOption.aggregate({
    where: { groupId: Number(groupId) },
    _max: { sort: true },
  });
  const sort = (max._max.sort ?? -1) + 1;

  // 連動菜單品項：名稱/加價由來源規格帶入（作為快照後備），並記下連結
  if (sourceVariantId) {
    const v = await prisma.variant.findUnique({
      where: { id: Number(sourceVariantId) },
      include: { menuItem: true },
    });
    if (!v) {
      return NextResponse.json({ error: '找不到菜單品項' }, { status: 400 });
    }
    const option = await prisma.modifierOption.create({
      data: {
        groupId: Number(groupId),
        sourceVariantId: v.id,
        label: v.menuItem.name + (v.label ? `（${v.label}）` : ''),
        priceDelta: v.price,
        sort,
      },
    });
    return NextResponse.json(option, { status: 201 });
  }

  if (!label?.trim()) {
    return NextResponse.json({ error: '請輸入選項名稱' }, { status: 400 });
  }
  const option = await prisma.modifierOption.create({
    data: {
      groupId: Number(groupId),
      label: label.trim(),
      priceDelta: Math.max(0, Number(priceDelta) || 0),
      sort,
    },
  });
  return NextResponse.json(option, { status: 201 });
}
