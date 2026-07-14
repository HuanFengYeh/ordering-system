'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RESTAURANT_NAME } from '@/lib/config';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/admin/orders';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || '登入失敗');
      }
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗');
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 360, paddingTop: 60 }}>
      <div className="card">
        <h2 style={{ marginTop: 0, textAlign: 'center' }}>
          {RESTAURANT_NAME} 櫃檯登入
        </h2>
        <form onSubmit={submit}>
          <input
            className="textarea"
            type="password"
            placeholder="輸入櫃檯密碼"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          {error && (
            <div style={{ color: 'var(--danger)', marginBottom: 12 }}>
              {error}
            </div>
          )}
          <button
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading || !password}
            type="submit"
          >
            {loading ? '登入中…' : '登入'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="center">載入中…</div>}>
      <LoginForm />
    </Suspense>
  );
}
