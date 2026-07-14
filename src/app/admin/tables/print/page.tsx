import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { getBaseUrl } from '@/lib/baseUrl';
import { RESTAURANT_NAME } from '@/lib/config';
import PrintTrigger from '@/app/print/[id]/PrintTrigger';

// 各桌 QR code 列印頁：一桌一張卡片，直接列印剪下貼桌上。
export default async function TablesQRPrintPage() {
  const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } });
  const base = getBaseUrl();

  const cards = await Promise.all(
    tables.map(async (t) => {
      const url = `${base}/order/${t.token}`;
      const svg = await QRCode.toString(url, {
        type: 'svg',
        margin: 1,
        width: 220,
      });
      return { id: t.id, number: t.number, label: `桌 ${t.number}`, svg };
    })
  );

  // 外帶專用 QR（不綁桌號），貼在櫃檯/海報
  const takeoutSvg = await QRCode.toString(`${base}/order/takeout`, {
    type: 'svg',
    margin: 1,
    width: 220,
  });
  cards.push({ id: -1, number: -1, label: '🥡 外帶', svg: takeoutSvg });

  return (
    <div style={{ padding: 16, color: '#000', background: '#fff' }}>
      <div className="no-print" style={{ textAlign: 'center', marginBottom: 12 }}>
        <PrintTrigger />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: 12,
              padding: 16,
              textAlign: 'center',
              breakInside: 'avoid',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 20 }}>{RESTAURANT_NAME}</div>
            <div style={{ fontSize: 28, fontWeight: 800, margin: '4px 0' }}>
              {c.label}
            </div>
            <div
              style={{ width: 200, height: 200, margin: '0 auto' }}
              // qrcode 產出的是可信任的 SVG 字串
              dangerouslySetInnerHTML={{ __html: c.svg }}
            />
            <div style={{ fontSize: 13, marginTop: 6 }}>掃碼點餐</div>
          </div>
        ))}
      </div>
      {cards.length === 0 && (
        <div className="center">尚無桌位</div>
      )}
    </div>
  );
}
