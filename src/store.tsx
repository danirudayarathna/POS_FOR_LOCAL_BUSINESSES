import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartLine, PayMethod, Product, Txn, User } from "./types";
import { TAX_RATE } from "./types";
import { BASE_PRODUCTS, BASE_USERS, generateTransactions, round2 } from "./data";
import { api } from "./api";

export type ToastKind = "success" | "info" | "warn" | "danger";
export interface Toast {
  id: number;
  kind: ToastKind;
  msg: string;
}

export interface Discount {
  code: string;
  pct: number;
}

export const DISCOUNT_CODES: Record<string, number> = {
  EMBER10: 10,
  OATCLUB: 15,
};

export interface CartDetail {
  lines: { product: Product; qty: number }[];
  subtotal: number;
  discountAmt: number;
  tax: number;
  total: number;
  count: number;
}

interface StoreShape {
  // auth & user state
  users: User[];
  currentUser: User | null;
  isLocked: boolean;
  isDbConnected: boolean;
  loginWithPin: (userId: string, pin: string) => boolean;
  loginWithEmail: (email: string, pinOrPass: string) => boolean;
  registerUser: (userData: Omit<User, "id" | "createdAt">) => User;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  lockTerminal: () => void;
  unlockTerminal: (pin: string) => boolean;
  logout: () => void;
  verifyManagerPin: (pin: string) => boolean;

  // catalog
  products: Product[];
  upsertProduct: (p: Product) => void;
  setStock: (id: string, stock: number) => void;
  toggleAvailable: (id: string) => void;
  deleteProduct: (id: string) => void;

  // cart
  cart: CartLine[];
  cartDetail: CartDetail;
  addToCart: (id: string) => void;
  changeQty: (id: string, delta: number) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;

  // discount
  discount: Discount | null;
  applyDiscount: (code: string) => boolean;
  clearDiscount: () => void;

  // transactions
  transactions: Txn[];
  nextNumber: number;
  completeSale: (method: PayMethod, tendered?: number) => Txn;
  refund: (id: string) => void;

  // toasts
  toasts: Toast[];
  notify: (kind: ToastKind, msg: string) => void;
  dismissToast: (id: number) => void;
}

const StoreCtx = createContext<StoreShape | null>(null);

const P_KEY = "emberoat.products.v2";
const C_KEY = "emberoat.cart.v2";
const D_KEY = "emberoat.discount.v2";
const U_KEY = "emberoat.users.v2";
const AUTH_KEY = "emberoat.auth.v2";
const LOCK_KEY = "emberoat.locked.v2";

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(P_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Product[];
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].price !== undefined) {
        return parsed;
      }
    }
  } catch {
    /* fall through to baseline */
  }
  return BASE_PRODUCTS;
}

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(U_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as User[];
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].pin !== undefined) {
        return parsed;
      }
    }
  } catch {
    /* fall through */
  }
  return BASE_USERS;
}

function loadCurrentUser(users: User[]): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const userId = JSON.parse(raw) as string;
      const found = users.find((u) => u.id === userId && u.active);
      if (found) return found;
    }
  } catch {
    /* fall through */
  }
  return users[0] ?? null;
}

function loadIsLocked(): boolean {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (raw !== null) {
      return JSON.parse(raw) === true;
    }
  } catch {
    /* fall through */
  }
  return false;
}

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(C_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartLine[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function loadDiscount(): Discount | null {
  try {
    const raw = localStorage.getItem(D_KEY);
    if (raw) return JSON.parse(raw) as Discount;
  } catch {
    /* ignore */
  }
  return null;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadCurrentUser(loadUsers()));
  const [isLocked, setIsLocked] = useState<boolean>(loadIsLocked);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [cart, setCart] = useState<CartLine[]>(loadCart);
  const [discount, setDiscount] = useState<Discount | null>(loadDiscount);
  const [transactions, setTransactions] = useState<Txn[]>(() => generateTransactions(BASE_PRODUCTS));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(1);

  // Load from SQLite database on startup
  useEffect(() => {
    let active = true;
    api
      .getBootstrap()
      .then((data) => {
        if (!active) return;
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        }
        if (data.users && data.users.length > 0) {
          setUsers(data.users);
          setCurrentUser((curr) => {
            if (curr) {
              const matched = data.users.find((u) => u.id === curr.id && u.active);
              if (matched) return matched;
            }
            return data.users[0] ?? null;
          });
        }
        if (data.transactions && data.transactions.length > 0) {
          setTransactions(data.transactions);
        }
        setIsDbConnected(true);
      })
      .catch((err) => {
        console.warn("Using offline storage fallback:", err.message);
        setIsDbConnected(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // persistence effects
  useEffect(() => {
    localStorage.setItem(U_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser.id));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(LOCK_KEY, JSON.stringify(isLocked));
  }, [isLocked]);

  useEffect(() => {
    localStorage.setItem(P_KEY, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(C_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (discount) localStorage.setItem(D_KEY, JSON.stringify(discount));
    else localStorage.removeItem(D_KEY);
  }, [discount]);

  const notify = useCallback((kind: ToastKind, msg: string) => {
    const id = toastId.current++;
    setToasts((t) => [...t.slice(-3), { id, kind, msg }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  /* ------- auth & staff management ------- */

  const loginWithPin = useCallback(
    (userId: string, pin: string): boolean => {
      const user = users.find((u) => u.id === userId && u.active);
      if (!user) {
        notify("danger", "User not found or account is deactivated.");
        return false;
      }
      if (user.pin === pin.trim()) {
        setCurrentUser(user);
        setIsLocked(false);
        notify("success", `Welcome back, ${user.name}!`);
        return true;
      }
      notify("danger", "Invalid PIN. Please try again.");
      return false;
    },
    [users, notify],
  );

  const loginWithEmail = useCallback(
    (email: string, pinOrPass: string): boolean => {
      const trimmedEmail = email.trim().toLowerCase();
      const user = users.find((u) => u.email.toLowerCase() === trimmedEmail && u.active);
      if (!user) {
        notify("danger", "No active staff member found with this email.");
        return false;
      }
      if (user.pin === pinOrPass.trim()) {
        setCurrentUser(user);
        setIsLocked(false);
        notify("success", `Welcome back, ${user.name}!`);
        return true;
      }
      notify("danger", "Invalid PIN/Password. Please check credentials.");
      return false;
    },
    [users, notify],
  );

  const registerUser = useCallback(
    (userData: Omit<User, "id" | "createdAt">): User => {
      const newUser: User = {
        ...userData,
        id: `u-${Date.now().toString(36)}`,
        createdAt: Date.now(),
      };
      setUsers((prev) => [...prev, newUser]);
      api.createUser(newUser).catch((err) => console.warn("Failed to sync new user to DB:", err.message));
      notify("success", `Staff member ${newUser.name} added to terminal.`);
      return newUser;
    },
    [notify],
  );

  const updateUser = useCallback(
    (updated: User) => {
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      if (currentUser?.id === updated.id) {
        setCurrentUser(updated);
      }
      api.updateUser(updated).catch((err) => console.warn("Failed to sync user update to DB:", err.message));
      notify("info", `Updated profile for ${updated.name}.`);
    },
    [currentUser, notify],
  );

  const deleteUser = useCallback(
    (id: string) => {
      const target = users.find((u) => u.id === id);
      if (!target) return;
      if (users.filter((u) => u.active).length <= 1) {
        notify("warn", "Cannot remove the only active staff member.");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (currentUser?.id === id) {
        const nextUser = users.find((u) => u.id !== id && u.active) ?? null;
        setCurrentUser(nextUser);
      }
      api.deleteUser(id).catch((err) => console.warn("Failed to delete user in DB:", err.message));
      notify("warn", `Staff member ${target.name} removed.`);
    },
    [users, currentUser, notify],
  );

  const lockTerminal = useCallback(() => {
    setIsLocked(true);
    notify("info", "Terminal locked.");
  }, [notify]);

  const unlockTerminal = useCallback(
    (pin: string): boolean => {
      if (!currentUser) {
        // Unlock with any active user PIN
        const match = users.find((u) => u.pin === pin.trim() && u.active);
        if (match) {
          setCurrentUser(match);
          setIsLocked(false);
          notify("success", `Terminal unlocked by ${match.name}.`);
          return true;
        }
      } else {
        // Unlock with current user or any manager/admin PIN
        const isCurrentMatch = currentUser.pin === pin.trim();
        const isManagerMatch = users.some(
          (u) => (u.role === "manager" || u.role === "admin") && u.pin === pin.trim() && u.active,
        );
        if (isCurrentMatch || isManagerMatch) {
          setIsLocked(false);
          notify("success", "Terminal unlocked.");
          return true;
        }
      }
      notify("danger", "Incorrect PIN.");
      return false;
    },
    [currentUser, users, notify],
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsLocked(true);
    notify("info", "Logged out of terminal.");
  }, [notify]);

  const verifyManagerPin = useCallback(
    (pin: string): boolean => {
      return users.some(
        (u) => (u.role === "manager" || u.role === "admin") && u.pin === pin.trim() && u.active,
      );
    },
    [users],
  );

  /* ------- catalog ------- */

  const upsertProduct = useCallback((p: Product) => {
    setProducts((ps) => {
      const i = ps.findIndex((x) => x.id === p.id);
      if (i === -1) return [...ps, p];
      const next = [...ps];
      next[i] = p;
      return next;
    });
    api.upsertProduct(p).catch((err) => console.warn("Failed to sync product to DB:", err.message));
  }, []);

  const setStock = useCallback((id: string, stock: number) => {
    const s = Math.max(0, stock);
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, stock: s } : p)));
    api.updateStock(id, s).catch((err) => console.warn("Failed to update stock in DB:", err.message));
  }, []);

  const toggleAvailable = useCallback((id: string) => {
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));
    api.toggleAvailable(id).catch((err) => console.warn("Failed to toggle availability in DB:", err.message));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((ps) => ps.filter((p) => p.id !== id));
    api.deleteProduct(id).catch((err) => console.warn("Failed to delete product in DB:", err.message));
  }, []);

  /* ------- cart ------- */

  const addToCart = useCallback(
    (id: string) => {
      const product = products.find((p) => p.id === id);
      if (!product) return;
      let capped = false;
      setCart((c) => {
        const line = c.find((l) => l.productId === id);
        if (line) {
          if (line.qty >= product.stock) {
            capped = true;
            return c;
          }
          return c.map((l) => (l.productId === id ? { ...l, qty: l.qty + 1 } : l));
        }
        if (product.stock <= 0) {
          capped = true;
          return c;
        }
        return [...c, { productId: id, qty: 1 }];
      });
      if (capped) notify("warn", `Only ${product.stock} of “${product.name}” left in stock`);
    },
    [products, notify],
  );

  const changeQty = useCallback(
    (id: string, delta: number) => {
      const product = products.find((p) => p.id === id);
      setCart((c) =>
        c.flatMap((l) => {
          if (l.productId !== id) return [l];
          const q = l.qty + delta;
          if (q <= 0) return [];
          if (product && q > product.stock) {
            notify("warn", `Only ${product.stock} of “${product.name}” in stock`);
            return [l];
          }
          return [{ ...l, qty: q }];
        }),
      );
    },
    [products, notify],
  );

  const removeLine = useCallback((id: string) => {
    setCart((c) => c.filter((l) => l.productId !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(null);
  }, []);

  const applyDiscount = useCallback((code: string) => {
    const pct = DISCOUNT_CODES[code.trim().toUpperCase()];
    if (!pct) return false;
    setDiscount({ code: code.trim().toUpperCase(), pct });
    return true;
  }, []);

  const clearDiscount = useCallback(() => setDiscount(null), []);

  const cartDetail = useMemo<CartDetail>(() => {
    const lines = cart
      .map((l) => ({ product: products.find((p) => p.id === l.productId), qty: l.qty }))
      .filter((x): x is { product: Product; qty: number } => !!x.product);
    const subtotal = round2(lines.reduce((s, l) => s + l.product.price * l.qty, 0));
    const discountAmt = discount ? round2((subtotal * discount.pct) / 100) : 0;
    const tax = round2((subtotal - discountAmt) * TAX_RATE);
    const total = round2(subtotal - discountAmt + tax);
    const count = lines.reduce((s, l) => s + l.qty, 0);
    return { lines, subtotal, discountAmt, tax, total, count };
  }, [cart, products, discount]);

  /* ------- transactions ------- */

  const nextNumber = useMemo(
    () => transactions.reduce((m, t) => Math.max(m, t.number), 1040) + 1,
    [transactions],
  );

  const completeSale = useCallback(
    (method: PayMethod, tendered?: number): Txn => {
      const d = cartDetail;
      const num = transactions.reduce((m, t) => Math.max(m, t.number), 1040) + 1;
      const txnLines = d.lines.map((l) => ({
        productId: l.product.id,
        name: l.product.name,
        price: l.product.price,
        qty: l.qty,
      }));

      const txn: Txn = {
        id: `TX-${num}`,
        number: num,
        time: Date.now(),
        lines: txnLines,
        subtotal: d.subtotal,
        discount: d.discountAmt,
        tax: d.tax,
        total: d.total,
        method,
        status: "completed",
        tendered: method === "cash" ? tendered : undefined,
        change: method === "cash" && tendered !== undefined ? round2(tendered - d.total) : undefined,
        cashierId: currentUser?.id,
        cashierName: currentUser?.name ?? "Kasun Perera",
      };

      // Optimistically update state
      setTransactions((t) => [txn, ...t]);
      setProducts((ps) =>
        ps.map((p) => {
          const line = d.lines.find((l) => l.product.id === p.id);
          return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
        }),
      );
      setCart([]);
      setDiscount(null);

      // Async write to SQLite database
      api
        .createTransaction({
          lines: txnLines,
          subtotal: d.subtotal,
          discount: d.discountAmt,
          tax: d.tax,
          total: d.total,
          method,
          tendered,
          change: method === "cash" && tendered !== undefined ? round2(tendered - d.total) : undefined,
          cashierName: currentUser?.name ?? "Kasun Perera",
          discountCode: discount?.code,
        })
        .catch((err) => {
          console.warn("Failed to persist transaction to SQLite database:", err.message);
        });

      return txn;
    },
    [cartDetail, transactions, currentUser, discount],
  );

  const refund = useCallback((id: string) => {
    setTransactions((ts) => ts.map((t) => (t.id === id ? { ...t, status: "refunded" } : t)));
    api.refundTransaction(id).catch((err) => console.warn("Failed to sync refund to DB:", err.message));
  }, []);

  const value: StoreShape = {
    users,
    currentUser,
    isLocked,
    isDbConnected,
    loginWithPin,
    loginWithEmail,
    registerUser,
    updateUser,
    deleteUser,
    lockTerminal,
    unlockTerminal,
    logout,
    verifyManagerPin,
    products,
    upsertProduct,
    setStock,
    toggleAvailable,
    deleteProduct,
    cart,
    cartDetail,
    addToCart,
    changeQty,
    removeLine,
    clearCart,
    discount,
    applyDiscount,
    clearDiscount,
    transactions,
    nextNumber,
    completeSale,
    refund,
    toasts,
    notify,
    dismissToast,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreShape {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

