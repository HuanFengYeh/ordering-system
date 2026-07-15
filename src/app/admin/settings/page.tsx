'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RESTAURANT_NAME } from '@/lib/config';

type Settings = {
  printMode: 'browser' | 'cloudprnt' | 'both';
  cloudprntUrl: string;
  ownerPinSet: boolean;
  adminPasswordCustomized: boolean;
};

const PRINT_MODES: {
  key: Settings['printMode'];
  label: string;
  desc: string;
}[] = [
  { key: 'browser', label: '瀏覽器列印', desc: '結帳後跳出列印視窗（用電腦/平板接的印表機）' },
  { key: 'cloudprnt', label: '雲端出單機', desc: '自動出單、自動裁紙，免人工按（Star CloudPRNT）' },
  { key: 'both', label: '兩者都要', desc: '雲端自動出單，同時也跳瀏覽器列印' },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const [s, setS] = useState<Settings | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/settings', { cache: 'no-store' });
    if (res.status === 401) {
      router.replace('/admin/login?next=/admin/settings');
      return;
    }
    setS(await res.json());
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  function flash(text: string, ok: boolean) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  }

  async function post(body: unknown, okText: string) {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      flash(d.error || '操作失敗', false);
      return false;
    }
    flash(okText, true);
    await load();
    return true;
  }

  return (
    <>
      <div className="appbar">
        <span className="brand">{RESTAURANT_NAME}</span>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/admin/orders" style={{ color: '#fff' }}>
            訂單
          </Link>
          <Link href="/admin/help" style={{ color: '#fff' }}>
            教學
          </Link>
        </span>
      </div>

      <div className="container">
        <h2 style={{ marginBottom: 4 }}>設定</h2>
        <p style={{ color: '#888', fontSize: 13, marginTop: 0 }}>
          出單方式、密碼與老闆 PIN 都可在這裡調整，改完立即生效。
        </p>

        {msg && (
          <div
            className="card"
            style={{
              color: msg.ok ? 'var(--ok)' : 'var(--danger)',
              fontWeight: 600,
            }}
          >
            {msg.ok ? '✅ ' : '⚠️ '}
            {msg.text}
          </div>
        )}

        {!s ? (
          <div className="empty">載入中…</div>
        ) : (
          <>
            <PrinterCard s={s} onSave={post} />
            <AdminPwCard onSave={post} />
            <OwnerPinCard s={s} onSave={post} />
          </>
        )}
      </div>
    </>
  );
}

function PrinterCard({
  s,
  onSave,
}: {
  s: Settings;
  onSave: (body: unknown, okText: string) => Promise<boolean>;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>🖨️ 出單機</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PRINT_MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => onSave({ action: 'setPrintMode', value: m.key }, '出單方式已更新')}
            className={s.printMode === m.key ? 'btn-primary' : 'btn-ghost'}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              display: 'block',
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {s.printMode === m.key ? '● ' : '○ '}
              {m.label}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              {m.desc}
            </div>
          </button>
        ))}
      </div>

      {(s.printMode === 'cloudprnt' || s.printMode === 'both') && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            出單機設定網址
          </div>
          <p style={{ color: '#888', fontSize: 12, margin: '0 0 8px' }}>
            在 Star CloudPRNT 印表機的設定裡，把「server URL」填成下面這串：
          </p>
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              background: 'var(--brand-tint, #fff3e0)',
              padding: '8px 10px',
              borderRadius: 8,
            }}
          >
            <code style={{ fontSize: 12, wordBreak: 'break-all', flex: 1 }}>
              {s.cloudprntUrl}
            </code>
            <button
              className="btn-ghost"
              style={{ padding: '6px 10px', fontSize: 13, whiteSpace: 'nowrap' }}
              onClick={() => {
                navigator.clipboard?.writeText(s.cloudprntUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? '已複製' : '複製'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPwCard({
  onSave,
}: {
  onSave: (body: unknown, okText: string) => Promise<boolean>;
}) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>🔑 換櫃檯密碼</h3>
      <p style={{ color: '#888', fontSize: 12, marginTop: 0 }}>
        員工登入櫃檯後台用的密碼。
      </p>
      <input
        className="textarea"
        type="password"
        placeholder="目前的櫃檯密碼"
        value={cur}
        onChange={(e) => setCur(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <input
        className="textarea"
        type="password"
        placeholder="新的櫃檯密碼（至少 4 字）"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        style={{ marginBottom: 10 }}
      />
      <button
        className="btn-primary"
        disabled={!cur || !next}
        onClick={async () => {
          const ok = await onSave(
            { action: 'changeAdminPassword', current: cur, next },
            '櫃檯密碼已更新'
          );
          if (ok) {
            setCur('');
            setNext('');
          }
        }}
      >
        更新密碼
      </button>
    </div>
  );
}

function OwnerPinCard({
  s,
  onSave,
}: {
  s: Settings;
  onSave: (body: unknown, okText: string) => Promise<boolean>;
}) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>🔒 換老闆 PIN</h3>
      <p style={{ color: '#888', fontSize: 12, marginTop: 0 }}>
        看營業額、收班用的 PIN（員工不知道就看不到營業額）。
        {!s.ownerPinSet && ' 目前尚未設定，設定後才能進收班頁。'}
      </p>
      {s.ownerPinSet && (
        <input
          className="textarea"
          type="password"
          inputMode="numeric"
          placeholder="目前的老闆 PIN"
          value={cur}
          onChange={(e) => setCur(e.target.value)}
          style={{ marginBottom: 8 }}
        />
      )}
      <input
        className="textarea"
        type="password"
        inputMode="numeric"
        placeholder="新的老闆 PIN（4 位以上數字）"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        style={{ marginBottom: 10 }}
      />
      <button
        className="btn-primary"
        disabled={!next || (s.ownerPinSet && !cur)}
        onClick={async () => {
          const ok = await onSave(
            { action: 'changeOwnerPin', current: cur, next },
            '老闆 PIN 已更新'
          );
          if (ok) {
            setCur('');
            setNext('');
          }
        }}
      >
        {s.ownerPinSet ? '更新 PIN' : '設定 PIN'}
      </button>
    </div>
  );
}
