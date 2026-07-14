'use client';

import { useEffect } from 'react';

// 開啟收據頁時自動叫出列印對話框；並提供手動列印按鈕。
export default function PrintTrigger() {
  useEffect(() => {
    // 稍等版面渲染完再列印
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      className="btn-primary print-btn no-print"
      onClick={() => window.print()}
    >
      列印
    </button>
  );
}
