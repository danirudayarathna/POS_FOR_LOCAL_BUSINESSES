export type Category = "espresso" | "brew" | "bakery" | "retail";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: Category;
  price: number;
  cost: number;
  stock: number;
  available: boolean;
  popularity: number;
}

export type PayMethod = "card" | "cash" | "mobile";
export type TxnStatus = "completed" | "refunded";

export type UserRole = "admin" | "manager" | "cashier" | "barista";

export interface User {
  id: string;
  name: string;
  email: string;
  pin: string; // 4-digit PIN
  role: UserRole;
  shift: string;
  avatarColor?: string;
  active: boolean;
  createdAt: number;
}

export interface TxnLine {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Txn {
  id: string;
  number: number;
  time: number;
  lines: TxnLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  method: PayMethod;
  status: TxnStatus;
  tendered?: number;
  change?: number;
  cashierId?: string;
  cashierName?: string;
}

export interface CartLine {
  productId: string;
  qty: number;
}

export type View = "register" | "dashboard" | "transactions" | "products" | "staff";

export const CATEGORY_LABEL: Record<Category, string> = {
  espresso: "Espresso",
  brew: "Brew & Tea",
  bakery: "Bakery",
  retail: "Retail",
};

export const CATEGORY_HUE: Record<Category, number> = {
  espresso: 24,
  brew: 152,
  bakery: 42,
  retail: 208,
};

export const METHOD_LABEL: Record<PayMethod, string> = {
  card: "Card",
  cash: "Cash",
  mobile: "Mobile",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrator",
  manager: "Shift Manager",
  cashier: "Cashier",
  barista: "Barista",
};

export const ROLE_BADGE_STYLE: Record<UserRole, { bg: string; text: string; dot: string }> = {
  admin: { bg: "bg-danger-100", text: "text-danger-600", dot: "bg-danger-500" },
  manager: { bg: "bg-pine-100", text: "text-pine-700", dot: "bg-pine-600" },
  cashier: { bg: "bg-moss-100", text: "text-moss-600", dot: "bg-moss-500" },
  barista: { bg: "bg-marigold-100", text: "text-marigold-600", dot: "bg-marigold-500" },
};

export const TAX_RATE = 0.085;

