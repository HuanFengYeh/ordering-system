// 一致的線性 icon（取代 emoji，風格對齊 Toast）。
// 純展示元件，client / server 皆可用；顏色隨 currentColor，尺寸用 size。
import type { CSSProperties } from 'react';

type IconProps = { size?: number; style?: CSSProperties; className?: string };

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

// 內用：刀叉
export function IconDineIn({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <path d="M3 2v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2" />
      <path d="M5 11v11" />
      <path d="M19 15V2a4 4 0 0 0-4 4v5a2 2 0 0 0 2 2h2Zm0 0v7" />
    </svg>
  );
}

// 外帶：提袋
export function IconTakeout({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

// 購物車
export function IconCart({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2 3h2l2.4 12a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.5L21 8H6" />
    </svg>
  );
}

// 鈴鐺（新訂單提示）
export function IconBell({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

// 完成打勾（圓圈）
export function IconCheck({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

// 關閉 / 清除（線性 X，比 × 字元置中更準）
export function IconClose({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

// 搜尋
export function IconSearch({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

// 鎖（老闆專區/安全）
export function IconLock({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// 鑰匙（PIN / 密碼）
export function IconKey({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

// 警告（三角驚嘆號）
export function IconWarn({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

// 印表機（出單機設定）
export function IconPrinter({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

// 資訊 / 提示
export function IconInfo({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

// 連結（連動菜單品項）
export function IconLink({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7L12 5" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
    </svg>
  );
}

// 餐點佔位（後台無照片時）
export function IconDish({ size = 20, style, className }: IconProps) {
  return (
    <svg {...base(size)} style={style} className={className} aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 18 0Z" />
      <path d="M2 12h20" />
      <path d="M12 5V3" />
    </svg>
  );
}
