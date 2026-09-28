export type Order = {
  id: string;
  address: string;
  phone: string;
  paid: boolean;
  amount: number;
  note: string;
  delivered: boolean;
  deferred: boolean;
  createdAt: number;
  seq: number;
};

export type Driver = {
  phone: string;
  name: string;
  pin: string;
  createdAt: number;
  ordersTotal: number;
  proUntil: number | null;
};

export const ADMIN_PHONE = "+77014511661";
export const FREE_LIMIT = 20;
export const PRO_PRICE = 1500;
