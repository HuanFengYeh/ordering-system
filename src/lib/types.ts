export type Variant = {
  id: number;
  label: string;
  price: number;
};

export type ModifierOption = {
  id: number;
  label: string;
  priceDelta: number;
};

export type ModifierGroup = {
  id: number;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
};

export type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  variants: Variant[];
  modifierGroups: ModifierGroup[];
};

export type Category = {
  id: number;
  name: string;
  note: string | null;
  items: MenuItem[];
};

export type OrderItemModifier = {
  id: number;
  groupName: string;
  label: string;
  priceDelta: number;
};

export type OrderItem = {
  id: number;
  itemName: string;
  variantLabel: string;
  price: number;
  quantity: number;
  note: string | null;
  modifiers: OrderItemModifier[];
};

export type Order = {
  id: number;
  status: string;
  orderType: string;
  pickupName: string | null;
  total: number;
  createdAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  table: { number: number } | null;
  items: OrderItem[];
};

export type DaySummary = {
  businessDate: string;
  totalRevenue: number;
  orderCount: number;
  dineInRevenue: number;
  dineInCount: number;
  takeoutRevenue: number;
  takeoutCount: number;
  cancelledCount: number;
  unpaidCount: number;
  avgTicket: number;
};
