'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RESTAURANT_NAME } from '@/lib/config';
import type { Order } from '@/lib/types';

const TABS = [
  { key: 'SUBMITTED', label: '待結帳' },
  { key: 'PAID', label: '已結帳' },
  { key: '', label: '全部' },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [tab, setTab] = useState('SUBMITTED');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [flashIds, setFlashIds] = useState<number[]>([]);

  const knownIds = useRef<Set<number>>(new Set());
  const firstLoad = useRef(true);
  const audioCtx = useRef<AudioContext | null>(null);

  // 嗶一聲（WebAudio，不需音檔）
  const beep = useCallback(() => {
    const ctx = audioCtx.current;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.15);
    // 第二聲
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.value = 1175;
    g2.gain.value = 0.15;
    o2.connect(g2);
    g2.connect(ctx.destination);
    o2.start(ctx.currentTime + 0.18);
    o2.stop(ctx.currentTime + 0.33);
  }, []);

  const load = useCallback(async () => {
    const qs = tab ? `?status=${tab}` : '';
    const res = await fetch(`/api/admin/orders${qs}`, { cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/admin/login?next=/admin/orders');
      return;
    }
    const data: Order[] = await res.json();
    setOrders(data);
    setLoading(false);

    // 偵測新進「待結帳」訂單
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
    beep(); // 測試音
  }

  async function pay(id: number) {
    setPaying(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/pay`, {
        method: 'POST',
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || '結帳失敗');
      } else {
        const d = await res.json();
        // 依伺服器設定決定是否開瀏覽器列印（雲端出單機模式則不開）
        if (d.openBrowserPrint) window.open(`/print/${id}`, '_blank');
        await load();
      }
    } finally {
      setPaying(null);
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
          <Link href="/admin/menu" style={{ color: '#fff' }}>
            菜單
          </Link>
          <Link href="/admin/tables" style={{ color: '#fff' }}>
            桌號
          </Link>
          <button className="btn-ghost" style={{ padding: '4px 10px' }} onClick={logout}>
            登出
          </button>
        </span>
      </div>

      <div className="container">
        {!soundOn && (
          <div
            className="card"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 14 }}>🔔 開啟新訂單提示音</span>
            <button
              className="btn-primary"
              style={{ padding: '6px 14px' }}
              onClick={enableSound}
            >
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
          <div className="empty">目前沒有訂單</div>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="order-card"
              style={
                flashIds.includes(o.id)
                  ? { outline: '3px solid var(--brand)', animation: 'none' }
                  : undefined
              }
            >
              <div className="order-head">
                <div>
                  <span
                    className="badge"
                    style={{
                      marginRight: 6,
                      background:
                        o.orderType === 'TAKEOUT' ? '#e3f2fd' : '#f3e5f5',
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
                    <span
                      className="badge submitted"
                      style={{ marginLeft: 8 }}
                    >
                      新訂單！
                    </span>
                  )}
                </div>
                <span
                  className={`badge ${
                    o.status === 'PAID' ? 'paid' : 'submitted'
                  }`}
                >
                  {o.status === 'PAID' ? '已結帳' : '待結帳'}
                </span>
              </div>

              {o.items.map((it) => (
                <div key={it.id} className="order-line">
                  <span>
                    {it.itemName}
                    {it.variantLabel ? `（${it.variantLabel}）` : ''} ×
                    {it.quantity}
                    {it.note && <span className="note">　※{it.note}</span>}
                  </span>
                  <span>${it.price * it.quantity}</span>
                </div>
              ))}

              <div
                className="order-line"
                style={{ marginTop: 6, fontWeight: 800 }}
              >
                <span>合計</span>
                <span>${o.total}</span>
              </div>

              <div className="order-actions">
                {o.status !== 'PAID' && (
                  <button
                    className="btn-ok"
                    disabled={paying === o.id}
                    onClick={() => pay(o.id)}
                  >
                    {paying === o.id ? '結帳中…' : '結帳並出單'}
                  </button>
                )}
                <Link
                  className="btn-ghost"
                  href={`/print/${o.id}`}
                  target="_blank"
                >
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
