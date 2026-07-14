import { prisma } from '@/lib/prisma';
import { RESTAURANT_NAME, RESTAURANT_SUBTITLE } from '@/lib/config';
import { getCustomerMenu } from '@/lib/menu';
import OrderClient from './OrderClient';

// 客人掃 QR 進來的點餐頁。token 定位桌位。
export default async function OrderPage({
  params,
}: {
  params: { token: string };
}) {
  const table = await prisma.table.findUnique({
    where: { token: params.token },
    select: { number: true, token: true },
  });

  if (!table) {
    return (
      <>
        <div className="appbar">
          <span className="brand">{RESTAURANT_NAME}</span>
        </div>
        <div className="center">
          <h2>找不到桌位</h2>
          <p style={{ color: '#888' }}>QR code 可能無效，請洽櫃檯人員。</p>
        </div>
      </>
    );
  }

  const categories = await getCustomerMenu();

  return (
    <>
      <div className="appbar">
        <div>
          <span className="brand">{RESTAURANT_NAME}</span>{' '}
          <span className="sub">{RESTAURANT_SUBTITLE}</span>
        </div>
        <span className="sub">桌號 {table.number}</span>
      </div>
      <OrderClient
        token={table.token}
        tableNumber={table.number}
        categories={categories}
      />
    </>
  );
}
