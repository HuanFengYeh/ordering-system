import { prisma } from '@/lib/prisma';
import {
  RESTAURANT_NAME,
  RESTAURANT_SUBTITLE,
  STATUS_LABEL,
  ORDER_TYPE,
  ORDER_TYPE_LABEL,
} from '@/lib/config';
import PrintTrigger from './PrintTrigger';

// 出單 / 收據頁。結帳後自動開啟並列印。
export default async function PrintPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: Number(params.id) },
    include: {
      table: { select: { number: true } },
      items: { include: { modifiers: true } },
    },
  });

  if (!order) {
    return <div className="center">找不到訂單</div>;
  }

  const isTakeout = order.orderType === ORDER_TYPE.TAKEOUT;

  return (
    <div className="receipt">
      <h1>{RESTAURANT_NAME}</h1>
      <div className="sub">{RESTAURANT_SUBTITLE}</div>

      <div
        className="r-line"
        style={{ fontWeight: 800, fontSize: 18, justifyContent: 'center' }}
      >
        <span>
          ***{' '}
          {ORDER_TYPE_LABEL[order.orderType] ?? order.orderType} ***
        </span>
      </div>
      <div className="r-line">
        <span>{isTakeout ? '取餐' : '桌號'}</span>
        <span>
          {isTakeout
            ? order.pickupName || '外帶'
            : (order.table?.number ?? '-')}
        </span>
      </div>
      <div className="r-line">
        <span>訂單編號</span>
        <span>#{order.id}</span>
      </div>
      <div className="r-line">
        <span>狀態</span>
        <span>{STATUS_LABEL[order.status] ?? order.status}</span>
      </div>
      <div className="r-line">
        <span>時間</span>
        <span>{new Date(order.createdAt).toLocaleString('zh-TW')}</span>
      </div>

      <hr />

      {order.items.map((it) => (
        <div key={it.id}>
          <div className="r-line">
            <span>
              {it.itemName}
              {it.variantLabel ? `(${it.variantLabel})` : ''} x{it.quantity}
            </span>
            <span>${it.price * it.quantity}</span>
          </div>
          {it.modifiers.map((m) => (
            <div key={m.id} className="r-line" style={{ fontSize: 11 }}>
              <span>
                + {m.label}
                {m.priceDelta ? ` (+$${m.priceDelta})` : ''}
              </span>
            </div>
          ))}
          {it.note && (
            <div className="r-line" style={{ fontSize: 11 }}>
              <span>※ {it.note}</span>
            </div>
          )}
        </div>
      ))}

      <hr />

      <div className="r-line r-total">
        <span>合計</span>
        <span>${order.total}</span>
      </div>

      <hr />
      <div className="sub" style={{ marginTop: 12 }}>
        謝謝惠顧　歡迎再度光臨
      </div>

      <PrintTrigger />
    </div>
  );
}
