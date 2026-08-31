import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { PayMethod, Txn } from "../types";
import { METHOD_LABEL } from "../types";
import {
  bucketByDay,
  bucketByHour,
  dayStart,
  DAY,
  fmtClockShort,
  fmtMoney,
  fmtMoney0,
  methodMix,
  niceMax,
  round2,
  summarize,
  topProducts,
  type Bucket,
} from "../data";
import { useStore } from "../store";
import { useCountUp } from "../hooks";
import { Delta, Modal, Seg, Spark } from "../ui";
import { IcAlert, IcCard, IcCash, IcPhone, IcReceipt } from "../icons";
import { ReceiptPanel } from "./Receipt";

type Range = "today" | "7d" | "30d";

const cardCls =
  "rounded-xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(27,42,33,0.05)]";

const METHOD_ICON: Record<PayMethod, typeof IcCard> = {
  card: IcCard,
  cash: IcCash,
  mobile: IcPhone,
};

const METHOD_TINT: Record<PayMethod, string> = {
  card: "bg-pine-100 text-pine-700",
  cash: "bg-moss-100 text-moss-600",
  mobile: "bg-marigold-100 text-marigold-600",
};

export default function Dashboard() {
  const { transactions: txns, products, setStock, notify } = useStore();
  const [range, setRange] = useState<Range>("7d");
  const [viewTxn, setViewTxn] = useState<Txn | null>(null);

  const { cur, prev, bars } = useMemo(() => {
    const end = dayStart(Date.now()) + DAY;
    let from: number;
    let prevFrom: number;
    if (range === "today") {
      from = end - DAY;
      prevFrom = from - DAY;
    } else if (range === "7d") {
      from = end - 7 * DAY;
      prevFrom = from - 7 * DAY;
    } else {
      from = end - 30 * DAY;
      prevFrom = from - 30 * DAY;
    }
    return {
      cur: txns.filter((t) => t.time >= from && t.time < end),
      prev: txns.filter((t) => t.time >= prevFrom && t.time < from),
      bars: range === "today" ? bucketByHour(txns.filter((t) => t.time >= end - DAY)) : bucketByDay(txns, range === "7d" ? 7 : 30).filter((_, i, arr) => i >= arr.length - (range === "7d" ? 7 : 30)),
    };
  }, [txns, range]);

  const sc = useMemo(() => summarize(cur), [cur]);
  const sp = useMemo(() => summarize(prev), [prev]);
  const delta = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 100);

  const low = products.filter((p) => p.available && p.stock <= 8);

  const kpis = [
    { label: "Revenue", value: sc.revenue, prev: sp.revenue, fmt: (v: number) => fmtMoney0(v), spark: bars.map((b) => b.value) },
    { label: "Orders", value: sc.orders, prev: sp.orders, fmt: (v: number) => Math.round(v).toLocaleString(), spark: bars.map((b) => b.orders) },
    { label: "Avg order", value: sc.aov, prev: sp.aov, fmt: (v: number) => fmtMoney(v), spark: bars.map((b) => (b.orders ? b.value / b.orders : 0)) },
    { label: "Items sold", value: sc.items, prev: sp.items, fmt: (v: number) => Math.round(v).toLocaleString(), spark: bars.map((b) => b.value) },
  ];

  return (
    <div className="h-full overflow-y-auto scroll-slim">
      <div className="mx-auto max-w-[1200px] space-y-4 p-5">
        {/* header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Seg<Range>
              id="range"
              value={range}
              onChange={setRange}
              options={[
                { value: "today", label: "Today" },
                { value: "7d", label: "7 days" },
                { value: "30d", label: "30 days" },
              ]}
            />
            <p className="mt-1.5 text-[12px] text-ink-soft">
              Compared with the previous {range === "today" ? "day" : range === "7d" ? "7 days" : "30 days"}
            </p>
          </div>
          <span className="flex items-center gap-2 text-[12px] font-semibold text-ink-soft">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-moss-500" />
            </span>
            Live — rings through as sales land
          </span>
        </div>

        {/* low stock strip */}
        {low.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 overflow-x-auto rounded-xl border border-warn-500/30 bg-warn-100/70 px-4 py-2.5 scroll-slim"
          >
            <span className="flex shrink-0 items-center gap-2 text-[13px] font-bold text-warn-600">
              <IcAlert className="h-4 w-4" />
              {low.length} low in stock
            </span>
            <span className="h-5 w-px shrink-0 bg-warn-500/30" />
            {low.map((p) => (
              <span
                key={p.id}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-warn-500/25 bg-card px-2.5 py-1 text-[12.5px]"
              >
                <span className="font-semibold">{p.name}</span>
                <span className="font-mono font-bold text-warn-600">{p.stock}</span>
                <button
                  onClick={() => {
                    setStock(p.id, p.stock + 24);
                    notify("success", `Restocked ${p.name} (+24 units)`);
                  }}
                  className="rounded-md bg-pine-800 px-1.5 py-0.5 text-[11px] font-bold text-card transition-colors hover:bg-pine-700"
                >
                  +24
                </button>
              </span>
            ))}
          </motion.div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {kpis.map((k, i) => (
            <KpiCard key={k.label} {...k} deltaPct={delta(k.value, k.prev)} delay={i * 0.05} />
          ))}
        </div>

        {/* charts row */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${cardCls} xl:col-span-2`}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-[16px] font-extrabold tracking-tight">Revenue</h3>
                <p className="text-[12px] text-ink-soft">
                  {range === "today" ? "By hour · today" : range === "7d" ? "By day · last 7 days" : "By day · last 30 days"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[18px] font-bold leading-tight">{fmtMoney(sc.revenue)}</p>
                <Delta pct={delta(sc.revenue, sp.revenue)} />
              </div>
            </div>
            <RevenueBars bars={bars} />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={cardCls}
          >
            <h3 className="font-display text-[16px] font-extrabold tracking-tight">Payment mix</h3>
            <p className="mb-4 text-[12px] text-ink-soft">Share of revenue by method</p>
            <MixDonut cur={cur} />
          </motion.section>
        </div>

        {/* lists row */}
        <div className="grid grid-cols-1 gap-4 pb-2 xl:grid-cols-3">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cardCls}
          >
            <h3 className="font-display text-[16px] font-extrabold tracking-tight">Top products</h3>
            <p className="mb-4 text-[12px] text-ink-soft">By revenue in this period</p>
            <TopList cur={cur} />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className={`${cardCls} xl:col-span-2`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display text-[16px] font-extrabold tracking-tight">Recent activity</h3>
                <p className="text-[12px] text-ink-soft">Latest orders across all terminals</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-md bg-paper px-2 py-1 text-[11px] font-bold text-ink-soft">
                <IcReceipt className="h-3.5 w-3.5" />
                tap for receipt
              </span>
            </div>
            <div className="space-y-0.5">
              {txns.slice(0, 7).map((t, i) => {
                const Icon = METHOD_ICON[t.method];
                return (
                  <motion.button
                    key={t.id}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    onClick={() => setViewTxn(t)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-paper"
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${METHOD_TINT[t.method]}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[12.5px] font-bold">{t.id}</span>
                      <span className="block truncate text-[11.5px] text-ink-soft">
                        {t.lines[0].name}
                        {t.lines.length > 1 ? ` +${t.lines.length - 1} more` : ""}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-mono text-[13px] font-bold">{fmtMoney(t.total)}</span>
                      <span
                        className={`block text-[10.5px] font-bold ${
                          t.status === "completed" ? "text-moss-600" : "text-danger-600"
                        }`}
                      >
                        {t.status}
                      </span>
                    </span>
                    <span className="w-14 text-right font-mono text-[10.5px] text-ink-faint">
                      {fmtClockShort(t.time)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        </div>
      </div>

      <Modal open={!!viewTxn} onClose={() => setViewTxn(null)} w="max-w-[380px]">
        {viewTxn && <ReceiptPanel txn={viewTxn} onClose={() => setViewTxn(null)} />}
      </Modal>
    </div>
  );
}

/* ================= KPI card ================= */

function KpiCard({
  label,
  value,
  fmt,
  spark,
  deltaPct,
  delay,
}: {
  label: string;
  value: number;
  prev: number;
  fmt: (v: number) => string;
  spark: number[];
  deltaPct: number;
  delay: number;
}) {
  const v = useCountUp(value);
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 26 }}
      className={cardCls}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">{label}</p>
        <Delta pct={deltaPct} />
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <p className="font-display text-[25px] font-extrabold leading-none tracking-tight tabular-nums">
          {fmt(v)}
        </p>
        <Spark data={spark} className="h-8 w-24 shrink-0 text-pine-600" />
      </div>
    </motion.section>
  );
}

/* ================= revenue bars ================= */

function RevenueBars({ bars }: { bars: Bucket[] }) {
  const max = niceMax(Math.max(...bars.map((b) => b.value)));
  const n = bars.length;
  const labelStep = Math.max(1, Math.ceil(n / 8));

  return (
    <div>
      <div className="relative h-56">
        <div className="absolute inset-0 flex flex-col justify-between">
          {[1, 0.75, 0.5, 0.25, 0].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <span className="w-11 shrink-0 text-right font-mono text-[10px] text-ink-faint">
                {f === 0 ? "0" : fmtMoney0(max * f)}
              </span>
              <div className="h-px flex-1 bg-line-soft" />
            </div>
          ))}
        </div>
        <div className="absolute inset-y-0 left-[52px] right-0 flex items-end gap-[3px]">
          {bars.map((b, i) => (
            <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-pine-950 px-2 py-1 font-mono text-[10.5px] text-paper opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                {b.label} · {fmtMoney0(b.value)} · {b.orders} ord
              </div>
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.018, type: "spring", stiffness: 260, damping: 26 }}
                style={{ height: b.value > 0 ? `${(b.value / max) * 100}%` : "3px", originY: 1 }}
                className={`w-full rounded-t-[3px] transition-colors duration-150 ${
                  b.value > 0 ? "bg-pine-700 group-hover:bg-marigold-500" : "bg-line"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="ml-[52px] mt-1.5 flex gap-[3px]">
        {bars.map((b, i) => (
          <span key={i} className="flex-1 truncate text-center font-mono text-[9.5px] text-ink-faint">
            {i % labelStep === 0 ? b.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================= payment mix donut ================= */

function MixDonut({ cur }: { cur: Txn[] }) {
  const mix = methodMix(cur);
  const total = round2(mix.card + mix.cash + mix.mobile) || 1;
  const parts = [
    { key: "card" as const, label: METHOD_LABEL.card, value: mix.card, color: "#1d4530" },
    { key: "mobile" as const, label: METHOD_LABEL.mobile, value: mix.mobile, color: "#f0a32b" },
    { key: "cash" as const, label: METHOD_LABEL.cash, value: mix.cash, color: "#6491b5" },
  ];
  const [active, setActive] = useState<number | null>(null);
  const r = 52;
  const C = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative shrink-0">
        <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--color-line-soft)" strokeWidth="16" />
          {parts.map((p, i) => {
            const frac = p.value / total;
            const off = acc;
            acc += frac;
            return (
              <motion.circle
                key={p.key}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={p.color}
                strokeDashoffset={-off * C}
                initial={{ strokeDasharray: `0 ${C}`, strokeWidth: 16 }}
                animate={{
                  strokeDasharray: `${frac * C} ${C}`,
                  strokeWidth: active === i ? 21 : 16,
                }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: "easeOut" }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className="cursor-pointer"
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          {active !== null ? (
            <div>
              <p className="font-mono text-[16px] font-bold leading-tight">
                {((parts[active].value / total) * 100).toFixed(0)}%
              </p>
              <p className="text-[11px] text-ink-soft">{parts[active].label}</p>
            </div>
          ) : (
            <div>
              <p className="font-mono text-[16px] font-bold leading-tight">{fmtMoney0(total)}</p>
              <p className="text-[11px] text-ink-soft">taken</p>
            </div>
          )}
        </div>
      </div>
      <div className="w-full flex-1 space-y-1.5">
        {parts.map((p, i) => (
          <div
            key={p.key}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={`flex cursor-default items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors ${
              active === i ? "bg-paper" : ""
            }`}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: p.color }} />
            <span className="flex-1 text-[12.5px] font-semibold">{p.label}</span>
            <span className="font-mono text-[11.5px] text-ink-soft">
              {((p.value / total) * 100).toFixed(0)}%
            </span>
            <span className="w-[70px] text-right font-mono text-[12px] font-bold">
              {fmtMoney0(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= top products ================= */

function TopList({ cur }: { cur: Txn[] }) {
  const top = topProducts(cur, 6);
  const max = top[0]?.revenue ?? 1;

  if (top.length === 0) {
    return <p className="py-8 text-center text-[12.5px] text-ink-faint">No completed sales in this period yet.</p>;
  }

  return (
    <div className="space-y-3">
      {top.map((t, i) => (
        <div key={t.name} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-center font-mono text-[11px] font-bold text-ink-faint">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[12.5px] font-semibold">{t.name}</span>
              <span className="shrink-0 font-mono text-[11.5px] font-bold">{fmtMoney0(t.revenue)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line-soft">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(t.revenue / max) * 100}%` }}
                transition={{ delay: 0.25 + i * 0.06, type: "spring", stiffness: 110, damping: 22 }}
                className="h-full rounded-full bg-pine-700"
              />
            </div>
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-[10.5px] text-ink-faint">
            × {t.qty}
          </span>
        </div>
      ))}
    </div>
  );
}
