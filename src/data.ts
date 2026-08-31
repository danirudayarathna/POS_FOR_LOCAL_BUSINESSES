import type { Product, Txn, TxnLine, PayMethod, User } from "./types";
import { TAX_RATE } from "./types";

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const fmtMoney = (n: number, cents = true) =>
  `Rs. ${n.toLocaleString("en-LK", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 2,
  })}`;

export const fmtMoney0 = (n: number) =>
  `Rs. ${n.toLocaleString("en-LK", {
    maximumFractionDigits: 0,
  })}`;

export const fmtDay = (ts: number) =>
  new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const fmtDayFull = (ts: number) =>
  new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export const fmtClockShort = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export const dayStart = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const DAY = 86_400_000;

export const BASE_USERS: User[] = [
  {
    id: "u-kasun",
    name: "Kasun Perera",
    email: "kasun@emberandoat.lk",
    pin: "1234",
    role: "manager",
    shift: "Shift 2 · Midday & Close",
    avatarColor: "#1d4530",
    active: true,
    createdAt: 1704067200000,
  },
  {
    id: "u-nuwan",
    name: "Nuwan Silva",
    email: "nuwan@emberandoat.lk",
    pin: "2468",
    role: "barista",
    shift: "Shift 1 · Morning Rush",
    avatarColor: "#f0a32b",
    active: true,
    createdAt: 1705363200000,
  },
  {
    id: "u-dilshan",
    name: "Dilshan Jayawardena",
    email: "dilshan@emberandoat.lk",
    pin: "9999",
    role: "admin",
    shift: "Store Owner · All Shifts",
    avatarColor: "#cd4f38",
    active: true,
    createdAt: 1701388800000,
  },
  {
    id: "u-tharushi",
    name: "Tharushi Fernando",
    email: "tharushi@emberandoat.lk",
    pin: "5555",
    role: "cashier",
    shift: "Shift 2 · Afternoon",
    avatarColor: "#2e9e62",
    active: true,
    createdAt: 1706745600000,
  },
];

/* deterministic PRNG so the demo history is stable between reloads */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const BASE_PRODUCTS: Product[] = [
  { id: "p01", sku: "ESP-01", name: "Espresso", category: "espresso", price: 650, cost: 95, stock: 120, available: true, popularity: 8 },
  { id: "p02", sku: "ESP-02", name: "Cortado", category: "espresso", price: 850, cost: 130, stock: 96, available: true, popularity: 6 },
  { id: "p03", sku: "ESP-03", name: "Flat White", category: "espresso", price: 950, cost: 150, stock: 110, available: true, popularity: 9 },
  { id: "p04", sku: "ESP-04", name: "Caramel Latte", category: "espresso", price: 1150, cost: 180, stock: 88, available: true, popularity: 10 },
  { id: "p05", sku: "ESP-05", name: "Mocha", category: "espresso", price: 1250, cost: 210, stock: 74, available: true, popularity: 7 },
  { id: "p06", sku: "BRW-01", name: "Batch Brew", category: "brew", price: 750, cost: 90, stock: 140, available: true, popularity: 8 },
  { id: "p07", sku: "BRW-02", name: "Pour Over", category: "brew", price: 1100, cost: 160, stock: 60, available: true, popularity: 5 },
  { id: "p08", sku: "BRW-03", name: "Cold Brew", category: "brew", price: 950, cost: 125, stock: 82, available: true, popularity: 7 },
  { id: "p09", sku: "BRW-04", name: "Iced Matcha", category: "brew", price: 1350, cost: 260, stock: 6, available: true, popularity: 6 },
  { id: "p10", sku: "BRW-05", name: "Chai Latte", category: "brew", price: 1050, cost: 190, stock: 66, available: true, popularity: 5 },
  { id: "p11", sku: "BKY-01", name: "Butter Croissant", category: "bakery", price: 750, cost: 200, stock: 26, available: true, popularity: 9 },
  { id: "p12", sku: "BKY-02", name: "Almond Croissant", category: "bakery", price: 950, cost: 270, stock: 4, available: true, popularity: 8 },
  { id: "p13", sku: "BKY-03", name: "Cardamom Bun", category: "bakery", price: 850, cost: 220, stock: 7, available: true, popularity: 7 },
  { id: "p14", sku: "BKY-04", name: "Banana Bread", category: "bakery", price: 650, cost: 140, stock: 18, available: true, popularity: 5 },
  { id: "p15", sku: "BKY-05", name: "Ham & Cheese Toastie", category: "bakery", price: 1450, cost: 450, stock: 14, available: true, popularity: 6 },
  { id: "p16", sku: "RTL-01", name: "Ceylon Estate Beans · 250g", category: "retail", price: 3600, cost: 1600, stock: 22, available: true, popularity: 4 },
  { id: "p17", sku: "RTL-02", name: "Single Origin Nuwara Eliya · 250g", category: "retail", price: 4200, cost: 2100, stock: 5, available: true, popularity: 3 },
  { id: "p18", sku: "RTL-03", name: "Drip Bags · Box of 10", category: "retail", price: 2800, cost: 1150, stock: 17, available: true, popularity: 3 },
  { id: "p19", sku: "RTL-04", name: "Ember Ceramic Mug", category: "retail", price: 3500, cost: 1300, stock: 11, available: true, popularity: 2 },
  { id: "p20", sku: "RTL-05", name: "Canvas Tote", category: "retail", price: 4500, cost: 1600, stock: 9, available: true, popularity: 2 },
];

const HOUR_WEIGHTS: [number, number][] = [
  [7, 5], [8, 10], [9, 8], [10, 5], [11, 6], [12, 9],
  [13, 6], [14, 4], [15, 4], [16, 3], [17, 3], [18, 2],
];

function pickHour(rnd: () => number): number {
  const total = HOUR_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [h, w] of HOUR_WEIGHTS) {
    r -= w;
    if (r <= 0) return h;
  }
  return 12;
}

function weightedPick(products: Product[], rnd: () => number): Product {
  const total = products.reduce((s, p) => s + p.popularity, 0);
  let r = rnd() * total;
  for (const p of products) {
    r -= p.popularity;
    if (r <= 0) return p;
  }
  return products[products.length - 1];
}

/** ~8 weeks of deterministic order history, newest first. */
export function generateTransactions(products: Product[]): Txn[] {
  const rnd = mulberry32(20260214);
  const txns: Txn[] = [];
  const now = Date.now();
  let num = 1041;
  const DAYS_BACK = 56;

  for (let d = DAYS_BACK - 1; d >= 0; d--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - d);
    const dow = day.getDay();
    const base = dow === 0 || dow === 6 ? 30 : 22;
    const count = Math.max(8, Math.round(base + (rnd() - 0.5) * 12));

    for (let i = 0; i < count; i++) {
      const t = new Date(day);
      t.setHours(pickHour(rnd), Math.floor(rnd() * 60), Math.floor(rnd() * 60), 0);
      if (t.getTime() > now) continue;

      const lineCount = 1 + Math.floor(rnd() * rnd() * 4);
      const used = new Set<string>();
      const lines: TxnLine[] = [];
      for (let k = 0; k < lineCount; k++) {
        const p = weightedPick(products, rnd);
        if (used.has(p.id)) continue;
        used.add(p.id);
        lines.push({ productId: p.id, name: p.name, price: p.price, qty: rnd() < 0.22 ? 2 : 1 });
      }
      if (lines.length === 0) continue;

      const subtotal = round2(lines.reduce((s, l) => s + l.price * l.qty, 0));
      const tax = round2(subtotal * TAX_RATE);
      const total = round2(subtotal + tax);
      const mr = rnd();
      const method: PayMethod = mr < 0.55 ? "card" : mr < 0.83 ? "cash" : "mobile";

      txns.push({
        id: `EO-${num}`,
        number: num,
        time: t.getTime(),
        lines,
        subtotal,
        discount: 0,
        tax,
        total,
        method,
        status: rnd() < 0.02 ? "refunded" : "completed",
      });
      num++;
    }
  }
  return txns.sort((a, b) => b.time - a.time);
}

/* ---------------- analytics helpers ---------------- */

export interface Summary {
  revenue: number;
  orders: number;
  items: number;
  aov: number;
  refunds: number;
}

export function summarize(list: Txn[]): Summary {
  const done = list.filter((t) => t.status === "completed");
  const revenue = round2(done.reduce((s, t) => s + t.total, 0));
  const items = done.reduce((s, t) => s + t.lines.reduce((a, l) => a + l.qty, 0), 0);
  return {
    revenue,
    orders: done.length,
    items,
    aov: done.length ? revenue / done.length : 0,
    refunds: list.length - done.length,
  };
}

export interface Bucket {
  label: string;
  value: number;
  orders: number;
}

export function bucketByDay(list: Txn[], days: number): Bucket[] {
  const out: Bucket[] = [];
  const today = dayStart(Date.now());
  const done = list.filter((t) => t.status === "completed");
  for (let i = days - 1; i >= 0; i--) {
    const from = today - i * DAY;
    const to = from + DAY;
    const dayTx = done.filter((t) => t.time >= from && t.time < to);
    const d = new Date(from);
    const label =
      days <= 7
        ? i === 0
          ? "Today"
          : d.toLocaleDateString("en-US", { weekday: "short" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    out.push({
      label,
      value: round2(dayTx.reduce((s, t) => s + t.total, 0)),
      orders: dayTx.length,
    });
  }
  return out;
}

export function bucketByHour(list: Txn[], fromHour = 6, toHour = 21): Bucket[] {
  const out: Bucket[] = [];
  const done = list.filter((t) => t.status === "completed");
  for (let h = fromHour; h <= toHour; h++) {
    const hourTx = done.filter((t) => new Date(t.time).getHours() === h);
    out.push({
      label: `${((h + 11) % 12) + 1}${h < 12 ? "a" : "p"}`,
      value: round2(hourTx.reduce((s, t) => s + t.total, 0)),
      orders: hourTx.length,
    });
  }
  return out;
}

export interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

export function topProducts(list: Txn[], n: number): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const t of list) {
    if (t.status !== "completed") continue;
    for (const l of t.lines) {
      const cur = map.get(l.name) ?? { name: l.name, qty: 0, revenue: 0 };
      cur.qty += l.qty;
      cur.revenue = round2(cur.revenue + l.price * l.qty);
      map.set(l.name, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, n);
}

export function methodMix(list: Txn[]): { card: number; cash: number; mobile: number } {
  const out = { card: 0, cash: 0, mobile: 0 };
  for (const t of list) {
    if (t.status !== "completed") continue;
    out[t.method] = round2(out[t.method] + t.total);
  }
  return out;
}

export function niceMax(v: number): number {
  if (v <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (m * pow >= v) return m * pow;
  }
  return 10 * pow;
}
