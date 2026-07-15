import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/baseUrl';
import {
  getPrintMode,
  setPrintMode,
  checkAdminPassword,
  setAdminPassword,
  adminPasswordCustomized,
  checkOwnerPin,
  setOwnerPin,
  ownerPinConfigured,
  type PrintMode,
} from '@/lib/settings';

export const dynamic = 'force-dynamic';

// GET /api/admin/settings — 目前設定狀態（不含任何密碼值）
export async function GET() {
  const [printMode, ownerSet, adminCustom] = await Promise.all([
    getPrintMode(),
    ownerPinConfigured(),
    adminPasswordCustomized(),
  ]);
  return NextResponse.json({
    printMode,
    cloudprntUrl: `${getBaseUrl()}/api/cloudprnt`,
    ownerPinSet: ownerSet,
    adminPasswordCustomized: adminCustom,
  });
}

// POST /api/admin/settings — 依 action 更新設定
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === 'setPrintMode') {
    const v = String(body.value) as PrintMode;
    if (!['browser', 'cloudprnt', 'both'].includes(v)) {
      return NextResponse.json({ error: '無效的出單方式' }, { status: 400 });
    }
    await setPrintMode(v);
    return NextResponse.json({ ok: true });
  }

  if (action === 'changeAdminPassword') {
    const current = String(body.current ?? '');
    const next = String(body.next ?? '');
    if (next.length < 4) {
      return NextResponse.json(
        { error: '新密碼至少 4 個字' },
        { status: 400 }
      );
    }
    if (!(await checkAdminPassword(current))) {
      return NextResponse.json({ error: '目前密碼不正確' }, { status: 403 });
    }
    await setAdminPassword(next);
    return NextResponse.json({ ok: true });
  }

  if (action === 'changeOwnerPin') {
    const current = String(body.current ?? '');
    const next = String(body.next ?? '');
    if (!/^\d{4,}$/.test(next)) {
      return NextResponse.json(
        { error: '新 PIN 請設 4 位以上數字' },
        { status: 400 }
      );
    }
    // 已設定過就要驗證舊 PIN；第一次設定則免（僅需已登入後台）
    if ((await ownerPinConfigured()) && !(await checkOwnerPin(current))) {
      return NextResponse.json({ error: '目前 PIN 不正確' }, { status: 403 });
    }
    await setOwnerPin(next);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: '未知的操作' }, { status: 400 });
}
