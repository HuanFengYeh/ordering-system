'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RESTAURANT_NAME } from '@/lib/config';
import type { Order, DaySummary } from '@/lib/types';

const TABS = [
  { key: 'SUBMITTED', label: '待結帳' },
  { key: 'PAID', label: '已結帳' },
  { key: 'CANCELLED', label: '作廢' },
  { key: '', label: '全部' },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [tab, setTab] = useState('SUBMITTED');
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [flashIds, setFlashIds] = useState<number[]>([]);

  const knownIds = useRef<Set<number>>(new Set());
  const firstLoad = useRef(true);
  const audioCtx = useRef<AudioContext | null>(null);

  const beep = useCallback(() => {
    const ctx = audioCtx.current;
    if (!ctx) return;
    const tone = (freq: number, at: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.value = 0.15;
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + at);
      o.stop(ctx.currentTime + at + 0.15);
    };
    tone(880, 0);
    tone(1175, 0.18);
  }, []);

  const load = useCallback(async () => {
    // 訂單清單（預設今天）
    const qs = tab ? `?status=${tab}&day=today` : '?day=today';
    const res = await fetch(`/api/admin/orders${qs}`, { cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/admin/login?next=/admin/orders');
      return;
    }
    const data: Order[] = await res.json();
    setOrders(data);
    setLoading(false);

    // 今日看板數字
    fetch('/api/admin/summary', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setSummary(s))
      .catch(() => {});

    // 新進待結帳偵測（用當前清單裡的 SUBMITTED）
    const submitted = data.filter((o) => o.status === 'SUBMITTED');
    const fresh = submitted.filter((o) => !knownIds.current.has(o.id));
    if (!firstLoad.current && fresh.length > 0) {
      beep();
      setFlashIds(fresh.map((o) => o.id));
      setTimeout(() => setFlashIds([]), 6000);
    }
    submitted.forEach((o) => knownIds.current.add(o.id));
    firstLoad.current = false;
  }, [tab, beep, router]);

  useEffect(() => {
    setLoading(true);
    firstLoad.current = true;
    knownIds.current = new Set();
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  function enableSound() {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioCtx.current = new Ctx();
    audioCtx.current.resume();
    setSoundOn(true);
    beep();
  }

  async function action(
    id: number,
    path: string,
    opts?: { openPrint?: boolean; body?: unknown }
  ) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/${path}`, {
        method: 'POST',
        headers: opts?.body ? { 'Content-Type': 'application/json' } : undefined,
        body: opts?.body ? JSON.stringify(opts.body) : undefined,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || '操作失敗');
      } else if (opts?.openPrint) {
        const d = await res.json();
        if (d.openBrowserPrint) window.open(`/print/${id}`, '_blank');
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  return (
    <>
      <div className="appbar">
        <span className="brand">{RESTAURANT_NAME}</span>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/admin/close" style={{ color: '#fff' }}>
            收班
          </Link>
          <Link href="/admin/menu" style={{ color: '#fff' }}>
            菜單
          </Link>
          <Link href="/admin/tables" style={{ color: '#fff' }}>
            桌號
          </Link>
          <button
            className="btn-ghost"
            style={{ padding: '4px 10px' }}
            onClick={logout}
          >
            登出
          </button>
        </span>
      </div>

      <div className="container">
        {/* 今日看板 */}
        {summary && (
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Stat label="今日營業額" value={`$${summary.totalRevenue}`} big />
            <Stat label="已結帳" value={`${summary.orderCount} 單`} />
            <Stat label="待結帳" value={`${summary.unpaidCount} 張`} warn={summary.unpaidCount > 0} />
            <Stat label="內用/外帶" value={`${summary.dineInCount}/${summary.takeoutCount}`} />
            <Stat label="平均客單" value={`$${summary.avgTicket}`} />
          </div>
        )}

        {!soundOn && (
          <div
            className="card"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ fontSize: 14 }}>🔔 開啟新訂單提示音</span>
            <button className="btn-primary" style={{ padding: '6px 14px' }} onClick={enableSound}>
              開啟音效
            </button>
          </div>
        )}

        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? 'active' : ''}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty">載入中…</div>
        ) : orders.length === 0 ? (
          <div className="empty">今日目前沒有此類訂單</div>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="order-card"
              style={{
                ...(flashIds.includes(o.id)
                  ? { outline: '3px solid var(--brand)' }
                  : {}),
                ...(o.status === 'CANCELLED' ? { opacity: 0.6 } : {}),
              }}
            >
              <div className="order-head">
                <div>
                  <span
                    className="badge"
                    style={{
                      marginRight: 6,
                      background: o.orderType === 'TAKEOUT' ? '#e3f2fd' : '#f3e5f5',
                      color: o.orderType === 'TAKEOUT' ? '#1565c0' : '#7b1fa2',
                    }}
                  >
                    {o.orderType === 'TAKEOUT' ? '外帶' : '內用'}
                  </span>
                  <strong>
                    {o.orderType === 'TAKEOUT'
                      ? o.pickupName || '外帶'
                      : `桌 ${o.table?.number ?? '-'}`}
                  </strong>{' '}
                  <span style={{ color: '#888' }}>#{o.id}</span>
                  {flashIds.includes(o.id) && (
                    <span className="badge submitted" style={{ marginLeft: 8 }}>
                      新訂單！
                    </span>
                  )}
                </div>
                <span
                  className={`badge ${
                    o.status === 'PAID'
                      ? 'paid'
                      : o.status === 'CANCELLED'
                        ? ''
                        : 'submitted'
                  }`}
                  style={
                    o.status === 'CANCELLED'
                      ? { background: '#eee', color: '#999' }
                      : undefined
                  }
                >
                  {o.status === 'PAID' ? '已結帳' : o.status === 'CANCELLED' ? '已作廢' : '待結帳'}
                </span>
              </div>

              {o.items.map((it) => (
                <div key={it.id} className="order-line">
                  <span>
                    {it.itemName}
                    {it.variantLabel ? `（${it.variantLabel}）` : ''} ×{it.quantity}
                    {it.note && <span className="note">　※{it.note}</span>}
                  </span>
                  <span>${it.price * it.quantity}</span>
                </div>
              ))}

              <div className="order-line" style={{ marginTop: 6, fontWeight: 800 }}>
                <span>合計</span>
                <span>${o.total}</span>
              </div>

              {o.status === 'CANCELLED' && o.cancelReason && (
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  作廢原因：{o.cancelReason}
                </div>
              )}

              <div className="order-actions">
                {o.status === 'SUBMITTED' && (
                  <>
                    <button
                      className="btn-ok"
                      disabled={busy === o.id}
                      onClick={() => action(o.id, 'pay', { openPrint: true })}
                    >
                      {busy === o.id ? '處理中…' : '結帳並出單'}
                    </button>
                    <button
                      className="btn-danger"
                      disabled={busy === o.id}
                      onClick={() => {
                        if (confirm(`確定作廢 #${o.id}？`)) action(o.id, 'cancel');
                      }}
                    >
                      作廢
                    </button>
                  </>
                )}
                {o.status === 'CANCELLED' && (
                  <button
                    className="btn-primary"
                    disabled={busy === o.id}
                    onClick={() => action(o.id, 'restore')}
                  >
                    還原
                  </button>
                )}
                <Link className="btn-ghost" href={`/print/${o.id}`} target="_blank">
                  列印
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  big,
  warn,
}: {
  label: string;
  value: string;
  big?: boolean;
  warn?: boolean;
}) {
  return (
    <div style={{ minWidth: 90 }}>
      <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
      <div
        style={{
          fontSize: big ? 24 : 18,
          fontWeight: 800,
          color: warn ? 'var(--danger)' : big ? 'var(--brand-dark)' : 'inherit',
        }}
      >
        {value}
      </div>
    </div>
  );
}
