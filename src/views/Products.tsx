import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Category, Product } from "../types";
import { CATEGORY_HUE, CATEGORY_LABEL } from "../types";
import { fmtMoney, round2 } from "../data";
import { useStore } from "../store";
import { EmptyState, Modal, Seg, Toggle } from "../ui";
import { CATEGORY_ICON, IcMinus, IcPencil, IcPlus, IcSearch } from "../icons";

const PREFIX: Record<Category, string> = {
  espresso: "ESP",
  brew: "BRW",
  bakery: "BKY",
  retail: "RTL",
};

const inputCls =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px] font-medium outline-none transition focus:border-pine-600 focus:bg-card focus:ring-2 focus:ring-pine-600/15";

export default function Products() {
  const { products, setStock, toggleAvailable, upsertProduct, notify } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | Category>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation for Products view
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if (editing || creating) return;

      if ((e.key === "/" && !isInput) || ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K"))) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if ((e.altKey && (e.key === "n" || e.key === "N")) || (!isInput && (e.key === "n" || e.key === "N"))) {
        e.preventDefault();
        setCreating(true);
        return;
      }

      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setQ("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [editing, creating]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === "all" || p.category === cat) &&
        (needle === "" ||
          p.name.toLowerCase().includes(needle) ||
          p.sku.toLowerCase().includes(needle)),
    );
  }, [products, q, cat]);

  const lowCount = products.filter((p) => p.available && p.stock <= 8).length;

  return (
    <div className="h-full overflow-y-auto scroll-slim">
      <div className="mx-auto max-w-[1150px] space-y-4 p-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <IcSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              ref={searchInputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or SKU (/)"
              className="w-full rounded-lg border border-line bg-card py-2 pl-9 pr-10 text-[13.5px] font-medium outline-none transition focus:border-pine-600 focus:ring-2 focus:ring-pine-600/15"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
              /
            </kbd>
          </div>
          <Seg<"all" | Category>
            id="prod-cat"
            size="sm"
            value={cat}
            onChange={setCat}
            options={[
              { value: "all", label: "All" },
              { value: "espresso", label: "Espresso" },
              { value: "brew", label: "Brew & Tea" },
              { value: "bakery", label: "Bakery" },
              { value: "retail", label: "Retail" },
            ]}
          />
          <span className="ml-auto font-mono text-[11.5px] text-ink-soft">
            {products.length} products{lowCount > 0 ? ` · ${lowCount} low` : ""}
          </span>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setCreating(true)}
            title="Add new product (Alt+N)"
            className="flex items-center gap-1.5 rounded-lg bg-marigold-500 px-3.5 py-2 text-[13px] font-extrabold text-pine-950 shadow-[0_8px_20px_-10px_rgba(217,138,16,0.9)] transition-colors hover:bg-marigold-400"
          >
            <IcPlus className="h-4 w-4" />
            <span>Add product</span>
            <kbd className="rounded bg-pine-950/15 px-1 py-0.5 font-mono text-[10px]">
              Alt+N
            </kbd>
          </motion.button>
        </motion.div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<IcSearch className="h-5 w-5" />}
            title="No products found"
            sub="Try another search, or add the product to the catalog."
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(27,42,33,0.05)]"
          >
            <div className="overflow-x-auto scroll-slim">
              <table className="w-full min-w-[860px] text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-[0.12em] text-ink-faint">
                    <th className="px-4 py-3 font-bold">Product</th>
                    <th className="px-3 py-3 font-bold">Category</th>
                    <th className="px-3 py-3 text-right font-bold">Price</th>
                    <th className="px-3 py-3 text-right font-bold">Margin</th>
                    <th className="px-3 py-3 font-bold">Stock</th>
                    <th className="px-3 py-3 font-bold">On menu</th>
                    <th className="px-4 py-3 text-right font-bold">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const Icon = CATEGORY_ICON[p.category];
                    const hue = CATEGORY_HUE[p.category];
                    const margin = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        className={`border-b border-line-soft transition-colors last:border-0 hover:bg-paper/80 ${
                          !p.available ? "opacity-55" : ""
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2.5">
                            <span
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                              style={{
                                background: `hsl(${hue} 46% 92%)`,
                                color: `hsl(${hue} 42% 30%)`,
                              }}
                            >
                              <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                              <span className="block font-mono text-[10.5px] text-ink-faint">{p.sku}</span>
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className="inline-block rounded-md px-2 py-0.5 text-[11px] font-bold"
                            style={{
                              background: `hsl(${hue} 46% 92%)`,
                              color: `hsl(${hue} 42% 28%)`,
                            }}
                          >
                            {CATEGORY_LABEL[p.category]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[13px] font-bold">
                          {fmtMoney(p.price)}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right font-mono text-[12px] font-bold ${
                            margin < 40 ? "text-warn-600" : "text-ink-soft"
                          }`}
                        >
                          {margin.toFixed(0)}%
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-1.5">
                            <button
                              onClick={() => setStock(p.id, p.stock - 1)}
                              disabled={p.stock <= 0}
                              className="grid h-7 w-7 place-items-center rounded-md border border-line bg-card text-ink-soft transition-colors hover:border-danger-500/50 hover:text-danger-600 disabled:pointer-events-none disabled:opacity-35"
                              aria-label={`Decrease stock of ${p.name}`}
                            >
                              <IcMinus className="h-3.5 w-3.5" />
                            </button>
                            <motion.span
                              key={p.stock}
                              initial={{ scale: 0.65 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 22 }}
                              className={`w-9 text-center font-mono text-[13px] font-bold ${
                                p.stock <= 8 ? "text-warn-600" : ""
                              }`}
                            >
                              {p.stock}
                            </motion.span>
                            <button
                              onClick={() => setStock(p.id, p.stock + 1)}
                              className="grid h-7 w-7 place-items-center rounded-md border border-line bg-card text-ink-soft transition-colors hover:border-moss-500/50 hover:text-moss-600"
                              aria-label={`Increase stock of ${p.name}`}
                            >
                              <IcPlus className="h-3.5 w-3.5" />
                            </button>
                            {p.stock <= 8 && (
                              <button
                                onClick={() => {
                                  setStock(p.id, p.stock + 24);
                                  notify("success", `Restocked ${p.name} (+24 units)`);
                                }}
                                className="ml-1 rounded-md bg-warn-100 px-2 py-1 text-[11px] font-bold text-warn-600 transition-colors hover:bg-warn-500/25"
                              >
                                +24
                              </button>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-2">
                            <Toggle
                              on={p.available}
                              label={`Toggle ${p.name} on menu`}
                              onChange={() => {
                                toggleAvailable(p.id);
                                notify(
                                  "info",
                                  p.available
                                    ? `${p.name} hidden from the register`
                                    : `${p.name} is back on the menu`,
                                );
                              }}
                            />
                            <span
                              className={`text-[11px] font-bold ${
                                p.available ? "text-moss-600" : "text-ink-faint"
                              }`}
                            >
                              {p.available ? "Live" : "Hidden"}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="flex justify-end">
                            <button
                              onClick={() => setEditing(p)}
                              className="grid h-7 w-7 place-items-center rounded-md border border-line text-ink-soft transition-colors hover:border-pine-600/50 hover:bg-pine-100/60 hover:text-pine-700"
                              aria-label={`Edit ${p.name}`}
                              title="Edit"
                            >
                              <IcPencil className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      <ProductForm
        open={creating || !!editing}
        initial={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={(p) => {
          upsertProduct(p);
          notify("success", editing ? `${p.name} updated` : `${p.name} added to the catalog`);
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

/* ================= add / edit form ================= */

function ProductForm({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Product | null;
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("espresso");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStockV] = useState("");
  const [available, setAvailable] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setCategory(initial?.category ?? "espresso");
      setPrice(initial ? String(initial.price) : "");
      setCost(initial ? String(initial.cost) : "");
      setStockV(initial ? String(initial.stock) : "24");
      setAvailable(initial?.available ?? true);
      setErr("");
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const handleModalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        save();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleModalKey);
    return () => window.removeEventListener("keydown", handleModalKey);
  });

  const save = () => {
    const pr = parseFloat(price);
    const co = parseFloat(cost || "0");
    const st = parseInt(stock || "0", 10);
    if (!name.trim()) return setErr("Give the product a name.");
    if (!(pr > 0)) return setErr("Price must be greater than zero.");
    if (!(co >= 0)) return setErr("Cost cannot be negative.");
    if (Number.isNaN(st) || st < 0) return setErr("Stock cannot be negative.");
    onSave({
      id: initial?.id ?? `p${Date.now()}`,
      sku: initial?.sku ?? `${PREFIX[category]}-${Math.floor(10 + Math.random() * 89)}`,
      name: name.trim(),
      category,
      price: round2(pr),
      cost: round2(co),
      stock: st,
      available,
      popularity: initial?.popularity ?? 3,
    });
  };

  return (
    <Modal open={open} onClose={onClose} w="max-w-md">
      <div className="rounded-xl bg-card p-5 shadow-[0_30px_70px_-24px_rgba(11,28,20,0.65)]">
        <h3 className="font-display text-[18px] font-extrabold tracking-tight">
          {initial ? `Edit ${initial.name}` : "New product"}
        </h3>
        <p className="mt-0.5 text-[12px] text-ink-soft">
          {initial ? `SKU ${initial.sku}` : "It will appear on the register immediately"}
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
              Name
            </span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Oat Milk Latte" />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={inputCls}
            >
              {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                Price (Rs.)
              </span>
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className={`${inputCls} font-mono`} placeholder="850.00" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                Cost (Rs.)
              </span>
              <input value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" className={`${inputCls} font-mono`} placeholder="150.00" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                Stock
              </span>
              <input value={stock} onChange={(e) => setStockV(e.target.value)} inputMode="numeric" className={`${inputCls} font-mono`} placeholder="24" />
            </label>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-line bg-paper px-3.5 py-2.5">
            <span className="text-[13px] font-semibold">Visible on the register</span>
            <Toggle on={available} onChange={() => setAvailable((a) => !a)} label="Visible on register" />
          </div>

          {err && <p className="text-[12px] font-semibold text-danger-600">{err}</p>}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-line bg-paper py-2.5 text-[13px] font-bold transition-colors hover:bg-line-soft"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            className="flex-1 rounded-lg bg-pine-800 py-2.5 text-[13px] font-bold text-card transition-colors hover:bg-pine-700"
          >
            {initial ? "Save changes" : "Add to catalog"}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}
