import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, type ToastKind } from "./store";
import { IcAlert, IcCheck, IcDown, IcInfo, IcUp, IcX } from "./icons";

/* ---------------- Modal ---------------- */

export function Modal({
  open,
  onClose,
  children,
  w = "max-w-md",
  locked = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  w?: string;
  locked?: boolean;
}) {
  useEffect(() => {
    if (!open || locked) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, locked, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-pine-950/60"
            onClick={() => {
              if (!locked) onClose();
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className={`relative w-full ${w} max-h-[92vh] overflow-y-auto scroll-slim`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Toasts ---------------- */

const TOAST_STYLE: Record<ToastKind, { border: string; iconBg: string; icon: typeof IcCheck }> = {
  success: { border: "border-l-moss-500", iconBg: "bg-moss-100 text-moss-600", icon: IcCheck },
  info: { border: "border-l-pine-700", iconBg: "bg-pine-100 text-pine-700", icon: IcInfo },
  warn: { border: "border-l-warn-500", iconBg: "bg-warn-100 text-warn-600", icon: IcAlert },
  danger: { border: "border-l-danger-500", iconBg: "bg-danger-100 text-danger-600", icon: IcAlert },
};

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[330px] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const s = TOAST_STYLE[t.kind];
          const Icon = s.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 70, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.92, transition: { duration: 0.16 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={`pointer-events-auto flex items-center gap-3 rounded-lg border border-line border-l-4 ${s.border} bg-card px-3 py-2.5 shadow-[0_14px_34px_-18px_rgba(11,28,20,0.45)]`}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${s.iconBg}`}>
                <Icon className="h-4 w-4" />
              </span>
              <p className="flex-1 text-[13px] font-medium leading-snug">{t.msg}</p>
              <button
                onClick={() => dismissToast(t.id)}
                className="shrink-0 rounded p-1 text-ink-faint transition-colors hover:bg-paper hover:text-ink"
                aria-label="Dismiss"
              >
                <IcX className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Segmented control ---------------- */

export function Seg<T extends string>({
  id,
  options,
  value,
  onChange,
  size = "md",
}: {
  id: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-line bg-card p-0.5 shadow-[inset_0_1px_2px_rgba(27,42,33,0.04)]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`relative font-semibold text-ink-soft transition-colors hover:text-ink ${
              size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]"
            } ${active ? "text-card hover:text-card" : ""} rounded-[7px]`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[7px] bg-pine-800"
                transition={{ type: "spring", stiffness: 520, damping: 40 }}
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Delta chip ---------------- */

export function Delta({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold ${
        up ? "bg-moss-100 text-moss-600" : "bg-danger-100 text-danger-600"
      }`}
      title="vs previous period"
    >
      {up ? <IcUp className="h-3 w-3" /> : <IcDown className="h-3 w-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

/* ---------------- Sparkline ---------------- */

export function Spark({ data, className }: { data: number[]; className?: string }) {
  const w = 96;
  const h = 30;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const pts = data.map((v, i) => [
    (i / Math.max(data.length - 1, 1)) * w,
    h - 3 - ((v - min) / span) * (h - 7),
  ]);
  const d = "M" + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden>
      <motion.path
        key={d}
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </svg>
  );
}

/* ---------------- Toggle switch ---------------- */

export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      aria-label={label ?? "Toggle"}
      className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors duration-200 ${
        on ? "bg-moss-500" : "bg-line"
      }`}
    >
      <motion.span
        className="absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-card shadow-sm"
        animate={{ x: on ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 550, damping: 34 }}
      />
    </button>
  );
}

/* ---------------- Barcode ---------------- */

export function Barcode({ value, className }: { value: string; className?: string }) {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (const ch of value) {
    const c = ch.charCodeAt(0);
    bars.push({ x, w: (c % 3) + 1 });
    x += (c % 3) + 2;
    bars.push({ x, w: 1 });
    x += 2;
  }
  return (
    <svg viewBox={`0 0 ${x} 30`} preserveAspectRatio="none" className={className} aria-hidden>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={30} fill="currentColor" />
      ))}
    </svg>
  );
}

/* ---------------- Empty state ---------------- */

export function EmptyState({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-card/60 px-6 py-14 text-center"
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-paper text-ink-faint">{icon}</div>
      <p className="mt-3 font-display text-[15px] font-bold">{title}</p>
      <p className="mt-1 max-w-[260px] text-[13px] text-ink-soft">{sub}</p>
    </motion.div>
  );
}
