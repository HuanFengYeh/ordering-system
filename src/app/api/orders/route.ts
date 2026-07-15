import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ORDER_STATUS, ORDER_TYPE } from '@/lib/config';

// POST /api/orders — 客人送出訂單（公開，供掃碼點餐使用）
// 櫃檯讀取訂單改用受保護的 /api/admin/orders
// body: { token?, orderType?, pickupName?, items: [{ variantId, quantity, note? }] }
//   內用：需 token（桌號）
//   外帶：token 可省略；建議帶 pickupName（取餐姓名/電話末三碼）
export async function POST(req: Request) {
  let body: {
    token?: string;
    orderType?: string;
    pickupName?: string;
    items?: {
      variantId?: number;
      quantity?: number;
      note?: string;
      modifierOptionIds?: number[];
    }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 });
  }

  const { token, items } = body;
  const orderType =
    body.orderType === ORDER_TYPE.TAKEOUT
      ? ORDER_TYPE.TAKEOUT
      : ORDER_TYPE.DINE_IN;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: '請至少點一項' }, { status: 400 });
  }

  // 內用一定要有桌號；外帶可有可無（有掃桌上 QR 時會帶著）
  let table = null;
  if (token) {
    table = await prisma.table.findUnique({ where: { token } });
    if (!table) {
      return NextResponse.json({ error: '找不到桌位' }, { status: 404 });
    }
  }
  if (orderType === ORDER_TYPE.DINE_IN && !table) {
    return NextResponse.json({ error: '內用需要桌號' }, { status: 400 });
  }

  // 用資料庫的價格快照，不信任前端傳來的金額；連同該菜色的客製群組/選項一起載入
  const variantIds = items.map((i) => Number(i.variantId));
  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds } },
    include: {
      menuItem: {
        include: {
          modifierGroups: { include: { options: true } },
        },
      },
    },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const orderItemsData = [];
  let total = 0;
  for (const line of items) {
    const variant = variantMap.get(Number(line.variantId));
    const quantity = Math.max(1, Math.floor(Number(line.quantity) || 0));
    if (!variant) {
      return NextResponse.json(
        { error: `品項不存在: ${line.variantId}` },
        { status: 400 }
      );
    }

    // 這一項合法的選項（只接受屬於本菜色、且仍供應的選項）
    const groups = variant.menuItem.modifierGroups;
    const optionById = new Map(
      groups.flatMap((g) => g.options.map((o) => [o.id, { group: g, option: o }]))
    );
    const chosenIds = Array.from(
      new Set((line.modifierOptionIds ?? []).map((n) => Number(n)))
    );

    // 選項必須屬於本菜色且仍供應
    for (const id of chosenIds) {
      const hit = optionById.get(id);
      if (!hit || !hit.option.available) {
        return NextResponse.json(
          { error: `${variant.menuItem.name}：客製選項無效` },
          { status: 400 }
        );
      }
    }

    // 逐群組檢查必選 / 最少 / 最多數量限制
    for (const g of groups) {
      const picked = chosenIds.filter(
        (id) => optionById.get(id)?.group.id === g.id
      );
      const min = g.required ? Math.max(1, g.minSelect) : g.minSelect;
      if (picked.length < min) {
        return NextResponse.json(
          { error: `${variant.menuItem.name}：請選擇「${g.name}」` },
          { status: 400 }
        );
      }
      if (picked.length > g.maxSelect) {
        return NextResponse.json(
          { error: `${variant.menuItem.name}：「${g.name}」最多選 ${g.maxSelect} 項` },
          { status: 400 }
        );
      }
    }

    // 全含單價 = 規格價 + 已選選項加價；並快照每個選項
    const modifiersData = chosenIds.map((id) => {
      const { group, option } = optionById.get(id)!;
      return {
        optionId: option.id,
        groupName: group.name,
        label: option.label,
        priceDelta: option.priceDelta,
      };
    });
    const unitPrice =
      variant.price + modifiersData.reduce((s, m) => s + m.priceDelta, 0);
    total += unitPrice * quantity;

    orderItemsData.push({
      variantId: variant.id,
      itemName: variant.menuItem.name,
      variantLabel: variant.label,
      price: unitPrice,
      quantity,
      note: line.note?.trim() || null,
      modifiers: { create: modifiersData },
    });
  }

  const order = await prisma.order.create({
    data: {
      tableId: table?.id ?? null,
      orderType,
      pickupName: body.pickupName?.trim() || null,
      status: ORDER_STATUS.SUBMITTED,
      total,
      items: { create: orderItemsData },
    },
    include: { items: true, table: { select: { number: true } } },
  });

  return NextResponse.json(order, { status: 201 });
}
