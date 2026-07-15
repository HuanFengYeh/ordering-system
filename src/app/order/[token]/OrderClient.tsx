'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Category } from '@/lib/types';
import { ORDER_TYPE } from '@/lib/config';

type CartLine = {
  variantId: number;
  itemName: string;
  variantLabel: string;
  price: number;
  quantity: number;
  note: string; // 這一項專屬的備註（不再全單共用）
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
  const [orderType, setOrderType] = useState<string>(
    fixedType ?? ORDER_TYPE.DINE_IN
  );
  const [pickupName, setPickupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
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

  // 只顯示有品項的分類（供菜單與快速導覽共用）
  const shownCategories = useMemo(
    () => categories.filter((c) => c.items.length > 0),
    [categories]
  );

  // 分類快速導覽：scroll-spy 標記目前所在分類
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (shownCategories.length < 2) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveCat(Number(visible[0].target.getAttribute('data-cat')));
        }
      },
      // 觸發帶偏移：讓「目前分類」對齊 sticky 頂欄下方
      { rootMargin: '-120px 0px -70% 0px', threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [shownCategories]);

  function jumpTo(catId: number) {
    sectionRefs.current[catId]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

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
          note: cur?.note ?? '', // 調整數量時保留原備註
        };
      return next;
    });
  }

  // 設定某一項的專屬備註
  function setLineNote(variantId: number, note: string) {
    setCart((prev) => {
      const cur = prev[variantId];
      if (!cur) return prev;
      return { ...prev, [variantId]: { ...cur, note } };
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
            note: l.note.trim() || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '送出失敗');
      setReviewOpen(false);
      setDone({
        orderId: data.id,
        total: data.total,
        orderType: data.orderType,
      });
      setCart({});
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
    <>
      {/* 分類快速導覽（超過一個分類才顯示） */}
      {shownCategories.length > 1 && (
        <div className="catnav">
          {shownCategories.map((cat) => (
            <button
              key={cat.id}
              className={activeCat === cat.id ? 'active' : ''}
              onClick={() => jumpTo(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

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

        {shownCategories.map((cat) => (
          <div
            key={cat.id}
            data-cat={cat.id}
            ref={(el) => {
              sectionRefs.current[cat.id] = el;
            }}
            className="cat-anchor"
          >
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
                      <div
                        key={v.id}
                        className={qty > 0 ? 'variant-row in-cart' : 'variant-row'}
                      >
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

        <div className="spacer-bottom" />
      </div>

      {/* 底部購物車列：左側可點開檢視，右側直接進入結帳檢視 */}
      <div className="cartbar">
        <button
          className="cart-summary"
          disabled={count === 0}
          onClick={() => setReviewOpen(true)}
        >
          {count > 0 && <span className="cart-count-badge">{count}</span>}
          <span>
            <span style={{ fontSize: 12, color: '#888', display: 'block' }}>
              {isTakeout ? '外帶' : `內用・桌 ${tableNumber ?? '-'}`}
            </span>
            <span className="total">${total}</span>
          </span>
        </button>
        <button
          className="btn-primary"
          disabled={count === 0 || submitting}
          onClick={() => setReviewOpen(true)}
        >
          查看訂單
        </button>
      </div>

      {/* 購物車 review 面板：送出前檢視、改量、備註、外帶取餐資訊 */}
      {reviewOpen && (
        <>
          <div
            className="sheet-backdrop"
            onClick={() => !submitting && setReviewOpen(false)}
          />
          <div className="sheet" role="dialog" aria-label="購物車">
            <div className="sheet-grip" />
            <div className="sheet-head">
              <h3>
                購物車
                <span style={{ fontSize: 13, color: '#888', fontWeight: 400 }}>
                  {isTakeout ? '外帶' : `內用・桌 ${tableNumber ?? '-'}`}
                </span>
              </h3>
              <button
                className="sheet-close"
                aria-label="關閉"
                onClick={() => setReviewOpen(false)}
              >
                ×
              </button>
            </div>

            {lines.length === 0 && <div className="empty">購物車是空的</div>}

            {lines.map((l) => (
              <div key={l.variantId} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
                <div
                  className="sheet-line"
                  style={{ border: 'none', padding: 0 }}
                >
                  <span>
                    <span className="l-name">{l.itemName}</span>
                    {l.variantLabel && (
                      <span className="l-sub">　{l.variantLabel}</span>
                    )}
                    <div className="l-sub">
                      ${l.price} × {l.quantity} = ${l.price * l.quantity}
                    </div>
                  </span>
                  <span className="qty">
                    <button
                      aria-label="減少"
                      onClick={() =>
                        setQty(l.variantId, l.itemName, l.variantLabel, l.price, -1)
                      }
                    >
                      −
                    </button>
                    <span className="n">{l.quantity}</span>
                    <button
                      aria-label="增加"
                      onClick={() =>
                        setQty(l.variantId, l.itemName, l.variantLabel, l.price, +1)
                      }
                    >
                      ＋
                    </button>
                  </span>
                </div>
                {/* 這一項專屬的備註 */}
                <input
                  className="textarea"
                  style={{ marginTop: 6, fontSize: 13 }}
                  placeholder="這一項的備註（例如：不要辣、去冰）"
                  value={l.note}
                  onChange={(e) => setLineNote(l.variantId, e.target.value)}
                />
              </div>
            ))}

            {isTakeout && (
              <div style={{ marginTop: 14 }}>
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

            {error && (
              <div
                className="card"
                style={{ color: 'var(--danger)', marginTop: 12 }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#888' }}>共 {count} 項</div>
                <div className="total" style={{ fontSize: 20 }}>
                  ${total}
                </div>
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
        </>
      )}
    </>
  );
}
