'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RESTAURANT_NAME } from '@/lib/config';

type Table = { id: number; number: number; token: string };

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch('/api/admin/tables', { cache: 'no-store' });
    setTables(await res.json());
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function addTable() {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) alert((await res.json()).error || '新增失敗');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function del(id: number, number: number) {
    if (!confirm(`確定刪除桌 ${number}？`)) return;
    const res = await fetch(`/api/admin/tables/${id}`, { method: 'DELETE' });
    if (!res.ok) alert((await res.json()).error || '刪除失敗');
    await load();
  }

  async function regen(id: number, number: number) {
    if (!confirm(`重新產生桌 ${number} 的 QR？舊 QR 會失效。`)) return;
    const res = await fetch(`/api/admin/tables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regenerate: true }),
    });
    if (!res.ok) alert((await res.json()).error || '操作失敗');
    await load();
  }

  return (
    <>
      <div className="appbar">
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0 }}>桌號管理</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              className="btn-ghost"
              href="/admin/tables/print"
              target="_blank"
              style={{ padding: '8px 14px' }}
            >
              列印全部 QR
            </Link>
            <button
              className="btn-primary"
              style={{ padding: '8px 14px' }}
              onClick={addTable}
              disabled={busy}
            >
              ＋ 新增桌
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty">載入中…</div>
        ) : (
          <div className="card">
            {tables.map((t) => (
              <div key={t.id} className="variant-row">
                <div>
                  <strong>桌 {t.number}</strong>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    /order/{t.token}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    className="btn-ghost"
                    href={`/order/${t.token}`}
                    target="_blank"
                    style={{ padding: '6px 10px', fontSize: 13 }}
                  >
                    預覽
                  </Link>
                  <button
                    className="btn-ghost"
                    style={{ padding: '6px 10px', fontSize: 13 }}
                    onClick={() => regen(t.id, t.number)}
                  >
                    換 QR
                  </button>
                  <button
                    className="btn-danger"
                    style={{ padding: '6px 10px', fontSize: 13 }}
                    onClick={() => del(t.id, t.number)}
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
            {tables.length === 0 && <div className="empty">尚無桌位</div>}
          </div>
        )}
      </div>
    </>
  );
}
