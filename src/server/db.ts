import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import type { Product, User, Txn, CartLine, PayMethod, UserRole, Category, TxnStatus } from "../types";
import { BASE_PRODUCTS, BASE_USERS } from "../data";

const DB_FILE = path.resolve(process.cwd(), "pos.db");

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const db = new DatabaseSync(DB_FILE);

  // Enable WAL mode and foreign keys for high concurrency & performance
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL,
      role TEXT NOT NULL,
      shift TEXT NOT NULL,
      avatar_color TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      available INTEGER NOT NULL DEFAULT 1,
      popularity INTEGER NOT NULL DEFAULT 3,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS discounts (
      code TEXT PRIMARY KEY,
      pct REAL NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      number INTEGER NOT NULL,
      time INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      discount_amt REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      method TEXT NOT NULL,
      tendered REAL,
      change REAL,
      status TEXT NOT NULL DEFAULT 'completed',
      cashier_id TEXT,
      cashier_name TEXT,
      discount_code TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      qty INTEGER NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );
  `);

  // Seed default discounts if missing
  const countDiscounts = db.prepare("SELECT COUNT(*) as count FROM discounts").get() as { count: number };
  if (countDiscounts.count === 0) {
    const insertDisc = db.prepare("INSERT INTO discounts (code, pct, active) VALUES (?, ?, ?)");
    insertDisc.run("EMBER10", 10, 1);
    insertDisc.run("OATCLUB", 15, 1);
    insertDisc.run("VIP20", 20, 1);
  }

  // Seed default users if missing
  const countUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (countUsers.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, pin, role, shift, avatar_color, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of BASE_USERS) {
      insertUser.run(
        u.id,
        u.name,
        u.email,
        u.pin,
        u.role,
        u.shift,
        u.avatarColor ?? null,
        u.active ? 1 : 0,
        Date.now(),
      );
    }
  }

  // Seed default products if missing
  const countProducts = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
  if (countProducts.count === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (id, sku, name, category, price, cost, stock, available, popularity, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of BASE_PRODUCTS) {
      insertProd.run(
        p.id,
        p.sku,
        p.name,
        p.category,
        p.price,
        p.cost,
        p.stock,
        p.available ? 1 : 0,
        p.popularity,
        Date.now(),
      );
    }
  }

  dbInstance = db;
  return db;
}

/* ================= Products DAO ================= */

export function getProducts(): Product[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM products ORDER BY category ASC, name ASC").all() as any[];
  return rows.map((r) => ({
    id: r.id,
    sku: r.sku,
    name: r.name,
    category: r.category as Category,
    price: Number(r.price),
    cost: Number(r.cost),
    stock: Number(r.stock),
    available: Boolean(r.available),
    popularity: Number(r.popularity),
  }));
}

export function upsertProduct(p: Product): Product {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO products (id, sku, name, category, price, cost, stock, available, popularity, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      sku = excluded.sku,
      name = excluded.name,
      category = excluded.category,
      price = excluded.price,
      cost = excluded.cost,
      stock = excluded.stock,
      available = excluded.available,
      popularity = excluded.popularity,
      updated_at = excluded.updated_at
  `);
  stmt.run(
    p.id,
    p.sku,
    p.name,
    p.category,
    p.price,
    p.cost,
    p.stock,
    p.available ? 1 : 0,
    p.popularity,
    Date.now(),
  );
  return p;
}

export function updateStock(id: string, stock: number): boolean {
  const db = getDb();
  const res = db.prepare("UPDATE products SET stock = ?, updated_at = ? WHERE id = ?").run(
    Math.max(0, stock),
    Date.now(),
    id,
  );
  return res.changes > 0;
}

export function toggleAvailable(id: string): boolean {
  const db = getDb();
  const res = db.prepare("UPDATE products SET available = CASE WHEN available = 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?").run(
    Date.now(),
    id,
  );
  return res.changes > 0;
}

export function deleteProduct(id: string): boolean {
  const db = getDb();
  const res = db.prepare("DELETE FROM products WHERE id = ?").run(id);
  return res.changes > 0;
}

/* ================= Users DAO ================= */

export function getUsers(): User[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM users ORDER BY created_at ASC").all() as any[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    pin: r.pin,
    role: r.role as UserRole,
    shift: r.shift,
    avatarColor: r.avatar_color ?? undefined,
    active: Boolean(r.active),
    createdAt: Number(r.created_at || Date.now()),
  }));
}

export function createUser(u: User): User {
  const db = getDb();
  db.prepare(`
    INSERT INTO users (id, name, email, pin, role, shift, avatar_color, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    u.id,
    u.name,
    u.email,
    u.pin,
    u.role,
    u.shift,
    u.avatarColor ?? null,
    u.active ? 1 : 0,
    u.createdAt || Date.now(),
  );
  return u;
}

export function updateUser(u: User): User {
  const db = getDb();
  db.prepare(`
    UPDATE users SET
      name = ?,
      email = ?,
      pin = ?,
      role = ?,
      shift = ?,
      avatar_color = ?,
      active = ?
    WHERE id = ?
  `).run(
    u.name,
    u.email,
    u.pin,
    u.role,
    u.shift,
    u.avatarColor ?? null,
    u.active ? 1 : 0,
    u.id,
  );
  return u;
}

export function deleteUser(id: string): boolean {
  const db = getDb();
  const res = db.prepare("DELETE FROM users WHERE id = ?").run(id);
  return res.changes > 0;
}

/* ================= Transactions DAO ================= */

export function getTransactions(): Txn[] {
  const db = getDb();
  const txRows = db.prepare("SELECT * FROM transactions ORDER BY time DESC").all() as any[];
  const itemRows = db.prepare("SELECT * FROM transaction_items").all() as any[];

  const itemsByTx: Record<string, { productId: string; name: string; price: number; qty: number }[]> = {};
  for (const it of itemRows) {
    if (!itemsByTx[it.transaction_id]) itemsByTx[it.transaction_id] = [];
    itemsByTx[it.transaction_id].push({
      productId: it.product_id,
      name: it.product_name,
      price: Number(it.unit_price),
      qty: Number(it.qty),
    });
  }

  return txRows.map((t) => ({
    id: t.id,
    number: Number(t.number),
    time: Number(t.time),
    subtotal: Number(t.subtotal),
    discount: Number(t.discount_amt || 0),
    tax: Number(t.tax),
    total: Number(t.total),
    method: t.method as PayMethod,
    tendered: t.tendered !== null ? Number(t.tendered) : undefined,
    change: t.change !== null ? Number(t.change) : undefined,
    status: t.status as TxnStatus,
    lines: itemsByTx[t.id] ?? [],
    cashierName: t.cashier_name ?? undefined,
  }));
}

export function createTransaction(data: {
  lines: { productId: string; name: string; price: number; qty: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  method: PayMethod;
  tendered?: number;
  change?: number;
  cashierName?: string;
  discountCode?: string;
}): Txn {
  const db = getDb();

  const maxNum = (db.prepare("SELECT MAX(number) as maxNum FROM transactions").get() as any)?.maxNum || 1000;
  const nextNum = maxNum + 1;
  const txId = `TX-${nextNum}`;
  const now = Date.now();

  // Insert Transaction
  db.prepare(`
    INSERT INTO transactions (
      id, number, time, subtotal, discount_amt, tax, total, method, tendered, change, status, cashier_name, discount_code, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)
  `).run(
    txId,
    nextNum,
    now,
    data.subtotal,
    data.discount,
    data.tax,
    data.total,
    data.method,
    data.tendered ?? null,
    data.change ?? null,
    data.cashierName ?? "Kasun Perera",
    data.discountCode ?? null,
    now,
  );

  // Insert items and atomically decrement product stock
  const insertItem = db.prepare(`
    INSERT INTO transaction_items (id, transaction_id, product_id, product_name, unit_price, qty, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const decStock = db.prepare(`
    UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?
  `);

  for (let idx = 0; idx < data.lines.length; idx++) {
    const l = data.lines[idx];
    const itemId = `${txId}-i${idx + 1}`;
    insertItem.run(
      itemId,
      txId,
      l.productId,
      l.name,
      l.price,
      l.qty,
      l.price * l.qty,
    );
    decStock.run(l.qty, l.productId);
  }

  return {
    id: txId,
    number: nextNum,
    time: now,
    subtotal: data.subtotal,
    discount: data.discount,
    tax: data.tax,
    total: data.total,
    method: data.method,
    tendered: data.tendered,
    change: data.change,
    status: "completed",
    lines: data.lines,
    cashierName: data.cashierName,
  };
}

export function refundTransaction(id: string): Txn | null {
  const db = getDb();
  const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id) as any;
  if (!tx) return null;

  // Mark refunded
  db.prepare("UPDATE transactions SET status = 'refunded' WHERE id = ?").run(id);

  // Restore inventory stock for refunded items
  const items = db.prepare("SELECT * FROM transaction_items WHERE transaction_id = ?").all(id) as any[];
  const incStock = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
  for (const it of items) {
    incStock.run(Number(it.qty), it.product_id);
  }

  return {
    id: tx.id,
    number: Number(tx.number),
    time: Number(tx.time),
    subtotal: Number(tx.subtotal),
    discount: Number(tx.discount_amt || 0),
    tax: Number(tx.tax),
    total: Number(tx.total),
    method: tx.method as PayMethod,
    tendered: tx.tendered !== null ? Number(tx.tendered) : undefined,
    change: tx.change !== null ? Number(tx.change) : undefined,
    status: "refunded",
    lines: items.map((it) => ({
      productId: it.product_id,
      name: it.product_name,
      price: Number(it.unit_price),
      qty: Number(it.qty),
    })),
    cashierName: tx.cashier_name ?? undefined,
  };
}
