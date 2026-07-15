'use client';

import Link from 'next/link';
import { RESTAURANT_NAME } from '@/lib/config';

// 後台內建操作教學。純靜態內容，給櫃檯/店長隨時查。
export default function AdminHelpPage() {
  return (
    <>
      <div className="appbar no-print">
        <span className="brand">{RESTAURANT_NAME}</span>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/admin/orders" style={{ color: '#fff' }}>
            訂單
          </Link>
          <Link href="/admin/settings" style={{ color: '#fff' }}>
            設定
          </Link>
        </span>
      </div>

      <div className="container">
        <h2 style={{ marginBottom: 2 }}>操作教學</h2>
        <p style={{ color: '#888', fontSize: 13, marginTop: 0 }}>
          給櫃檯與外場的日常操作指南。點右上「設定」可改密碼與出單機。
        </p>

        <Section title="01 · 客人怎麼點餐" note="客人自己用手機完成">
          <Steps
            items={[
              ['掃桌上的 QR code', '外帶客人掃櫃檯的「外帶 QR」。'],
              ['選內用或外帶', '外帶會請客人留姓名或電話末三碼，方便叫號。'],
              [
                '點餐、選規格、加備註',
                '例如招牌湯麵可選 意麵/雞絲/河粉/冬粉/讚岐烏龍；可對每一項加備註。',
              ],
              ['按「送出訂單」', '櫃檯平板會馬上收到並響鈴。'],
            ]}
          />
          <Callout>
            客人是<b>先點餐、再到櫃檯結帳</b>。送出不等於付款，收到錢才算完成。
          </Callout>
        </Section>

        <Section title="02 · 櫃檯：接單 · 結帳 · 出單">
          <p style={{ fontWeight: 700, margin: '0 0 4px' }}>開店先做</p>
          <ul className="help-ul">
            <li>登入櫃檯後台（輸入櫃檯密碼）。</li>
            <li>
              按右上角 🔔 <b>提示音開關</b>打開它，新單進來才會「嗶」。
            </li>
          </ul>
          <p style={{ fontWeight: 700, margin: '12px 0 4px' }}>有客人結帳時</p>
          <Steps
            items={[
              ['新單自動跳出、響鈴、卡片閃橘框', '標示內用桌號，或外帶取餐姓名。'],
              ['向客人收款', '現金或刷卡。'],
              ['按「結帳並出單」', '轉為「已結帳」並出單給廚房製作。'],
            ]}
          />
          <p style={{ fontWeight: 700, margin: '12px 0 4px' }}>點錯 / 取消</p>
          <ul className="help-ul">
            <li>還沒結帳的單按「作廢」取消（不算營業額）。</li>
            <li>誤作廢或客人回來，到「作廢」分頁按「還原」救回。</li>
          </ul>
          <Callout warn>
            <b>未結帳的單超過 10 分鐘會自動作廢</b>
            （先結帳制，點了沒來付視為棄單）。還原過的單則不會再自動消失。
          </Callout>
        </Section>

        <Section title="03 · 收班（店長專區）" note="需要老闆 PIN">
          <Steps
            items={[
              ['開收班頁，輸入老闆 PIN', '員工沒 PIN 就看不到營業額。'],
              ['核對今日數字', '營業額、單數、內用/外帶、平均客單、作廢數。'],
              ['打烊按「收班並記錄」', '這一天封帳、存成日結紀錄。'],
              ['需要時按「列印日結單」', '留存備查。'],
            ]}
          />
          <Callout>
            系統以<b>台灣時間 00:00 換日</b>。今天只顯示今天的單，明天自動全新，舊資料都留在紀錄。
          </Callout>
        </Section>

        <Section title="04 · 改菜單 · 改價 · 賣完" note="改完即時生效">
          <ul className="help-ul">
            <li>
              <b>改價</b>：點價格欄改數字，離開欄位就存檔。
            </li>
            <li>
              <b>賣完/停售</b>：按「停售」，客人端立刻看不到；補貨按「開賣」。
            </li>
            <li>
              <b>新增菜色</b>：分類底下輸入名稱＋價格，按「＋ 品項」。
            </li>
          </ul>
          <Callout>
            已被點過的品項<b>不能刪除</b>（會影響歷史帳單），請改用<b>停售</b>。
          </Callout>
        </Section>

        <Section title="05 · 桌號與 QR">
          <ul className="help-ul">
            <li>
              <b>印 QR 貼桌</b>：桌號頁按「列印全部 QR」，排好每桌＋外帶，列印剪下貼桌。
            </li>
            <li>
              <b>新增/刪除桌</b>：按「＋ 新增桌」自動編號。
            </li>
            <li>
              <b>換 QR</b>：某桌想換碼，按「換 QR」重產，舊碼立即失效。
            </li>
          </ul>
        </Section>

        <Section title="06 · 設定：密碼與出單機" note="右上「設定」">
          <ul className="help-ul">
            <li>
              <b>換櫃檯密碼 / 老闆 PIN</b>：在設定頁直接改，改完即時生效。
            </li>
            <li>
              <b>出單機</b>：選「瀏覽器列印」或「雲端出單機」；買了 Star
              CloudPRNT 機器就選雲端，把設定頁顯示的網址填進印表機即可自動出單。
            </li>
          </ul>
        </Section>

        <Section title="常見問題">
          <Qa
            q="新訂單沒聲音？"
            a="按一次右上角 🔔 開關。每次重新整理頁面後要再開一次（瀏覽器限制）。"
          />
          <Qa
            q="單子不見了？"
            a="確認在「待結帳」分頁。超過 10 分鐘沒結會跑到「作廢」，在那按「還原」救回。"
          />
          <Qa
            q="客人掃了打不開？"
            a="確認手機有網路。整桌都不行可能 QR 損壞，用桌號頁「換 QR」重印。"
          />
          <Qa
            q="看不到營業額？"
            a="營業額在「收班」頁、需要老闆 PIN。這是刻意設計，員工端看不到彙總金額。"
          />
        </Section>

        <div style={{ height: 30 }} />
      </div>

      <style>{`
        .help-ul { margin: 0; padding-left: 20px; }
        .help-ul li { margin: 5px 0; font-size: 14.5px; }
      `}</style>
    </>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <h3 style={{ margin: '0 0 6px' }}>{title}</h3>
        {note && <span style={{ color: '#aaa', fontSize: 12 }}>{note}</span>}
      </div>
      <div className="card">{children}</div>
    </section>
  );
}

function Steps({ items }: { items: [string, string][] }) {
  return (
    <ol style={{ margin: 0, paddingLeft: 22 }}>
      {items.map(([t, h], i) => (
        <li key={i} style={{ margin: '7px 0' }}>
          <b style={{ fontSize: 14.5 }}>{t}</b>
          {h && (
            <div style={{ color: '#888', fontSize: 13 }}>{h}</div>
          )}
        </li>
      ))}
    </ol>
  );
}

function Callout({
  children,
  warn,
}: {
  children: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: '10px 12px',
        borderRadius: 10,
        fontSize: 14,
        background: warn ? '#fbf1d8' : '#fff3e0',
        border: `1px solid ${warn ? '#e6cf8f' : '#f6d9ac'}`,
      }}
    >
      {warn ? '⏱️ ' : '💡 '}
      {children}
    </div>
  );
}

function Qa({ q, a }: { q: string; a: string }) {
  return (
    <div style={{ padding: '10px 0', borderTop: '1px solid var(--border, #eee)' }}>
      <div style={{ fontWeight: 700 }}>{q}</div>
      <div style={{ color: '#888', fontSize: 14 }}>{a}</div>
    </div>
  );
}
