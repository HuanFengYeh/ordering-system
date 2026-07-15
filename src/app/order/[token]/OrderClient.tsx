'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Category, MenuItem, ModifierGroup } from '@/lib/types';
import { ORDER_TYPE } from '@/lib/config';
import {
  IconCheck,
  IconClose,
  IconDineIn,
  IconDish,
  IconSearch,
  IconTakeout,
} from '@/app/icons';

// 已選的客製選項（下單當下的快照，價格一併記錄）
type SelectedOption = {
  optionId: number;
  groupName: string;
  label: string;
  priceDelta: number;
};

type CartLine = {
  key: string; // 同規格＋同客製 = 同一行；備註不參與 key
  variantId: number;
  itemName: string;
  variantLabel: string;
  unitPrice: number; // 全含單價：規格價 + 所有客製加價
  quantity: number;
  note: string; // 這一項專屬的備註
  options: SelectedOption[];
};

// 同規格 + 同選項組合 → 同一個 key（備註不影響，可於購物車內編輯）
function keyFor(variantId: number, optionIds: number[]): string {
  return `${variantId}:${[...optionIds].sort((a, b) => a - b).join('-')}`;
}

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
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [orderType, setOrderType] = useState<string>(
    fixedType ?? ORDER_TYPE.DINE_IN
  );
  const [pickupName, setPickupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [customizing, setCustomizing] = useState<MenuItem | null>(null);
  const [done, setDone] = useState<null | {
    orderId: number;
    total: number;
    orderType: string;
  }>(null);
  const [error, setError] = useState('');

  const isTakeout = orderType === ORDER_TYPE.TAKEOUT;
  const lines = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(
    () => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
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

  // 菜單搜尋：依名稱/描述過濾
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const displayCategories = useMemo(() => {
    if (!q) return shownCategories;
    return shownCategories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) =>
            it.name.toLowerCase().includes(q) ||
            (it.description ?? '').toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [shownCategories, q]);

  // 分類快速導覽：scroll-spy 標記目前所在分類
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (displayCategories.length < 2) return;
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
  }, [displayCategories]);

  function jumpTo(catId: number) {
    sectionRefs.current[catId]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  // 加入 / 累加一行（同 key 合併數量、保留既有備註）
  function mergeLine(base: Omit<CartLine, 'quantity'>, delta: number) {
    setCart((prev) => {
      const cur = prev[base.key];
      const nextQty = (cur?.quantity ?? 0) + delta;
      const next = { ...prev };
      if (nextQty <= 0) delete next[base.key];
      else
        next[base.key] = {
          ...base,
          quantity: nextQty,
          note: cur?.note ?? base.note,
        };
      return next;
    });
  }

  // 依 key 調整數量（購物車內 +/−）
  function changeQty(key: string, delta: number) {
    setCart((prev) => {
      const cur = prev[key];
      if (!cur) return prev;
      const q = cur.quantity + delta;
      const next = { ...prev };
      if (q <= 0) delete next[key];
      else next[key] = { ...cur, quantity: q };
      return next;
    });
  }

  function setLineNote(key: string, note: string) {
    setCart((prev) => {
      const cur = prev[key];
      if (!cur) return prev;
      return { ...prev, [key]: { ...cur, note } };
    });
  }

  // 無客製品項：單一規格直接 +/−
  function addSimpleVariant(
    item: MenuItem,
    variant: { id: number; label: string; price: number },
    delta: number
  ) {
    mergeLine(
      {
        key: keyFor(variant.id, []),
        variantId: variant.id,
        itemName: item.name,
        variantLabel: variant.label,
        unitPrice: variant.price,
        note: '',
        options: [],
      },
      delta
    );
  }

  // 客製 modal 送出：帶入所選規格 + 選項
  function addCustomized(
    item: MenuItem,
    variant: { id: number; label: string; price: number },
    options: SelectedOption[],
    quantity: number
  ) {
    const unitPrice =
      variant.price + options.reduce((s, o) => s + o.priceDelta, 0);
    mergeLine(
      {
        key: keyFor(variant.id, options.map((o) => o.optionId)),
        variantId: variant.id,
        itemName: item.name,
        variantLabel: variant.label,
        unitPrice,
        note: '',
        options,
      },
      quantity
    );
    setCustomizing(null);
  }

  // 某菜色目前已加入的總數量（用於菜單列上的小標）
  function itemQtyInCart(item: MenuItem): number {
    const ids = new Set(item.variants.map((v) => v.id));
    return lines
      .filter((l) => ids.has(l.variantId))
      .reduce((s, l) => s + l.quantity, 0);
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
            modifierOptionIds: l.options.map((o) => o.optionId),
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
        <IconCheck size={64} style={{ color: 'var(--ok)' }} />
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
      {/* 分類快速導覽（搜尋時隱藏） */}
      {!q && shownCategories.length > 1 && (
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
              { key: ORDER_TYPE.DINE_IN, label: '內用', Icon: IconDineIn },
              { key: ORDER_TYPE.TAKEOUT, label: '外帶', Icon: IconTakeout },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setOrderType(opt.key)}
                className={orderType === opt.key ? 'seg active' : 'seg'}
              >
                <opt.Icon size={20} />
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* 菜單搜尋 */}
        <div className="searchbar">
          <IconSearch size={18} />
          <input
            placeholder="搜尋餐點…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="clear"
              aria-label="清除搜尋"
              onClick={() => setQuery('')}
            >
              <IconClose size={13} />
            </button>
          )}
        </div>

        {q && displayCategories.length === 0 && (
          <div className="empty">找不到「{query}」的餐點</div>
        )}

        {displayCategories.map((cat) => (
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
            <div className="menu-list">
              {cat.items.map((item) => {
                // 有客製或多規格 → 點整張卡開客製視窗；單一規格 → 就地加減
                const needsModal =
                  item.modifierGroups.length > 0 || item.variants.length > 1;
                const inCart = itemQtyInCart(item);
                const minPrice = Math.min(
                  ...item.variants.map((v) => v.price)
                );
                const priceLabel = `$${minPrice}`;
                const simple = item.variants[0];
                const simpleQty = needsModal
                  ? 0
                  : cart[keyFor(simple.id, [])]?.quantity ?? 0;

                return (
                  <div
                    key={item.id}
                    className="item tappable"
                    onClick={() =>
                      needsModal
                        ? setCustomizing(item)
                        : addSimpleVariant(item, simple, +1)
                    }
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="item-photo"
                        src={item.imageUrl}
                        alt={item.name}
                      />
                    ) : (
                      <div className="item-photo placeholder" aria-hidden="true">
                        <IconDish size={28} />
                      </div>
                    )}

                    <div className="item-body">
                      <div className="item-name">{item.name}</div>
                      {item.description && (
                        <div className="item-desc">{item.description}</div>
                      )}
                      <div className="item-price">{priceLabel}</div>
                    </div>

                    {/* 統一：每個品項都是同一顆＋／已加入則顯示橘圓數量（增減量在購物車調整） */}
                    {(() => {
                      const qty = needsModal ? inCart : simpleQty;
                      return (
                        <button
                          className={qty > 0 ? 'item-add filled' : 'item-add'}
                          aria-label={
                            needsModal ? `選擇 ${item.name}` : `加入 ${item.name}`
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if (needsModal) setCustomizing(item);
                            else addSimpleVariant(item, simple, +1);
                          }}
                        >
                          {qty > 0 ? qty : '＋'}
                        </button>
                      );
                    })()}
                  </div>
                );
              })}
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

      {/* 客製視窗 */}
      {customizing && (
        <CustomizeModal
          item={customizing}
          onClose={() => setCustomizing(null)}
          onAdd={addCustomized}
        />
      )}

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
                  {'　'}
                  {isTakeout ? '外帶' : `內用・桌 ${tableNumber ?? '-'}`}
                </span>
              </h3>
              <button
                className="sheet-close"
                aria-label="關閉"
                onClick={() => setReviewOpen(false)}
              >
                <IconClose size={16} />
              </button>
            </div>

            {lines.length === 0 && <div className="empty">購物車是空的</div>}

            {lines.map((l) => (
              <div
                key={l.key}
                style={{
                  borderBottom: '1px solid var(--border)',
                  padding: '10px 0',
                }}
              >
                <div
                  className="sheet-line"
                  style={{ border: 'none', padding: 0 }}
                >
                  <span>
                    <span className="l-name">{l.itemName}</span>
                    {l.variantLabel && (
                      <span className="l-sub">　{l.variantLabel}</span>
                    )}
                    {l.options.length > 0 && (
                      <div className="l-sub">
                        {l.options
                          .map(
                            (o) =>
                              `${o.label}${o.priceDelta ? `(+$${o.priceDelta})` : ''}`
                          )
                          .join('、')}
                      </div>
                    )}
                    <div className="l-sub">
                      ${l.unitPrice} × {l.quantity} = ${l.unitPrice * l.quantity}
                    </div>
                  </span>
                  <span className="qty">
                    <button
                      aria-label="減少"
                      onClick={() => changeQty(l.key, -1)}
                    >
                      −
                    </button>
                    <span className="n">{l.quantity}</span>
                    <button
                      aria-label="增加"
                      onClick={() => changeQty(l.key, +1)}
                    >
                      ＋
                    </button>
                  </span>
                </div>
                {/* 這一項專屬的備註 */}
                <input
                  className="textarea"
                  style={{ marginTop: 6, fontSize: 13 }}
                  placeholder="這一項的備註（例如：不要香菜、去冰）"
                  value={l.note}
                  onChange={(e) => setLineNote(l.key, e.target.value)}
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

// ── 客製視窗：選規格 + 選項（辣度/加料…）+ 數量 ──────────────────
function CustomizeModal({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (
    item: MenuItem,
    variant: { id: number; label: string; price: number },
    options: SelectedOption[],
    quantity: number
  ) => void;
}) {
  const [variantId, setVariantId] = useState(item.variants[0]?.id ?? 0);
  // 每個群組已選的 optionId 清單
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [quantity, setQuantity] = useState(1);

  const variant =
    item.variants.find((v) => v.id === variantId) ?? item.variants[0];

  function minFor(g: ModifierGroup): number {
    return g.required ? Math.max(1, g.minSelect) : g.minSelect;
  }

  function toggle(g: ModifierGroup, optId: number) {
    setSelected((prev) => {
      const cur = prev[g.id] ?? [];
      // 單選：直接替換；非必選時可再次點擊取消
      if (g.maxSelect === 1) {
        const isSel = cur[0] === optId;
        return { ...prev, [g.id]: isSel && !g.required ? [] : [optId] };
      }
      // 複選：切換，達上限時不再新增
      if (cur.includes(optId)) {
        return { ...prev, [g.id]: cur.filter((id) => id !== optId) };
      }
      if (cur.length >= g.maxSelect) return prev;
      return { ...prev, [g.id]: [...cur, optId] };
    });
  }

  // 每個群組是否滿足數量限制
  const allValid = item.modifierGroups.every((g) => {
    const n = (selected[g.id] ?? []).length;
    return n >= minFor(g) && n <= g.maxSelect;
  });

  // 已選選項展開 + 全含單價
  const chosenOptions: SelectedOption[] = item.modifierGroups.flatMap((g) =>
    (selected[g.id] ?? []).map((optId) => {
      const o = g.options.find((x) => x.id === optId)!;
      return {
        optionId: o.id,
        groupName: g.name,
        label: o.label,
        priceDelta: o.priceDelta,
      };
    })
  );
  const unitPrice =
    (variant?.price ?? 0) +
    chosenOptions.reduce((s, o) => s + o.priceDelta, 0);

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label={`客製 ${item.name}`}>
        <div className="sheet-grip" />
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="modal-hero" src={item.imageUrl} alt={item.name} />
        )}
        <div className="sheet-head">
          <h3>{item.name}</h3>
          <button className="sheet-close" aria-label="關閉" onClick={onClose}>
            <IconClose size={16} />
          </button>
        </div>
        {item.description && (
          <div className="item-desc" style={{ marginTop: -4 }}>
            {item.description}
          </div>
        )}

        <div className="cust-area">
          <div className="cust-title">客製你的餐點</div>

          {/* 規格（多規格時才顯示；單選＝圓形 radio） */}
          {item.variants.length > 1 && (
            <div className="grp-card">
              <div className="grp-head">
                <span className="grp-title">規格</span>
              </div>
              <div className="grp-hint">選 1 項</div>
              {item.variants.map((v) => {
                const sel = v.id === variantId;
                return (
                  <div
                    key={v.id}
                    className={sel ? 'opt-line sel' : 'opt-line'}
                    onClick={() => setVariantId(v.id)}
                  >
                    <span className="opt-main">
                      <span className="opt-name">{v.label || '單一價'}</span>
                      <span className="opt-sub">${v.price}</span>
                    </span>
                    <span className="ctrl radio" />
                  </div>
                );
              })}
            </div>
          )}

          {/* 客製群組（單選＝圓、複選＝方） */}
          {item.modifierGroups.map((g) => {
            const cur = selected[g.id] ?? [];
            const atMax = cur.length >= g.maxSelect;
            const multi = g.maxSelect > 1;
            const required = minFor(g) > 0;
            return (
              <div key={g.id} className="grp-card">
                <div className="grp-head">
                  <span className="grp-title">{g.name}</span>
                </div>
                <div className="grp-hint">
                  {multi
                    ? `最多選 ${g.maxSelect} 項${
                        required ? `，至少 ${minFor(g)} 項` : '（可不選）'
                      }`
                    : required
                      ? '選 1 項'
                      : '選 1 項（可不選）'}
                </div>
                {g.options.map((o) => {
                  const sel = cur.includes(o.id);
                  const disabled = !sel && atMax && multi;
                  return (
                    <div
                      key={o.id}
                      className={`opt-line${sel ? ' sel' : ''}${
                        disabled ? ' disabled' : ''
                      }`}
                      onClick={() => !disabled && toggle(g, o.id)}
                    >
                      <span className="opt-main">
                        <span className="opt-name">{o.label}</span>
                        {o.priceDelta > 0 && (
                          <span className="opt-sub">+${o.priceDelta}</span>
                        )}
                      </span>
                      <span className={multi ? 'ctrl check' : 'ctrl radio'} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 數量 + 加入（固定於視窗底部） */}
        <div className="modal-foot">
          <span className="qty" style={{ gap: 14 }}>
            <button
              aria-label="減少"
              disabled={quantity <= 1}
              onClick={() => setQuantity((n) => Math.max(1, n - 1))}
            >
              −
            </button>
            <span className="n" style={{ fontSize: 18 }}>
              {quantity}
            </span>
            <button aria-label="增加" onClick={() => setQuantity((n) => n + 1)}>
              ＋
            </button>
          </span>
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            disabled={!allValid || !variant}
            onClick={() =>
              variant && onAdd(item, variant, chosenOptions, quantity)
            }
          >
            加入購物車　${unitPrice * quantity}
          </button>
        </div>
      </div>
    </>
  );
}
