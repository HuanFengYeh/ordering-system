// 全站共用設定
export const RESTAURANT_NAME = '桔子';
export const RESTAURANT_SUBTITLE = '生活飲食';

// 訂單狀態
export const ORDER_STATUS = {
  SUBMITTED: 'SUBMITTED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;

export const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: '待結帳',
  PAID: '已結帳',
  CANCELLED: '已取消',
};

// 用餐方式
export const ORDER_TYPE = {
  DINE_IN: 'DINE_IN',
  TAKEOUT: 'TAKEOUT',
} as const;

export const ORDER_TYPE_LABEL: Record<string, string> = {
  DINE_IN: '內用',
  TAKEOUT: '外帶',
};
