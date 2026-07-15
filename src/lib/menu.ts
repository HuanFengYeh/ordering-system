import { prisma } from './prisma';
import type { Category } from './types';

// 客人端菜單（僅可販售品項），內用與外帶頁共用
export async function getCustomerMenu(): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    orderBy: { sort: 'asc' },
    include: {
      items: {
        where: { available: true },
        orderBy: { sort: 'asc' },
        include: {
          variants: { orderBy: { sort: 'asc' } },
          modifierGroups: {
            orderBy: { sort: 'asc' },
            include: {
              // 只給客人看仍在供應的選項
              options: {
                where: { available: true },
                orderBy: { sort: 'asc' },
                // 連動菜單品項時，名稱與價格以來源規格為準
                include: { sourceVariant: { include: { menuItem: true } } },
              },
            },
          },
        },
      },
    },
  });

  // 解析「連動菜單品項」的加點選項：名稱/價格跟著菜單走；來源停售則隱藏
  const resolved = categories.map((c) => ({
    ...c,
    items: c.items.map((it) => ({
      ...it,
      modifierGroups: it.modifierGroups.map((g) => ({
        ...g,
        options: g.options
          .filter(
            (o) =>
              !o.sourceVariantId ||
              (o.sourceVariant != null && o.sourceVariant.menuItem.available)
          )
          .map((o) => {
            if (!o.sourceVariant) return o;
            const sv = o.sourceVariant;
            return {
              ...o,
              label: sv.menuItem.name + (sv.label ? `（${sv.label}）` : ''),
              priceDelta: sv.price,
            };
          }),
      })),
    })),
  }));

  return resolved as unknown as Category[];
}
