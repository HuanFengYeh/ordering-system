'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RESTAURANT_NAME } from '@/lib/config';

type Variant = { id: number; label: string; price: number };
type Item = {
  id: number;
  name: string;
  description: string | null;
  available: boolean;
  variants: Variant[];
};
type Category = {
  id: number;
  name: string;
  note: string | null;
  items: Item[];
};

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
