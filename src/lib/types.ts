export type Variant = {
  id: number;
  label: string;
  price: number;
};

export type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  variants: Variant[];
};

export type Category = {
  id: number;
  name: string;
  note: string | null;
  items: MenuItem[];
};

export type OrderItem = {
  id: number;
  itemName: string;
  variantLabel: string;
  price: number;
  quantity: number;
  note: string | null;
};

export type Order = {
  id: number;
  status: string;
  orderType: string;
  pickupName: string | null;
  total: number;
  createdAt: string;
  paidAt: string | null;
  table: { number: number } | null;
  items: OrderItem[];
};
