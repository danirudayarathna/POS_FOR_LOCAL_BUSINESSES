import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import type { Category, PayMethod, Product, Txn } from "../types";
import { CATEGORY_HUE, CATEGORY_LABEL, METHOD_LABEL } from "../types";
import { fmtMoney } from "../data";
import { useStore } from "../store";
import {
  CATEGORY_ICON,
  IcBag,
  IcCard,
  IcCash,
  IcMinus,
  IcPhone,
  IcPlus,
  IcSearch,
  IcTrash,
  IcX,
} from "../icons";
import { EmptyState, Modal } from "../ui";
import { ReceiptPanel } from "./Receipt";

const CATS: ("all" | Category)[] = ["all", "espresso", "brew", "bakery", "retail"];
const CAT_SHORTCUTS: Record<string, "all" | Category> = {
  a: "all",
  e: "espresso",
  b: "brew",
  k: "bakery",
  r: "retail",
};

export default function Register() {
  const { products, cartDetail, addToCart, clearCart } = useStore();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<"all" | Category>("all");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [payOpen, setPayOpen] = useState(false);
  const [payLocked, setPayLocked] = useState(false);
  const [receiptTxn, setReceiptTxn] = useState<Txn | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === "all" || p.category === cat) &&
        (needle === "" || p.name.toLowerCase().includes(needle)),
    );
  }, [products, cat, query]);

  // Dynamically calculate grid columns based on actual rendered layout
  const getGridColumns = () => {
    if (!gridRef.current || !gridRef.current.children.length) return 3;
    const children = Array.from(gridRef.current.children) as HTMLElement[];
    if (children.length <= 1) return 1;
    const firstTop = children[0].offsetTop;
    let count = 0;
    for (const child of children) {
      if (Math.abs(child.offsetTop - firstTop) < 8) {
        count++;
      } else {
        break;
      }
    }
    return Math.max(1, count);
  };

  // Keep highlighted index in bounds
  useEffect(() => {
    setHighlightedIndex((prev) => {
      if (filtered.length === 0) return 0;
      return Math.min(Math.max(0, prev), filtered.length - 1);
    });
  }, [filtered.length]);

  // Smooth scroll active highlighted product tile into view
  useEffect(() => {
    if (!gridRef.current) return;
    const activeTile = gridRef.current.children[highlightedIndex] as HTMLElement | undefined;
    if (activeTile && typeof activeTile.scrollIntoView === "function") {
      activeTile.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
  }, [highlightedIndex]);

  // Register view keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't handle if a modal is open
      if (payOpen || receiptTxn) return;

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Search shortcut: / or Ctrl+K
      if ((e.key === "/" && !isInput) || ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K"))) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }

      // Charge shortcut: F9 or Ctrl+Enter or Alt+C
      if (
        e.key === "F9" ||
        ((e.ctrlKey || e.metaKey) && e.key === "Enter") ||
        (e.altKey && (e.key === "c" || e.key === "C"))
      ) {
        if (cartDetail.count > 0) {
          e.preventDefault();
          setPayOpen(true);
        }
        return;
      }

      // Clear cart shortcut: Alt+X or Ctrl+Delete or Ctrl+Backspace
      if (
        (e.altKey && (e.key === "x" || e.key === "X")) ||
        ((e.ctrlKey || e.metaKey) && (e.key === "Delete" || e.key === "Backspace"))
      ) {
        if (!isInput && cartDetail.count > 0) {
          e.preventDefault();
          clearCart();
        }
        return;
      }

      // Discount shortcut: Alt+D
      if (e.altKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
        return;
      }

      // Category jump shortcuts: Alt + [A/E/B/K/R]
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const lower = e.key.toLowerCase();
        if (CAT_SHORTCUTS[lower]) {
          e.preventDefault();
          setCat(CAT_SHORTCUTS[lower]);
          setHighlightedIndex(0);
          return;
        }
      }

      // Category cycling: [ and ]
      if (!isInput && (e.key === "[" || e.key === "]")) {
        e.preventDefault();
        setCat((prev) => {
          const idx = CATS.indexOf(prev);
          if (e.key === "[") {
            return CATS[(idx - 1 + CATS.length) % CATS.length];
          } else {
            return CATS[(idx + 1) % CATS.length];
          }
        });
        setHighlightedIndex(0);
        return;
      }

      // When search is focused
      if (document.activeElement === searchRef.current) {
        if (e.key === "Escape") {
          e.preventDefault();
          setQuery("");
          searchRef.current?.blur();
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          searchRef.current?.blur();
          setHighlightedIndex(0);
          return;
        }
        if (e.key === "Enter") {
          if (filtered.length > 0) {
            e.preventDefault();
            const targetProd = filtered[highlightedIndex] ?? filtered[0];
            if (targetProd.available && targetProd.stock > 0) {
              addToCart(targetProd.id);
            }
          }
          return;
        }
        return;
      }

      // Arrow grid navigation when not typing in an input
      if (!isInput && filtered.length > 0) {
        const cols = getGridColumns();

        if (e.key === "ArrowRight") {
          e.preventDefault();
          setHighlightedIndex((prev) => Math.min(filtered.length - 1, prev + 1));
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setHighlightedIndex((prev) => Math.max(0, prev - 1));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev + cols;
            if (next < filtered.length) return next;
            // If next jumps past end, jump to last element if not already there
            if (prev < filtered.length - 1) return filtered.length - 1;
            return prev;
          });
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev - cols;
            if (next >= 0) return next;
            // If on top row, jump to first column element (0) or stay
            return prev > 0 && prev < cols ? 0 : prev;
          });
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const targetProd = filtered[highlightedIndex];
          if (targetProd && targetProd.available && targetProd.stock > 0) {
            addToCart(targetProd.id);
          }
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payOpen, receiptTxn, cartDetail.count, filtered, highlightedIndex, addToCart, clearCart]);

  return (
    <div className="flex h-full min-h-0">
      {/* ------- product picker ------- */}
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-card/80 px-5 py-3">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <IcSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder="Search the menu (/ or Ctrl+K)"
              className="w-full rounded-lg border border-line bg-card py-2 pl-9 pr-12 text-[13.5px] font-medium outline-none transition focus:border-pine-600 focus:ring-2 focus:ring-pine-600/15"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
                /
              </kbd>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {CATS.map((c) => {
              const active = cat === c;
              return (
                <button
                  key={c}
                  onClick={() => {
                    setCat(c);
                    setHighlightedIndex(0);
                  }}
                  className={`relative rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    active ? "text-card" : "border border-line bg-card text-ink-soft hover:text-ink"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="cat-pill"
                      className="absolute inset-0 rounded-full bg-pine-800"
                      transition={{ type: "spring", stiffness: 520, damping: 40 }}
                    />
                  )}
                  <span className="relative z-10">{c === "all" ? "All items" : CATEGORY_LABEL[c]}</span>
                </button>
              );
            })}
          </div>
          <span className="ml-auto font-mono text-[11.5px] text-ink-faint">
            {filtered.length} item{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="dotgrid min-h-0 flex-1 overflow-y-auto scroll-slim p-5">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<IcSearch className="h-5 w-5" />}
              title="Nothing on the menu matches"
              sub="Try a different search term or switch category."
            />
          ) : (
            <div
              ref={gridRef}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            >
              {filtered.map((p, i) => (
                <ProductTile
                  key={p.id}
                  p={p}
                  i={i}
                  highlighted={i === highlightedIndex}
                  onSelect={() => setHighlightedIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------- cart ------- */}
      <CartPanel
        discountInputRef={discountInputRef}
        onCharge={() => setPayOpen(true)}
      />

      <Modal open={payOpen} onClose={() => setPayOpen(false)} w="max-w-lg" locked={payLocked}>
        <PaymentFlow
          onClose={() => setPayOpen(false)}
          onLock={setPayLocked}
          onReceipt={(t) => {
            setPayOpen(false);
            setReceiptTxn(t);
          }}
        />
      </Modal>

      <Modal open={!!receiptTxn} onClose={() => setReceiptTxn(null)} w="max-w-[380px]">
        {receiptTxn && <ReceiptPanel txn={receiptTxn} onClose={() => setReceiptTxn(null)} />}
      </Modal>
    </div>
  );
}

/* ================= product tile ================= */

function ProductTile({
  p,
  i,
  highlighted,
  onSelect,
}: {
  p: Product;
  i: number;
  highlighted?: boolean;
  onSelect?: () => void;
}) {
  const { addToCart } = useStore();
  const soldOut = !p.available || p.stock <= 0;
  const low = !soldOut && p.stock <= 8;
  const hue = CATEGORY_HUE[p.category];
  const Icon = CATEGORY_ICON[p.category];

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.02, 0.35), type: "spring", stiffness: 320, damping: 27 }}
      whileHover={soldOut ? undefined : { y: -3 }}
      whileTap={soldOut ? undefined : { scale: 0.95 }}
      onClick={() => {
        onSelect?.();
        addToCart(p.id);
      }}
      disabled={soldOut}
      className={`group relative flex flex-col rounded-xl border bg-card p-3 text-left transition-[box-shadow,border-color,transform] duration-150 ${
        soldOut
          ? "cursor-not-allowed border-line opacity-50"
          : highlighted
            ? "border-pine-700 ring-2 ring-marigold-500 shadow-[0_8px_20px_-8px_rgba(240,163,43,0.6)]"
            : "border-line hover:border-pine-600/50 hover:shadow-[0_12px_28px_-16px_rgba(16,37,27,0.4)]"
      }`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg transition-transform duration-200 group-hover:scale-105"
          style={{ background: `hsl(${hue} 46% 92%)`, color: `hsl(${hue} 42% 30%)` }}
        >
          <Icon className="h-5.5 w-5.5" style={{ width: 22, height: 22 }} />
        </span>
        {soldOut ? (
          <span className="rounded-md bg-danger-100 px-1.5 py-0.5 text-[10.5px] font-bold text-danger-600">
            {p.available ? "Sold out" : "Hidden"}
          </span>
        ) : low ? (
          <span className="rounded-md bg-warn-100 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-warn-600">
            {p.stock} left
          </span>
        ) : null}
      </div>
      <span className="mt-2.5 block text-[13.5px] font-semibold leading-snug">{p.name}</span>
      <span className="mt-auto flex w-full items-center justify-between pt-2">
        <span className="font-mono text-[13px] font-bold">{fmtMoney(p.price)}</span>
        {!soldOut && (
          <span className={`grid h-6 place-items-center rounded-md px-1.5 font-mono text-[10.5px] font-bold transition-opacity duration-150 ${
            highlighted ? "bg-marigold-500 text-pine-950 opacity-100" : "bg-pine-800 text-card opacity-0 group-hover:opacity-100"
          }`}>
            {highlighted ? "↵ Add" : <IcPlus className="h-3.5 w-3.5" />}
          </span>
        )}
      </span>
    </motion.button>
  );
}

/* ================= cart panel ================= */

function CartPanel({
  onCharge,
  discountInputRef,
}: {
  onCharge: () => void;
  discountInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const s = useStore();
  const d = s.cartDetail;

  return (
    <aside className="flex w-[350px] shrink-0 flex-col border-l border-line bg-card">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">
            Current order
          </p>
          <p className="font-mono text-[13px] font-bold">
            #{s.nextNumber}
            <span className="ml-1.5 font-sans text-[11.5px] font-medium text-ink-faint">
              {d.count} item{d.count === 1 ? "" : "s"}
            </span>
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={s.clearCart}
          disabled={d.count === 0}
          className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-soft transition-colors hover:border-danger-500/50 hover:bg-danger-100/60 hover:text-danger-600 disabled:pointer-events-none disabled:opacity-35"
          title="Clear order (Alt+X)"
          aria-label="Clear order"
        >
          <IcTrash className="h-4 w-4" />
        </motion.button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-slim px-4">
        {d.lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-paper text-ink-faint">
              <IcBag className="h-6 w-6" />
            </span>
            <p className="mt-3 font-display text-[15px] font-bold">No items yet</p>
            <p className="mt-1 max-w-[220px] text-[12.5px] text-ink-soft">
              Press <kbd className="rounded border border-line bg-paper px-1 font-mono text-[10.5px]">/</kbd> to search, or use arrow keys &amp; <kbd className="rounded border border-line bg-paper px-1 font-mono text-[10.5px]">Enter</kbd> to add items.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {d.lines.map((l) => (
              <CartLine key={l.product.id} product={l.product} qty={l.qty} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <footer className="space-y-3 border-t border-line bg-paper/70 px-4 py-4">
        <DiscountBox inputRef={discountInputRef} />

        <div className="space-y-1 text-[13px]">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span className="font-mono font-bold text-ink">{fmtMoney(d.subtotal)}</span>
          </div>
          {d.discountAmt > 0 && s.discount && (
            <div className="flex justify-between font-semibold text-moss-600">
              <span>Discount · {s.discount.code}</span>
              <span className="font-mono">−{fmtMoney(d.discountAmt)}</span>
            </div>
          )}
          <div className="flex justify-between text-ink-soft">
            <span>Tax 8.5%</span>
            <span className="font-mono font-bold text-ink">{fmtMoney(d.tax)}</span>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-dashed border-line pt-2.5">
          <span className="font-display text-[15px] font-bold">Total</span>
          <motion.span
            key={d.total}
            initial={{ scale: 1.12, color: "#d98a10" }}
            animate={{ scale: 1, color: "#1b2a21" }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            className="font-display text-[26px] font-extrabold leading-none tracking-tight"
          >
            {fmtMoney(d.total)}
          </motion.span>
        </div>

        <motion.button
          whileTap={{ scale: 0.975 }}
          onClick={onCharge}
          disabled={d.count === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-marigold-500 py-3.5 font-display text-[16px] font-extrabold text-pine-950 shadow-[0_10px_24px_-12px_rgba(217,138,16,0.8)] transition-colors hover:bg-marigold-400 disabled:pointer-events-none disabled:opacity-35"
        >
          <span>{d.count === 0 ? "Charge" : `Charge ${fmtMoney(d.total)}`}</span>
          <kbd className="rounded bg-pine-950/15 px-1.5 py-0.5 font-mono text-[11px] font-bold">
            F9
          </kbd>
        </motion.button>
      </footer>
    </aside>
  );
}

function CartLine({ product, qty }: { product: Product; qty: number }) {
  const { changeQty, removeLine } = useStore();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, x: 30, height: 0, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 border-b border-dashed border-line py-3 last:border-0">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold">{product.name}</p>
          <p className="font-mono text-[11px] text-ink-faint">{fmtMoney(product.price)} each</p>
        </div>
        <div className="flex items-center rounded-lg border border-line bg-paper">
          <button
            onClick={() => changeQty(product.id, -1)}
            className="grid h-7 w-7 place-items-center rounded-l-lg text-ink-soft transition-colors hover:bg-danger-100 hover:text-danger-600"
            aria-label="Decrease quantity"
          >
            <IcMinus className="h-3.5 w-3.5" />
          </button>
          <motion.span
            key={qty}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="w-6 text-center font-mono text-[13px] font-bold"
          >
            {qty}
          </motion.span>
          <button
            onClick={() => changeQty(product.id, 1)}
            className="grid h-7 w-7 place-items-center rounded-r-lg text-ink-soft transition-colors hover:bg-moss-100 hover:text-moss-600"
            aria-label="Increase quantity"
          >
            <IcPlus className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="w-[64px] text-right font-mono text-[13px] font-bold">
          {fmtMoney(product.price * qty)}
        </span>
        <button
          onClick={() => removeLine(product.id)}
          className="rounded p-1 text-ink-faint transition-colors hover:bg-danger-100 hover:text-danger-600"
          aria-label="Remove line"
        >
          <IcX className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ================= discount ================= */

function DiscountBox({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const { discount, applyDiscount, clearDiscount, notify } = useStore();
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  if (discount) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-between rounded-lg border border-moss-500/30 bg-moss-100/70 px-3 py-2"
      >
        <span className="text-[12.5px] font-bold text-moss-600">
          {discount.code} · −{discount.pct}%
        </span>
        <button
          onClick={clearDiscount}
          className="rounded p-0.5 text-moss-600 transition-colors hover:bg-moss-500/20"
          aria-label="Remove discount"
        >
          <IcX className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    );
  }

  const tryApply = () => {
    if (!code.trim()) return;
    if (applyDiscount(code)) {
      notify("success", `Code ${code.trim().toUpperCase()} applied — ${DISCOUNT_HINT}`);
      setCode("");
      setErr(false);
    } else {
      setErr(true);
      setShakeKey((k) => k + 1);
    }
  };

  return (
    <div>
      <motion.div
        key={shakeKey}
        animate={shakeKey ? { x: [0, -7, 7, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-2"
      >
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setErr(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && tryApply()}
          placeholder="Discount code (Alt+D)"
          className={`min-w-0 flex-1 rounded-lg border bg-card px-3 py-2 text-[12.5px] font-semibold uppercase outline-none transition placeholder:normal-case placeholder:font-medium placeholder:text-ink-faint focus:ring-2 ${
            err
              ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/15"
              : "border-line focus:border-pine-600 focus:ring-pine-600/15"
          }`}
        />
        <button
          onClick={tryApply}
          className="rounded-lg border border-pine-800 px-3.5 text-[12.5px] font-bold text-pine-800 transition-colors hover:bg-pine-800 hover:text-card"
        >
          Apply
        </button>
      </motion.div>
      <AnimatePresence>
        {err && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-1 text-[11.5px] font-semibold text-danger-600"
          >
            Unknown code — try EMBER10 or OATCLUB
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const DISCOUNT_HINT = "order discounted";

/* ================= payment flow ================= */

const METHOD_META: { m: PayMethod; icon: typeof IcCard; label: string; sub: string; keyHint: string }[] = [
  { m: "card", icon: IcCard, label: "Card", sub: "Chip · tap · swipe", keyHint: "1" },
  { m: "cash", icon: IcCash, label: "Cash", sub: "Tender & change", keyHint: "2" },
  { m: "mobile", icon: IcPhone, label: "Mobile", sub: "QR · wallet", keyHint: "3" },
];

function PaymentFlow({
  onClose,
  onReceipt,
  onLock,
}: {
  onClose: () => void;
  onReceipt: (t: Txn) => void;
  onLock: (b: boolean) => void;
}) {
  const s = useStore();
  const { total, count } = s.cartDetail;
  const [phase, setPhase] = useState<"pick" | "cash" | "processing" | "success">("pick");
  const [method, setMethod] = useState<PayMethod>("card");
  const [tendered, setTendered] = useState(0);
  const [input, setInput] = useState("");
  const [done, setDone] = useState<Txn | null>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onLock(phase === "processing");
  }, [phase, onLock]);

  // Focus cash input on cash phase transition
  useEffect(() => {
    if (phase === "cash") {
      setTimeout(() => {
        cashInputRef.current?.focus();
        cashInputRef.current?.select();
      }, 80);
    }
  }, [phase]);

  const run = (m: PayMethod, tender?: number) => {
    setMethod(m);
    setPhase("processing");
    window.setTimeout(() => {
      const txn = s.completeSale(m, tender);
      setDone(txn);
      setPhase("success");
      confetti({
        particleCount: 130,
        spread: 78,
        origin: { y: 0.6 },
        colors: ["#f0a32b", "#1d4530", "#2e9e62", "#f6b955", "#fbfbf7"],
      });
      s.notify("success", `Sale ${txn.id} completed · ${fmtMoney(txn.total)}`);
    }, 1200);
  };

  const change = tendered - total;

  // Payment flow keyboard shortcuts
  useEffect(() => {
    const handlePayKey = (e: KeyboardEvent) => {
      if (phase === "processing") return;

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if (phase === "pick") {
        if (e.key === "1" || e.key === "c" || e.key === "C") {
          e.preventDefault();
          run("card");
        } else if (e.key === "2" || e.key === "s" || e.key === "S") {
          e.preventDefault();
          setMethod("cash");
          setPhase("cash");
        } else if (e.key === "3" || e.key === "m" || e.key === "M") {
          e.preventDefault();
          run("mobile");
        } else if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      } else if (phase === "cash") {
        if (e.key === "Escape") {
          e.preventDefault();
          setPhase("pick");
          return;
        }

        // Quick bill shortcuts when not focused or pressing keys
        if (!isInput) {
          if (e.key === "e" || e.key === "E") {
            e.preventDefault();
            setTendered(total);
            setInput(total.toFixed(2));
          } else if (e.key === "1") {
            e.preventDefault();
            setTendered(100);
            setInput("100");
          } else if (e.key === "2") {
            e.preventDefault();
            setTendered(500);
            setInput("500");
          } else if (e.key === "3") {
            e.preventDefault();
            setTendered(1000);
            setInput("1000");
          } else if (e.key === "4") {
            e.preventDefault();
            setTendered(2000);
            setInput("2000");
          } else if (e.key === "5") {
            e.preventDefault();
            setTendered(5000);
            setInput("5000");
          }
        }

        // Enter completes sale if tendered is enough
        if (e.key === "Enter") {
          if (tendered >= total && tendered > 0) {
            e.preventDefault();
            run("cash", tendered);
          }
        }
      } else if (phase === "success" && done) {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          e.preventDefault();
          onClose();
        } else if (e.key === "p" || e.key === "P" || e.key === "v" || e.key === "V" || e.key === "r" || e.key === "R") {
          e.preventDefault();
          onReceipt(done);
        }
      }
    };

    window.addEventListener("keydown", handlePayKey);
    return () => window.removeEventListener("keydown", handlePayKey);
  }, [phase, total, tendered, done, onClose, onReceipt]);

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-[0_30px_70px_-24px_rgba(11,28,20,0.65)]">
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-ink-faint">
            {phase === "success" ? "Payment complete" : `Payment · ${count} items`}
          </p>
          <p className="font-display text-[24px] font-extrabold tracking-tight">
            {fmtMoney(phase === "success" && done ? done.total : total)}
          </p>
        </div>
        {phase !== "processing" && (
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-soft transition-colors hover:bg-paper hover:text-ink"
            title="Cancel payment (Esc)"
            aria-label="Close payment"
          >
            <IcX className="h-4 w-4" />
          </button>
        )}
      </header>

      {phase === "pick" && (
        <div className="p-5">
          <p className="mb-3 text-[13px] font-semibold text-ink-soft">How is the customer paying?</p>
          <div className="grid grid-cols-3 gap-3">
            {METHOD_META.map(({ m, icon: Icon, label, sub, keyHint }, i) => (
              <motion.button
                key={m}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 340, damping: 26 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => (m === "cash" ? (setMethod("cash"), setPhase("cash")) : run(m))}
                className="group relative flex flex-col items-center gap-2 rounded-xl border-2 border-line bg-card px-2 py-5 transition-colors hover:border-pine-600/60"
              >
                <kbd className="absolute right-2 top-2 rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink-faint group-hover:border-pine-700 group-hover:text-pine-700">
                  {keyHint}
                </kbd>
                <span
                  className={`grid h-11 w-11 place-items-center rounded-lg ${
                    m === "card"
                      ? "bg-pine-100 text-pine-700"
                      : m === "cash"
                        ? "bg-moss-100 text-moss-600"
                        : "bg-marigold-100 text-marigold-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[13.5px] font-bold">{label}</span>
                <span className="text-center text-[10.5px] leading-tight text-ink-faint">{sub}</span>
              </motion.button>
            ))}
          </div>
          <p className="mt-4 text-center text-[11.5px] text-ink-faint">
            Press <kbd className="font-mono font-bold">1</kbd> for Card, <kbd className="font-mono font-bold">2</kbd> for Cash, or <kbd className="font-mono font-bold">3</kbd> for Mobile.
          </p>
        </div>
      )}

      {phase === "cash" && (
        <div className="p-5">
          <button
            onClick={() => setPhase("pick")}
            className="mb-3 text-[12px] font-bold text-pine-700 transition-colors hover:text-pine-600"
          >
            ← Back to methods <span className="font-mono font-normal opacity-70">(Esc)</span>
          </button>
          <p className="text-[13px] font-semibold text-ink-soft">Cash tendered</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <QuickBtn
              keyHint="E"
              label={`Exact`}
              sub={fmtMoney(total)}
              onClick={() => { setTendered(total); setInput(total.toFixed(2)); }}
            />
            {[100, 500, 1000, 2000, 5000].map((v, idx) => (
              <QuickBtn
                key={v}
                keyHint={String(idx + 1)}
                label={`Rs. ${v.toLocaleString()}`}
                sub="note"
                onClick={() => { setTendered(v); setInput(v.toString()); }}
              />
            ))}
          </div>
          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[12px] font-bold text-ink-faint">
              Rs.
            </span>
            <input
              ref={cashInputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setTendered(parseFloat(e.target.value) || 0);
              }}
              inputMode="decimal"
              placeholder="0.00"
              className="w-full rounded-lg border border-line bg-paper py-2.5 pl-10 pr-3 font-mono text-[15px] font-bold outline-none transition focus:border-pine-600 focus:bg-card focus:ring-2 focus:ring-pine-600/15"
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-dashed border-line bg-paper px-3.5 py-2.5">
            <span className="text-[12.5px] font-bold text-ink-soft">
              {tendered >= total && tendered > 0 ? "Change due" : "Still short"}
            </span>
            <span
              className={`font-mono text-[17px] font-bold ${
                tendered >= total && tendered > 0 ? "text-moss-600" : "text-danger-600"
              }`}
            >
              {fmtMoney(Math.abs(tendered > 0 ? change : total))}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.975 }}
            disabled={!(tendered >= total && tendered > 0)}
            onClick={() => run("cash", tendered)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-marigold-500 py-3 font-display text-[15px] font-extrabold text-pine-950 transition-colors hover:bg-marigold-400 disabled:pointer-events-none disabled:opacity-35"
          >
            <span>Complete cash sale</span>
            <kbd className="rounded bg-pine-950/15 px-1.5 py-0.5 font-mono text-[11px] font-bold">
              Enter ↵
            </kbd>
          </motion.button>
        </div>
      )}

      {phase === "processing" && (
        <div className="flex flex-col items-center px-5 py-12">
          <motion.div
            className="h-14 w-14 rounded-full border-4 border-line border-t-pine-700"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
          />
          <p className="mt-4 text-[14px] font-bold">
            {method === "cash"
              ? "Recording cash payment"
              : method === "mobile"
                ? "Waiting for wallet approval"
                : "Contacting card terminal"}
            <span className="dot-anim">.</span>
            <span className="dot-anim">.</span>
            <span className="dot-anim">.</span>
          </p>
          <p className="mt-1 text-[12px] text-ink-soft">Do not close the register</p>
        </div>
      )}

      {phase === "success" && done && (
        <div className="flex flex-col items-center px-5 py-8">
          <motion.svg
            viewBox="0 0 52 52"
            className="h-16 w-16"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 17 }}
          >
            <motion.circle
              cx="26"
              cy="26"
              r="23"
              fill="none"
              stroke="var(--color-moss-500)"
              strokeWidth="3.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
            <motion.path
              d="M15.5 27l7.5 7.5L36.5 19.5"
              fill="none"
              stroke="var(--color-moss-500)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3, duration: 0.28, ease: "easeOut" }}
            />
          </motion.svg>
          <p className="mt-3 font-display text-[20px] font-extrabold">Payment complete</p>
          <p className="mt-0.5 font-mono text-[13px] text-ink-soft">
            {done.id} · {METHOD_LABEL[done.method]}
          </p>
          {done.change !== undefined && done.change > 0 && (
            <p className="mt-2 rounded-lg bg-moss-100 px-3 py-1.5 font-mono text-[13px] font-bold text-moss-600">
              Change due {fmtMoney(done.change)}
            </p>
          )}
          <div className="mt-5 flex w-full gap-2">
            <button
              onClick={() => onReceipt(done)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-pine-800 py-2.5 text-[13.5px] font-bold text-pine-800 transition-colors hover:bg-pine-800 hover:text-card"
            >
              <span>View receipt</span>
              <kbd className="rounded border border-pine-800/40 bg-pine-800/10 px-1 font-mono text-[10.5px]">
                P
              </kbd>
            </button>
            <button
              onClick={onClose}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-marigold-500 py-2.5 text-[13.5px] font-extrabold text-pine-950 transition-colors hover:bg-marigold-400"
            >
              <span>New sale</span>
              <kbd className="rounded bg-pine-950/15 px-1 font-mono text-[10.5px]">
                ↵
              </kbd>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickBtn({
  label,
  sub,
  keyHint,
  onClick,
}: {
  label: string;
  sub: string;
  keyHint?: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="group relative rounded-lg border border-line bg-paper px-2 py-2 text-center transition-colors hover:border-pine-600/60 hover:bg-pine-100/50"
    >
      {keyHint && (
        <kbd className="absolute right-1.5 top-1 rounded bg-line-soft px-1 font-mono text-[9.5px] text-ink-faint group-hover:bg-pine-800 group-hover:text-card">
          {keyHint}
        </kbd>
      )}
      <span className="block font-mono text-[13px] font-bold">{label}</span>
      <span className="block text-[10px] text-ink-faint">{sub}</span>
    </motion.button>
  );
}
