import type { Metadata } from 'next';
import { RESTAURANT_NAME } from '@/lib/config';
import './globals.css';

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
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
