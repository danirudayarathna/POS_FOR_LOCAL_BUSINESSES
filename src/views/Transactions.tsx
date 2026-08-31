import { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { PayMethod, Txn, TxnStatus } from "../types";
import { METHOD_LABEL } from "../types";
import { fmtClockShort, fmtDay, fmtMoney, fmtMoney0, summarize } from "../data";
import { useStore } from "../store";
import { EmptyState, Modal, Seg } from "../ui";
import { IcCard, IcCash, IcPhone, IcReceipt, IcRefund, IcSearch } from "../icons";
import { ReceiptPanel } from "./Receipt";

const METHOD_ICON: Record<PayMethod, typeof IcCard> = {
  card: IcCard,
  cash: IcCash,
  mobile: IcPhone,
};

export default function Transactions() {
  const { transactions, refund, notify } = useStore();
  const [q, setQ] = useState("");
  const [method, setMethod] = useState<"all" | PayMethod>("all");
  const [status, setStatus] = useState<"all" | TxnStatus>("all");
  const [limit, setLimit] = useState(14);
  const [viewTxn, setViewTxn] = useState<Txn | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation for Transactions view
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if (viewTxn || confirmId) return;

      if ((e.key === "/" && !isInput) || ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K"))) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setQ("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewTxn, confirmId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return transactions.filter((t) => {
      if (method !== "all" && t.method !== method) return false;
      if (status !== "all" && t.status !== status) return false;
      if (
        needle &&
        !t.id.toLowerCase().includes(needle) &&
        !t.lines.some((l) => l.name.toLowerCase().includes(needle))
      )
        return false;
      return true;
    });
  }, [transactions, q, method, status]);

  const shown = filtered.slice(0, limit);
  const stats = useMemo(() => summarize(filtered), [filtered]);
  const confirmTxn = transactions.find((t) => t.id === confirmId) ?? null;

  return (
    <div className="h-full overflow-y-auto scroll-slim">
      <div className="mx-auto max-w-[1150px] space-y-4 p-5">
        {/* controls */}
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
              placeholder="Search order # or item (/)"
              className="w-full rounded-lg border border-line bg-card py-2 pl-9 pr-10 text-[13.5px] font-medium outline-none transition focus:border-pine-600 focus:ring-2 focus:ring-pine-600/15"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
              /
            </kbd>
          </div>
          <Seg<"all" | PayMethod>
            id="tx-method"
            size="sm"
            value={method}
            onChange={(v) => {
              setMethod(v);
              setLimit(14);
            }}
            options={[
              { value: "all", label: "All methods" },
              { value: "card", label: "Card" },
              { value: "cash", label: "Cash" },
              { value: "mobile", label: "Mobile" },
            ]}
          />
          <Seg<"all" | TxnStatus>
            id="tx-status"
            size="sm"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setLimit(14);
            }}
            options={[
              { value: "all", label: "Any status" },
              { value: "completed", label: "Completed" },
              { value: "refunded", label: "Refunded" },
            ]}
          />
          <span className="ml-auto font-mono text-[11.5px] text-ink-soft">
            {stats.orders} orders · {fmtMoney0(stats.revenue)}
            {stats.refunds > 0 ? ` · ${stats.refunds} refunded` : ""}
          </span>
        </motion.div>

        {/* table */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<IcReceipt className="h-5 w-5" />}
            title="No matching orders"
            sub="Try a different search term or reset the filters."
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(27,42,33,0.05)]"
          >
            <div className="overflow-x-auto scroll-slim">
              <table className="w-full min-w-[820px] text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-[0.12em] text-ink-faint">
                    <th className="px-4 py-3 font-bold">Order</th>
                    <th className="px-3 py-3 font-bold">Time</th>
                    <th className="px-3 py-3 font-bold">Items</th>
                    <th className="px-3 py-3 font-bold">Payment</th>
                    <th className="px-3 py-3 text-right font-bold">Total</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((t, i) => {
                    const Icon = METHOD_ICON[t.method];
                    const itemCount = t.lines.reduce((s, l) => s + l.qty, 0);
                    return (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.35) }}
                        onClick={() => setViewTxn(t)}
                        className="cursor-pointer border-b border-line-soft transition-colors last:border-0 hover:bg-paper/80"
                      >
                        <td className="px-4 py-2.5">
                          <span className="block font-mono text-[12.5px] font-bold">{t.id}</span>
                          <span className="block text-[10.5px] text-ink-faint">
                            {fmtDay(t.time)} · {t.cashierName || "Kasun Perera"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[12px] text-ink-soft">
                          {fmtClockShort(t.time)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold">{itemCount}</span>
                          <span className="ml-1.5 inline-block max-w-[190px] truncate align-bottom text-[12px] text-ink-soft">
                            {t.lines[0].name}
                            {t.lines.length > 1 ? ` +${t.lines.length - 1}` : ""}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                            <Icon className="h-4 w-4 text-ink-soft" />
                            {METHOD_LABEL[t.method]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[13px] font-bold">
                          {fmtMoney(t.total)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10.5px] font-bold capitalize ${
                              t.status === "completed"
                                ? "bg-moss-100 text-moss-600"
                                : "bg-danger-100 text-danger-600"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewTxn(t);
                              }}
                              className="grid h-7 w-7 place-items-center rounded-md border border-line text-ink-soft transition-colors hover:border-pine-600/50 hover:bg-pine-100/60 hover:text-pine-700"
                              aria-label={`View receipt ${t.id}`}
                              title="Receipt"
                            >
                              <IcReceipt className="h-3.5 w-3.5" />
                            </button>
                            {t.status === "completed" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmId(t.id);
                                }}
                                className="grid h-7 w-7 place-items-center rounded-md border border-line text-ink-soft transition-colors hover:border-danger-500/50 hover:bg-danger-100/60 hover:text-danger-600"
                                aria-label={`Refund ${t.id}`}
                                title="Refund"
                              >
                                <IcRefund className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <span className="font-mono text-[11.5px] text-ink-soft">
                Showing {shown.length} of {filtered.length}
              </span>
              {shown.length < filtered.length && (
                <button
                  onClick={() => setLimit((l) => l + 20)}
                  className="rounded-lg border border-pine-800 px-3.5 py-1.5 text-[12.5px] font-bold text-pine-800 transition-colors hover:bg-pine-800 hover:text-card"
                >
                  Load 20 more
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* receipt modal */}
      <Modal open={!!viewTxn} onClose={() => setViewTxn(null)} w="max-w-[380px]">
        {viewTxn && <ReceiptPanel txn={viewTxn} onClose={() => setViewTxn(null)} />}
      </Modal>

      {/* refund confirm */}
      <Modal open={!!confirmTxn} onClose={() => setConfirmId(null)} w="max-w-sm">
        {confirmTxn && (
          <div className="rounded-xl bg-card p-5 shadow-[0_30px_70px_-24px_rgba(11,28,20,0.65)]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-danger-100 text-danger-600">
              <IcRefund className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-display text-[18px] font-extrabold tracking-tight">
              Refund {confirmTxn.id}?
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              This returns <span className="font-mono font-bold text-ink">{fmtMoney(confirmTxn.total)}</span> to
              the customer's {METHOD_LABEL[confirmTxn.method].toLowerCase()} and removes the sale from revenue
              reporting.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-lg border border-line bg-paper py-2.5 text-[13px] font-bold transition-colors hover:bg-line-soft"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  refund(confirmTxn.id);
                  notify("info", `Refunded ${confirmTxn.id} · ${fmtMoney(confirmTxn.total)}`);
                  setConfirmId(null);
                }}
                className="flex-1 rounded-lg bg-danger-500 py-2.5 text-[13px] font-bold text-card transition-colors hover:bg-danger-600"
              >
                Refund {fmtMoney(confirmTxn.total)}
              </motion.button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
