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
        include: { variants: { orderBy: { sort: 'asc' } } },
      },
    },
  });
  return categories as unknown as Category[];
}
