import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { RESTAURANT_NAME } from '@/lib/config';
import './globals.css';

// 拉丁字母 / 數字用的設計字體（只含 latin subset，約數十 KB，不拖慢行動載入）。
// 中文字仍走系統字體（iOS PingFang、Android Noto Sans CJK），最穩最快也最好看。
const latin = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-latin',
});

export const metadata: Metadata = {
  title: `${RESTAURANT_NAME} 點餐系統`,
  description: '掃碼點餐',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant" className={latin.variable}>
      <body>{children}</body>
    </html>
  );
}
