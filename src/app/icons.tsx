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
