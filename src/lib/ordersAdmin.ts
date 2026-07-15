import { prisma } from './prisma';
import { ORDER_STATUS, ORDER_TYPE } from './config';
import { expireMinutes, taipeiDayBounds } from './businessDay';

// 把逾時未結（超過設定分鐘數）的待結帳單自動作廢。
// expireExempt 為 true 的（曾被人工還原）不受影響。
// 回傳這次作廢了幾筆。
export async function expireStaleOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - expireMinutes() * 60 * 1000);
  const res = await prisma.order.updateMany({
    where: {
      status: ORDER_STATUS.SUBMITTED,
      expireExempt: false,
      createdAt: { lt: cutoff },
    },
    data: {
      status: ORDER_STATUS.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: `逾時未結（${expireMinutes()} 分鐘）自動作廢`,
    },
  });
  return res.count;
}

export type DaySummary = {
  businessDate: string;
  totalRevenue: number;
  orderCount: number;
  dineInRevenue: number;
  dineInCount: number;
  takeoutRevenue: number;
  takeoutCount: number;
  cancelledCount: number;
  unpaidCount: number; // 目前仍待結帳的張數（即時，不受營業日限制）
  avgTicket: number; // 平均客單價
};

// 計算某個台灣營業日的營收總結（以 paidAt 落在該日者為準）
export async function computeDaySummary(ref: Date = new Date()): Promise<DaySummary> {
  const { start, end, key } = taipeiDayBounds(ref);

  const paid = await prisma.order.findMany({
    where: { status: ORDER_STATUS.PAID, paidAt: { gte: start, lt: end } },
    select: { total: true, orderType: true },
  });

  let totalRevenue = 0;
  let dineInRevenue = 0;
  let dineInCount = 0;
  let takeoutRevenue = 0;
  let takeoutCount = 0;
  for (const o of paid) {
    totalRevenue += o.total;
    if (o.orderType === ORDER_TYPE.TAKEOUT) {
      takeoutRevenue += o.total;
      takeoutCount++;
    } else {
      dineInRevenue += o.total;
      dineInCount++;
    }
  }
  const orderCount = paid.length;

  const cancelledCount = await prisma.order.count({
    where: {
      status: ORDER_STATUS.CANCELLED,
      cancelledAt: { gte: start, lt: end },
    },
  });

  // 仍待結帳（即時）
  const unpaidCount = await prisma.order.count({
    where: { status: ORDER_STATUS.SUBMITTED },
  });

  return {
    businessDate: key,
    totalRevenue,
    orderCount,
    dineInRevenue,
    dineInCount,
    takeoutRevenue,
    takeoutCount,
    cancelledCount,
    unpaidCount,
    avgTicket: orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0,
  };
}
