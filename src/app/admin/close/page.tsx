'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RESTAURANT_NAME } from '@/lib/config';
import { formatTaipei } from '@/lib/businessDay';
import type { DaySummary } from '@/lib/types';

type Close = {
  id: number;
  businessDate: string;
  closedAt: string;
  totalRevenue: number;
  orderCount: number;
  dineInRevenue: number;
  dineInCount: number;
  takeoutRevenue: number;
  takeoutCount: number;
  cancelledCount: number;
};

export default function AdminClosePage() {
  const router = useRouter();
  const [today, setToday] = useState<DaySummary | null>(null);
  const [todayClose, setTodayClose] = useState<Close | null>(null);
  const [history, setHistory] = useState<Close[]>([]);
  const [closing, setClosing] = useState(false);

  // 老闆 PIN 關卡：解鎖前不顯示任何營業額
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pinError, setPinError] = useState('');

  // 帶老闆 PIN 抓資料；PIN 只留在記憶體，重整需重輸
  const load = useCallback(
    async (ownerPin: string) => {
      const res = await fetch('/api/admin/close', {
        cache: 'no-store',
        headers: { 'x-owner-pin': ownerPin },
      });
      if (res.status === 401) {
        router.replace('/admin/login?next=/admin/close');
        return false;
      }
      if (res.status === 403) {
        setPinError('PIN 錯誤');
        setUnlocked(false);
        return false;
      }
      const d = await res.json();
      setToday(d.today);
      setTodayClose(d.todayClose);
      setHistory(d.history);
      setUnlocked(true);
      setPinError('');
      return true;
    },
    [router]
  );

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) return;
    setChecking(true);
    try {
      await load(pin);
    } finally {
      setChecking(false);
    }
  }

  async function doClose() {
    if (!confirm('確定收班並記錄今日營業總結？（之後仍可重新收班更新數字）')) return;
    setClosing(true);
    try {
      const res = await fetch('/api/admin/close', {
        method: 'POST',
        headers: { 'x-owner-pin': pin },
      });
      if (!res.ok) alert('收班失敗');
      await load(pin);
    } finally {
      setClosing(false);
    }
  }

  return (
    <>
      <div className="appbar no-print">
        <span className="brand">{RESTAURANT_NAME}</span>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/admin/orders" style={{ color: '#fff' }}>
            訂單
          </Link>
          <Link href="/admin/menu" style={{ color: '#fff' }}>
            菜單
          </Link>
        </span>
      </div>

      <div className="container">
        {!unlocked || !today ? (
          <div className="card" style={{ maxWidth: 360, margin: '40px auto' }}>
            <h2 style={{ marginTop: 0, textAlign: 'center' }}>🔒 老闆專區</h2>
            <p style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>
              營業額與收班為老闆專用，請輸入老闆 PIN
            </p>
            <form onSubmit={unlock}>
              <input
                className="textarea"
                type="password"
                inputMode="numeric"
                placeholder="老闆 PIN"
                value={pin}
                autoFocus
                onChange={(e) => setPin(e.target.value)}
                style={{ marginBottom: 10 }}
              />
              {pinError && (
                <div style={{ color: 'var(--danger)', marginBottom: 10 }}>
                  {pinError}
                </div>
              )}
              <button
                className="btn-primary"
                style={{ width: '100%' }}
                disabled={checking || !pin}
                type="submit"
              >
                {checking ? '驗證中…' : '解鎖'}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* 今日日結單（可列印） */}
            <div className="card" id="zreport">
              <h2 style={{ margin: '0 0 4px', textAlign: 'center' }}>
                {RESTAURANT_NAME} 日結單
              </h2>
              <div style={{ textAlign: 'center', color: '#888', fontSize: 13 }}>
                營業日 {today.businessDate}
                {todayClose && (
                  <>
                    <br />
                    已收班　{formatTaipei(todayClose.closedAt)}
                  </>
                )}
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '12px 0' }} />

              <Row label="營業額合計" value={`$${today.totalRevenue}`} bold big />
              <Row label="已結帳單數" value={`${today.orderCount} 單`} />
              <Row label="平均客單價" value={`$${today.avgTicket}`} />
              <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '12px 0' }} />
              <Row
                label="內用"
                value={`${today.dineInCount} 單　$${today.dineInRevenue}`}
              />
              <Row
                label="外帶"
                value={`${today.takeoutCount} 單　$${today.takeoutRevenue}`}
              />
              <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '12px 0' }} />
              <Row label="作廢單數" value={`${today.cancelledCount} 單`} />
              <Row label="尚待結帳" value={`${today.unpaidCount} 張`} warn={today.unpaidCount > 0} />
            </div>

            {today.unpaidCount > 0 && (
              <div className="card no-print" style={{ color: 'var(--danger)', fontSize: 14 }}>
                ⚠️ 還有 {today.unpaidCount} 張未結帳。收班會先把逾時未結的單自動作廢；
                若有客人還沒結，請先去「訂單」處理完再收班。
              </div>
            )}

            <div className="order-actions no-print" style={{ marginBottom: 20 }}>
              <button className="btn-ok" disabled={closing} onClick={doClose}>
                {closing ? '收班中…' : todayClose ? '重新收班（更新數字）' : '收班並記錄'}
              </button>
              <button className="btn-ghost" onClick={() => window.print()}>
                列印日結單
              </button>
            </div>

            {/* 歷史收班紀錄 */}
            <h3 className="no-print">歷史收班紀錄</h3>
            <div className="card no-print">
              {history.length === 0 ? (
                <div className="empty">尚無收班紀錄</div>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="order-line" style={{ padding: '8px 0' }}>
                    <span>
                      <strong>{h.businessDate}</strong>{' '}
                      <span style={{ color: '#888', fontSize: 12 }}>
                        （{h.orderCount} 單 · 內用 {h.dineInCount} / 外帶 {h.takeoutCount}）
                      </span>
                    </span>
                    <span style={{ fontWeight: 700 }}>${h.totalRevenue}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Row({
  label,
  value,
  bold,
  big,
  warn,
}: {
  label: string;
  value: string;
  bold?: boolean;
  big?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className="order-line"
      style={{
        fontWeight: bold ? 800 : 400,
        fontSize: big ? 20 : 15,
        padding: '4px 0',
        color: warn ? 'var(--danger)' : 'inherit',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
