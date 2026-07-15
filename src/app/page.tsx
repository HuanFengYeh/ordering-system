import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { RESTAURANT_NAME, RESTAURANT_SUBTITLE } from '@/lib/config';
import { IconTakeout } from '@/app/icons';

// 桌位清單即時變動，不可靜態快取
export const dynamic = 'force-dynamic';

// 首頁：開發 / 展示用入口。實務上客人是掃 QR 直接進 /order/[token]。
export default async function Home() {
  const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } });

  return (
    <>
      <div className="appbar">
        <div>
          <span className="brand">{RESTAURANT_NAME}</span>{' '}
          <span className="sub">{RESTAURANT_SUBTITLE}</span>
        </div>
        <Link href="/admin/orders" style={{ color: '#fff', fontWeight: 700 }}>
          櫃檯 →
        </Link>
      </div>

      <div className="container">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>櫃檯</h2>
          <Link href="/admin/orders" className="btn-primary" style={{ display: 'inline-block', padding: '10px 20px' }}>
            訂單管理 / 結帳
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>外帶</h2>
          <Link
            href="/order/takeout"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
            }}
          >
            <IconTakeout size={18} />
            外帶點餐（不綁桌）
          </Link>
        </div>

        <h2>各桌 QR 連結（測試用）</h2>
        <p style={{ color: '#888', fontSize: 14 }}>
          實際部署時，把每桌的連結產生成 QR code 貼在桌上。掃碼即進入該桌點餐頁。
        </p>
        <div className="card">
          {tables.map((t) => (
            <div key={t.id} className="variant-row">
              <span>桌 {t.number}</span>
              <Link href={`/order/${t.token}`}>/order/{t.token} →</Link>
            </div>
          ))}
          {tables.length === 0 && (
            <div className="empty">尚無桌位，請先執行 pnpm run db:seed</div>
          )}
        </div>
      </div>
    </>
  );
}
