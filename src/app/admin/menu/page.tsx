'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { RESTAURANT_NAME } from '@/lib/config';
import { IconDish } from '@/app/icons';

type Variant = { id: number; label: string; price: number };
type ModOption = {
  id: number;
  label: string;
  priceDelta: number;
  available: boolean;
  // 若連動菜單品項，這裡帶來源規格（名稱/價格以來源為準）
  sourceVariantId: number | null;
  sourceVariant: {
    price: number;
    label: string;
    menuItem: { name: string; available: boolean };
  } | null;
};
type ModGroup = {
  id: number;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: ModOption[];
};
type Item = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  available: boolean;
  variants: Variant[];
  modifierGroups: ModGroup[];
};
type Category = {
  id: number;
  name: string;
  note: string | null;
  items: Item[];
};

// 前端把照片縮圖後轉為 data URL（serverless 無持久檔案系統，存 DB）
function downscaleToDataUrl(
  file: File,
  maxSize = 480,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('no canvas'));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('圖片讀取失敗'));
    img.src = url;
  });
}

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    alert(d.error || '操作失敗');
    return null;
  }
  return res.json().catch(() => ({}));
}

export default function AdminMenuPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState('');

  async function load() {
    const res = await fetch('/api/admin/categories', { cache: 'no-store' });
    setCats(await res.json());
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function addCategory() {
    if (!newCat.trim()) return;
    await api('/api/admin/categories', 'POST', { name: newCat });
    setNewCat('');
    load();
  }

  return (
    <>
      <div className="appbar">
        <span className="brand">{RESTAURANT_NAME}</span>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/admin/orders" style={{ color: '#fff' }}>
            訂單
          </Link>
          <Link href="/admin/tables" style={{ color: '#fff' }}>
            桌號
          </Link>
        </span>
      </div>

      <div className="container">
        <h2 style={{ marginBottom: 4 }}>菜單管理</h2>
        <p style={{ color: '#888', fontSize: 13, marginTop: 0 }}>
          停售的品項客人端不會顯示。已被訂單使用的品項/規格無法刪除，請改為停售。
        </p>

        <div className="card" style={{ display: 'flex', gap: 8 }}>
          <input
            className="textarea"
            placeholder="新增分類名稱，例如：限定甜點"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
          <button
            className="btn-primary"
            style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
            onClick={addCategory}
          >
            ＋ 分類
          </button>
        </div>

        {loading ? (
          <div className="empty">載入中…</div>
        ) : (
          cats.map((cat) => (
            <CategoryBlock key={cat.id} cat={cat} onChange={load} />
          ))
        )}
      </div>
    </>
  );
}

function CategoryBlock({
  cat,
  onChange,
}: {
  cat: Category;
  onChange: () => void;
}) {
  const [name, setName] = useState(cat.name);
  const [note, setNote] = useState(cat.note ?? '');
  const [newItem, setNewItem] = useState('');
  const [newPrice, setNewPrice] = useState('');

  async function saveCat() {
    await api(`/api/admin/categories/${cat.id}`, 'PATCH', { name, note });
    onChange();
  }
  async function delCat() {
    if (!confirm(`刪除分類「${cat.name}」與其所有品項？`)) return;
    await api(`/api/admin/categories/${cat.id}`, 'DELETE');
    onChange();
  }
  async function addItem() {
    if (!newItem.trim()) return;
    await api('/api/admin/items', 'POST', {
      categoryId: cat.id,
      name: newItem,
      price: Number(newPrice) || 0,
    });
    setNewItem('');
    setNewPrice('');
    onChange();
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          className="textarea"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveCat}
          style={{ fontWeight: 700 }}
        />
        <button className="btn-danger" style={{ padding: '6px 10px' }} onClick={delCat}>
          刪
        </button>
      </div>
      <input
        className="textarea"
        placeholder="分類說明（可空）"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={saveCat}
        style={{ fontSize: 12, marginTop: 6 }}
      />

      <div style={{ marginTop: 10 }}>
        {cat.items.map((item) => (
          <ItemBlock key={item.id} item={item} onChange={onChange} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input
          className="textarea"
          placeholder="新增品項名稱"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <input
          className="textarea"
          placeholder="價格"
          inputMode="numeric"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          style={{ width: 80 }}
        />
        <button
          className="btn-ghost"
          style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}
          onClick={addItem}
        >
          ＋ 品項
        </button>
      </div>
    </div>
  );
}

function ItemBlock({ item, onChange }: { item: Item; onChange: () => void }) {
  const [name, setName] = useState(item.name);
  const [newVarLabel, setNewVarLabel] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');
  const [uploading, setUploading] = useState(false);

  async function onPickImage(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ''; // 允許重選同一檔
    if (!f) return;
    setUploading(true);
    try {
      const dataUrl = await downscaleToDataUrl(f);
      await api(`/api/admin/items/${item.id}`, 'PATCH', { imageUrl: dataUrl });
      onChange();
    } catch {
      alert('照片處理失敗，請換一張');
    } finally {
      setUploading(false);
    }
  }
  async function removeImage() {
    await api(`/api/admin/items/${item.id}`, 'PATCH', { imageUrl: null });
    onChange();
  }

  async function saveName() {
    if (name !== item.name)
      await api(`/api/admin/items/${item.id}`, 'PATCH', { name });
    onChange();
  }
  async function toggle() {
    await api(`/api/admin/items/${item.id}`, 'PATCH', {
      available: !item.available,
    });
    onChange();
  }
  async function delItem() {
    if (!confirm(`刪除品項「${item.name}」？`)) return;
    await api(`/api/admin/items/${item.id}`, 'DELETE');
    onChange();
  }
  async function addVariant() {
    await api('/api/admin/variants', 'POST', {
      menuItemId: item.id,
      label: newVarLabel,
      price: Number(newVarPrice) || 0,
    });
    setNewVarLabel('');
    setNewVarPrice('');
    onChange();
  }

  return (
    <div
      style={{
        borderTop: '1px solid #eee',
        paddingTop: 8,
        marginTop: 8,
        opacity: item.available ? 1 : 0.5,
      }}
    >
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          className="textarea"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          style={{ fontWeight: 600 }}
        />
        <button
          className={item.available ? 'btn-ghost' : 'btn-primary'}
          style={{ padding: '6px 10px', fontSize: 13, whiteSpace: 'nowrap' }}
          onClick={toggle}
        >
          {item.available ? '停售' : '開賣'}
        </button>
        <button
          className="btn-danger"
          style={{ padding: '6px 10px', fontSize: 13 }}
          onClick={delItem}
        >
          刪
        </button>
      </div>

      {/* 照片：縮圖預覽 + 上傳 / 移除 */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          marginTop: 8,
          paddingLeft: 12,
        }}
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{
              width: 56,
              height: 56,
              objectFit: 'cover',
              borderRadius: 8,
              background: '#f2f2f2',
            }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 8,
              background: '#f2f2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
            }}
          >
            <IconDish size={24} />
          </div>
        )}
        <label
          className="btn-ghost"
          style={{
            padding: '6px 12px',
            fontSize: 13,
            display: 'inline-block',
          }}
        >
          {uploading ? '處理中…' : item.imageUrl ? '換照片' : '上傳照片'}
          <input
            type="file"
            accept="image/*"
            onChange={onPickImage}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        {item.imageUrl && (
          <button
            className="btn-danger"
            style={{ padding: '6px 10px', fontSize: 13 }}
            onClick={removeImage}
          >
            移除
          </button>
        )}
      </div>

      {item.variants.map((v) => (
        <VariantRow key={v.id} variant={v} onChange={onChange} />
      ))}

      <div style={{ display: 'flex', gap: 6, marginTop: 6, paddingLeft: 12 }}>
        <input
          className="textarea"
          placeholder="規格名（單一價留空）"
          value={newVarLabel}
          onChange={(e) => setNewVarLabel(e.target.value)}
          style={{ fontSize: 13 }}
        />
        <input
          className="textarea"
          placeholder="價"
          inputMode="numeric"
          value={newVarPrice}
          onChange={(e) => setNewVarPrice(e.target.value)}
          style={{ width: 64, fontSize: 13 }}
        />
        <button
          className="btn-ghost"
          style={{ padding: '6px 10px', fontSize: 13, whiteSpace: 'nowrap' }}
          onClick={addVariant}
        >
          ＋ 規格
        </button>
      </div>

      <ModifierEditor item={item} onChange={onChange} />
    </div>
  );
}

// ── 客製群組管理（辣度、加料…）───────────────────────────────
function ModifierEditor({
  item,
  onChange,
}: {
  item: Item;
  onChange: () => void;
}) {
  const [newGroup, setNewGroup] = useState('');

  async function addGroup() {
    if (!newGroup.trim()) return;
    await api('/api/admin/modifier-groups', 'POST', {
      menuItemId: item.id,
      name: newGroup,
    });
    setNewGroup('');
    onChange();
  }

  return (
    <div
      style={{
        marginTop: 10,
        marginLeft: 12,
        paddingLeft: 10,
        borderLeft: '2px solid var(--brand-tint)',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--brand-dark)', fontWeight: 700 }}>
        客製選項
      </div>
      {item.modifierGroups.map((g) => (
        <GroupBlock key={g.id} group={g} onChange={onChange} />
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <input
          className="textarea"
          placeholder="新增群組，例如：辣度、加料"
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
          style={{ fontSize: 13 }}
        />
        <button
          className="btn-ghost"
          style={{ padding: '6px 10px', fontSize: 13, whiteSpace: 'nowrap' }}
          onClick={addGroup}
        >
          ＋ 群組
        </button>
      </div>
    </div>
  );
}

function GroupBlock({
  group,
  onChange,
}: {
  group: ModGroup;
  onChange: () => void;
}) {
  const [name, setName] = useState(group.name);
  const [min, setMin] = useState(String(group.minSelect));
  const [max, setMax] = useState(String(group.maxSelect));
  const [newOpt, setNewOpt] = useState('');
  const [newDelta, setNewDelta] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showApply, setShowApply] = useState(false);

  async function saveGroup(patch: Record<string, unknown>) {
    await api(`/api/admin/modifier-groups/${group.id}`, 'PATCH', patch);
    onChange();
  }
  async function delGroup() {
    if (!confirm(`刪除群組「${group.name}」與其所有選項？`)) return;
    await api(`/api/admin/modifier-groups/${group.id}`, 'DELETE');
    onChange();
  }
  async function addOption() {
    if (!newOpt.trim()) return;
    await api('/api/admin/modifier-options', 'POST', {
      groupId: group.id,
      label: newOpt,
      priceDelta: Number(newDelta) || 0,
    });
    setNewOpt('');
    setNewDelta('');
    onChange();
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: 8,
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          className="textarea"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== group.name && saveGroup({ name })}
          style={{ fontSize: 13, fontWeight: 700 }}
        />
        <button
          className="btn-danger"
          style={{ padding: '4px 8px', fontSize: 12 }}
          onClick={delGroup}
        >
          ✕
        </button>
      </div>

      {/* 群組規則：必選 / 最少 / 最多 */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          marginTop: 6,
          fontSize: 12,
          color: '#555',
          flexWrap: 'wrap',
        }}
      >
        <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={group.required}
            onChange={(e) => saveGroup({ required: e.target.checked })}
          />
          必選
        </label>
        <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          最少
          <input
            className="textarea"
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onBlur={() =>
              Number(min) !== group.minSelect && saveGroup({ minSelect: min })
            }
            style={{ width: 44, fontSize: 12, padding: 4 }}
          />
        </label>
        <label style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          最多
          <input
            className="textarea"
            inputMode="numeric"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onBlur={() =>
              Number(max) !== group.maxSelect && saveGroup({ maxSelect: max })
            }
            style={{ width: 44, fontSize: 12, padding: 4 }}
          />
        </label>
        <span style={{ color: '#999' }}>
          （最多 1＝單選；&gt;1＝可複選）
        </span>
      </div>

      {group.options.map((o) => (
        <OptionRow key={o.id} option={o} onChange={onChange} />
      ))}

      <div style={{ display: 'flex', gap: 6, marginTop: 6, paddingLeft: 8 }}>
        <input
          className="textarea"
          placeholder="選項名，例如：大辣、加起司"
          value={newOpt}
          onChange={(e) => setNewOpt(e.target.value)}
          style={{ fontSize: 12 }}
        />
        <input
          className="textarea"
          placeholder="加價"
          inputMode="numeric"
          value={newDelta}
          onChange={(e) => setNewDelta(e.target.value)}
          style={{ width: 60, fontSize: 12 }}
        />
        <button
          className="btn-ghost"
          style={{ padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
          onClick={addOption}
        >
          ＋ 選項
        </button>
      </div>

      {/* 連動菜單品項 & 一鍵套用 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <button
          className="btn-ghost"
          style={{ padding: '5px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
          onClick={() => {
            setShowPicker((v) => !v);
            setShowApply(false);
          }}
        >
          🔗 從菜單挑選
        </button>
        <button
          className="btn-ghost"
          style={{ padding: '5px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
          onClick={() => {
            setShowApply((v) => !v);
            setShowPicker(false);
          }}
        >
          套用到分類…
        </button>
      </div>

      {showPicker && (
        <MenuPicker
          groupId={group.id}
          onChange={onChange}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showApply && (
        <ApplyPicker
          groupId={group.id}
          onChange={onChange}
          onClose={() => setShowApply(false)}
        />
      )}
    </div>
  );
}

function OptionRow({
  option,
  onChange,
}: {
  option: ModOption;
  onChange: () => void;
}) {
  const [label, setLabel] = useState(option.label);
  const [delta, setDelta] = useState(String(option.priceDelta));
  const linked = option.sourceVariantId != null;

  async function save() {
    if (label !== option.label || Number(delta) !== option.priceDelta) {
      await api(`/api/admin/modifier-options/${option.id}`, 'PATCH', {
        label,
        priceDelta: Number(delta) || 0,
      });
      onChange();
    }
  }
  async function toggle() {
    await api(`/api/admin/modifier-options/${option.id}`, 'PATCH', {
      available: !option.available,
    });
    onChange();
  }
  async function del() {
    if (!confirm(`刪除選項「${option.label}」？`)) return;
    await api(`/api/admin/modifier-options/${option.id}`, 'DELETE');
    onChange();
  }

  // 連動菜單品項：名稱/價格唯讀（跟菜單走），只能停售或刪除
  if (linked) {
    const sv = option.sourceVariant;
    const name = sv
      ? sv.menuItem.name + (sv.label ? `（${sv.label}）` : '')
      : option.label;
    const price = sv ? sv.price : option.priceDelta;
    const gone = !sv || !sv.menuItem.available;
    return (
      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          marginTop: 6,
          paddingLeft: 8,
          opacity: option.available && !gone ? 1 : 0.45,
        }}
      >
        <span style={{ fontSize: 12, flex: 1 }}>
          🔗 {name}{' '}
          <span style={{ color: 'var(--brand-dark)', fontWeight: 700 }}>
            +${price}
          </span>
          {gone && (
            <span
              style={{ color: 'var(--danger)', fontSize: 11, marginLeft: 6 }}
            >
              （來源已停售）
            </span>
          )}
          <span style={{ color: '#aaa', fontSize: 11, marginLeft: 6 }}>
            菜單連動
          </span>
        </span>
        <button
          className={option.available ? 'btn-ghost' : 'btn-primary'}
          style={{ padding: '4px 8px', fontSize: 11, whiteSpace: 'nowrap' }}
          onClick={toggle}
        >
          {option.available ? '停' : '開'}
        </button>
        <button
          className="btn-danger"
          style={{ padding: '4px 8px', fontSize: 11 }}
          onClick={del}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        marginTop: 6,
        paddingLeft: 8,
        opacity: option.available ? 1 : 0.45,
      }}
    >
      <input
        className="textarea"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={save}
        style={{ fontSize: 12 }}
      />
      <span style={{ color: '#888', fontSize: 12 }}>+$</span>
      <input
        className="textarea"
        inputMode="numeric"
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
        onBlur={save}
        style={{ width: 56, fontSize: 12 }}
      />
      <button
        className={option.available ? 'btn-ghost' : 'btn-primary'}
        style={{ padding: '4px 8px', fontSize: 11, whiteSpace: 'nowrap' }}
        onClick={toggle}
      >
        {option.available ? '停' : '開'}
      </button>
      <button
        className="btn-danger"
        style={{ padding: '4px 8px', fontSize: 11 }}
        onClick={del}
      >
        ✕
      </button>
    </div>
  );
}

// 從既有菜單品項挑選，加成「連動加點」選項（名稱/價格跟菜單走）
function MenuPicker({
  groupId,
  onChange,
  onClose,
}: {
  groupId: number;
  onChange: () => void;
  onClose: () => void;
}) {
  const [cats, setCats] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/categories', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setCats)
      .catch(() => {});
  }, []);

  async function add(variantId: number) {
    setBusy(true);
    await api('/api/admin/modifier-options', 'POST', {
      groupId,
      sourceVariantId: variantId,
    });
    setBusy(false);
    onChange();
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: 8,
        border: '1px dashed var(--brand)',
        borderRadius: 8,
        background: 'var(--brand-tint)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <strong style={{ fontSize: 13 }}>從菜單挑選加點品項</strong>
        <button
          className="btn-ghost"
          style={{ padding: '2px 8px', fontSize: 12 }}
          onClick={onClose}
        >
          完成
        </button>
      </div>
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {cats.map((c) => (
          <div key={c.id} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 11, color: '#999' }}>{c.name}</div>
            {c.items.flatMap((it) =>
              it.variants.map((v) => (
                <button
                  key={v.id}
                  disabled={busy}
                  onClick={() => add(v.id)}
                  className="btn-ghost"
                  style={{
                    fontSize: 12,
                    padding: '4px 8px',
                    margin: '3px 4px 0 0',
                  }}
                >
                  ＋ {it.name}
                  {v.label ? `（${v.label}）` : ''} ${v.price}
                </button>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 一鍵把這組設定套用到所選分類的所有品項（例如所有主餐）
function ApplyPicker({
  groupId,
  onChange,
  onClose,
}: {
  groupId: number;
  onChange: () => void;
  onClose: () => void;
}) {
  const [cats, setCats] = useState<Category[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/categories', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setCats)
      .catch(() => {});
  }, []);

  async function apply() {
    if (picked.length === 0) return;
    setBusy(true);
    const res = await api(`/api/admin/modifier-groups/${groupId}/apply`, 'POST', {
      categoryIds: picked,
    });
    setBusy(false);
    if (res) {
      alert(`已套用到 ${res.applied} 個品項`);
      onChange();
      onClose();
    }
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: 8,
        border: '1px dashed var(--brand)',
        borderRadius: 8,
        background: 'var(--brand-tint)',
      }}
    >
      <strong style={{ fontSize: 13 }}>套用這組設定到分類（覆蓋同名群組）</strong>
      <div style={{ marginTop: 6 }}>
        {cats.map((c) => (
          <label
            key={c.id}
            style={{
              display: 'inline-flex',
              gap: 4,
              alignItems: 'center',
              fontSize: 12,
              marginRight: 12,
            }}
          >
            <input
              type="checkbox"
              checked={picked.includes(c.id)}
              onChange={(e) =>
                setPicked((p) =>
                  e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)
                )
              }
            />
            {c.name}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          className="btn-primary"
          style={{ padding: '4px 12px', fontSize: 12 }}
          disabled={busy || picked.length === 0}
          onClick={apply}
        >
          {busy ? '套用中…' : '套用'}
        </button>
        <button
          className="btn-ghost"
          style={{ padding: '4px 12px', fontSize: 12 }}
          onClick={onClose}
        >
          取消
        </button>
      </div>
    </div>
  );
}

function VariantRow({
  variant,
  onChange,
}: {
  variant: Variant;
  onChange: () => void;
}) {
  const [label, setLabel] = useState(variant.label);
  const [price, setPrice] = useState(String(variant.price));

  async function save() {
    if (label !== variant.label || Number(price) !== variant.price) {
      await api(`/api/admin/variants/${variant.id}`, 'PATCH', {
        label,
        price: Number(price) || 0,
      });
      onChange();
    }
  }
  async function del() {
    if (!confirm('刪除此規格？')) return;
    await api(`/api/admin/variants/${variant.id}`, 'DELETE');
    onChange();
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        marginTop: 6,
        paddingLeft: 12,
      }}
    >
      <input
        className="textarea"
        placeholder="（單一價）"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={save}
        style={{ fontSize: 13 }}
      />
      <span style={{ color: '#888' }}>$</span>
      <input
        className="textarea"
        value={price}
        inputMode="numeric"
        onChange={(e) => setPrice(e.target.value)}
        onBlur={save}
        style={{ width: 64, fontSize: 13 }}
      />
      <button
        className="btn-danger"
        style={{ padding: '4px 8px', fontSize: 12 }}
        onClick={del}
      >
        ✕
      </button>
    </div>
  );
}
