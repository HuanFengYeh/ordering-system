'use client';

import { useMemo, useState } from 'react';
import type { Category } from '@/lib/types';
import { ORDER_TYPE } from '@/lib/config';

type CartLine = {
  variantId: number;
  itemName: string;
  variantLabel: string;
  price: number;
  quantity: number;
};

export default function OrderClient({
  token,
  tableNumber,
  categories,
  fixedType,
}: {
  token: string | null;
  tableNumber: number | null;
  categories: Category[];
  // 若為外帶專用入口，鎖定外帶、不顯示內用/外帶切換
  fixedType?: 'TAKEOUT';
}) {
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [note, setNote] = useState('');
  const [orderType, setOrderType] = useState<string>(
    fixedType ?? ORDER_TYPE.DINE_IN
  );
  const [pickupName, setPickupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | {
    orderId: number;
    total: number;
    orderType: string;
  }>(null);
  const [error, setError] = useState('');

  const isTakeout = orderType === ORDER_TYPE.TAKEOUT;
  const lines = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(
    () => lines.reduce((s, l) => s + l.price * l.quantity, 0),
    [lines]
  );
  const count = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines]
  );

  function setQty(
    variantId: number,
    itemName: string,
    variantLabel: string,
    price: number,
    delta: number
  ) {
    setCart((prev) => {
      const cur = prev[variantId];
      const nextQty = (cur?.quantity ?? 0) + delta;
      const next = { ...prev };
      if (nextQty <= 0) delete next[variantId];
      else
        next[variantId] = {
          variantId,
          itemName,
          variantLabel,
          price,
          quantity: nextQty,
        };
      return next;
    });
  }

  async function submit() {
    if (lines.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token ?? undefined,
          orderType,
          pickupName: isTakeout ? pickupName || undefined : undefined,
          items: lines.map((l) => ({
            variantId: l.variantId,
            quantity: l.quantity,
            note: note || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '送出失敗');
      setDone({
        orderId: data.id,
        total: data.total,
        orderType: data.orderType,
      });
      setCart({});
      setNote('');
      setPickupName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '送出失敗');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const doneTakeout = done.orderType === ORDER_TYPE.TAKEOUT;
    return (
      <div className="center">
        <div style={{ fontSize: 56 }}>✅</div>
        <h2>訂單已送出！</h2>
        <p>
          <span className="badge submitted" style={{ fontSize: 14 }}>
            {doneTakeout ? '外帶' : '內用'}
          </span>
          {'　'}
          {doneTakeout
            ? '訂單編號'
            : `桌號 ${tableNumber ?? '-'}　訂單編號`}{' '}
          #{done.orderId}
        </p>
        <p className="total" style={{ fontSize: 22 }}>
          合計 ${done.total}
        </p>
        <p style={{ color: '#888' }}>請至櫃檯結帳，謝謝！</p>
        <button
          className="btn-ghost"
          style={{ padding: '10px 20px', marginTop: 12 }}
          onClick={() => setDone(null)}
        >
          繼續加點
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      {/* 內用 / 外帶 切換（外帶專用入口不顯示） */}
      {!fixedType && (
        <div className="card" style={{ display: 'flex', gap: 8 }}>
          {[
            { key: ORDER_TYPE.DINE_IN, label: '🍽️ 內用' },
            { key: ORDER_TYPE.TAKEOUT, label: '🥡 外帶' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setOrderType(opt.key)}
              className={orderType === opt.key ? 'btn-primary' : 'btn-ghost'}
              style={{ flex: 1, padding: '12px 0', fontSize: 16 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {isTakeout && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            取餐資訊（外帶）
          </div>
          <input
            className="textarea"
            placeholder="姓名或電話末三碼，方便叫號取餐"
            value={pickupName}
            onChange={(e) => setPickupName(e.target.value)}
          />
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat.id}>
          <div className="cat-title">{cat.name}</div>
          {cat.note && <div className="cat-note">＊{cat.note}</div>}
          <div className="card">
            {cat.items.map((item) => (
              <div key={item.id} className="item">
                <div className="item-name">{item.name}</div>
                {item.description && (
                  <div className="item-desc">{item.description}</div>
                )}
                {item.variants.map((v) => {
                  const line = cart[v.id];
                  const qty = line?.quantity ?? 0;
                  return (
                    <div key={v.id} className="variant-row">
                      <span className="variant-label">
                        {v.label ? v.label : '單一價'}
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                        }}
                      >
                        <span className="price">${v.price}</span>
                        <span className="qty">
                          <button
                            aria-label="減少"
                            disabled={qty === 0}
                            onClick={() =>
                              setQty(v.id, item.name, v.label, v.price, -1)
                            }
                          >
                            −
                          </button>
                          <span className="n">{qty}</span>
                          <button
                            aria-label="增加"
                            onClick={() =>
                              setQty(v.id, item.name, v.label, v.price, +1)
                            }
                          >
                            ＋
                          </button>
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}

      {count > 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 6 }}>整單備註</div>
          <textarea
            className="textarea"
            rows={2}
            placeholder="例如：不要辣、分開包裝…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}

      {error && (
        <div className="card" style={{ color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <div className="spacer-bottom" />

      <div className="cartbar">
        <div>
          <div style={{ fontSize: 12, color: '#888' }}>
            共 {count} 項　{isTakeout ? '外帶' : `內用・桌 ${tableNumber ?? '-'}`}
          </div>
          <div className="total">${total}</div>
        </div>
        <button
          className="btn-primary"
          disabled={count === 0 || submitting}
          onClick={submit}
        >
          {submitting ? '送出中…' : '送出訂單'}
        </button>
      </div>
    </div>
  );
}
