import { RESTAURANT_NAME, RESTAURANT_SUBTITLE } from '@/lib/config';
import { getCustomerMenu } from '@/lib/menu';
import OrderClient from '../[token]/OrderClient';

// 菜單即時變動，不可靜態快取
export const dynamic = 'force-dynamic';

// 外帶專用入口（不綁桌號）。把這個頁的 QR 印出貼櫃檯即可。
export default async function TakeoutPage() {
  const categories = await getCustomerMenu();

  return (
    <>
      <div className="appbar">
        <div>
          <span className="brand">{RESTAURANT_NAME}</span>{' '}
          <span className="sub">{RESTAURANT_SUBTITLE}</span>
        </div>
        <span className="sub">🥡 外帶</span>
      </div>
      <OrderClient
        token={null}
        tableNumber={null}
        categories={categories}
        fixedType="TAKEOUT"
      />
    </>
  );
}
