import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { View } from "./types";
import { ROLE_LABEL, ROLE_BADGE_STYLE } from "./types";
import { dayStart, fmtMoney0, summarize, type Summary } from "./data";
import { useClock } from "./hooks";
import { StoreProvider, useStore } from "./store";
import { Modal, Toaster } from "./ui";
import {
  IcBox,
  IcChart,
  IcKeyboard,
  IcLock,
  IcLogo,
  IcLogOut,
  IcReceipt,
  IcSwitch,
  IcTill,
  IcUsers,
} from "./icons";
import Register from "./views/Register";
import Dashboard from "./views/Dashboard";
import Transactions from "./views/Transactions";
import Products from "./views/Products";
import StaffManagement from "./views/StaffManagement";
import LoginScreen from "./views/LoginScreen";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";

const NAV: { view: View; label: string; icon: typeof IcTill; keyHint: string }[] = [
  { view: "register", label: "Register", icon: IcTill, keyHint: "Alt+1" },
  { view: "dashboard", label: "Dashboard", icon: IcChart, keyHint: "Alt+2" },
  { view: "transactions", label: "Transactions", icon: IcReceipt, keyHint: "Alt+3" },
  { view: "products", label: "Products", icon: IcBox, keyHint: "Alt+4" },
  { view: "staff", label: "Staff", icon: IcUsers, keyHint: "Alt+5" },
];

const META: Record<View, { title: string; sub: string }> = {
  register: { title: "Register", sub: "Terminal 01 · Ember & Oat — Colombo" },
  dashboard: { title: "Dashboard", sub: "Store performance at a glance" },
  transactions: { title: "Transactions", sub: "Every order, refund and receipt" },
  products: { title: "Products", sub: "Catalog, pricing and stock levels" },
  staff: { title: "Staff & Roster", sub: "Employee credentials, shifts and security" },
};

function UserMenuModal({
  open,
  onClose,
  onSwitchUser,
  onLock,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onSwitchUser: () => void;
  onLock: () => void;
  onLogout: () => void;
}) {
  const { currentUser } = useStore();
  if (!currentUser) return null;
  const badge = ROLE_BADGE_STYLE[currentUser.role];

  return (
    <Modal open={open} onClose={onClose} w="max-w-xs">
      <div className="rounded-2xl border border-line bg-card p-5 shadow-[0_30px_70px_-24px_rgba(11,28,20,0.65)]">
        <div className="flex items-center gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-[15px] font-bold text-card shadow-sm"
            style={{ backgroundColor: currentUser.avatarColor || "#1d4530" }}
          >
            {currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-[16px] font-bold text-ink">
              {currentUser.name}
            </h3>
            <p className="truncate text-[11px] text-ink-soft">{currentUser.email}</p>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {ROLE_LABEL[currentUser.role]}
            </span>
          </div>
        </div>

        <div className="my-4 border-t border-line-soft" />

        <div className="space-y-1.5">
          <button
            onClick={() => {
              onClose();
              onLock();
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition hover:bg-paper"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-warn-100 text-warn-600">
                <IcLock className="h-4 w-4" />
              </span>
              Lock Terminal
            </div>
            <kbd className="rounded border border-line bg-card px-1.5 py-0.5 font-mono text-[10.5px] text-ink-faint">
              Ctrl+L
            </kbd>
          </button>

          <button
            onClick={() => {
              onClose();
              onSwitchUser();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition hover:bg-paper"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-pine-100 text-pine-700">
              <IcSwitch className="h-4 w-4" />
            </span>
            Switch User / Cashier
          </button>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-danger-600 transition hover:bg-danger-100/50"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-danger-100 text-danger-600">
              <IcLogOut className="h-4 w-4" />
            </span>
            Log Out of POS
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Sidebar({
  view,
  setView,
  lowCount,
  today,
  onOpenProfile,
  onOpenShortcuts,
}: {
  view: View;
  setView: (v: View) => void;
  lowCount: number;
  today: Summary;
  onOpenProfile: () => void;
  onOpenShortcuts: () => void;
}) {
  const { currentUser } = useStore();

  return (
    <aside
      className="flex w-[74px] shrink-0 flex-col border-r border-pine-800 text-pine-200 lg:w-[226px]"
      style={{ background: "linear-gradient(180deg, #132a1f 0%, #0d2117 100%)" }}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-pine-800/70 px-3.5 lg:px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-marigold-500 text-pine-950 shadow-[0_6px_16px_-6px_rgba(240,163,43,0.7)]">
          <IcLogo className="h-5 w-5" />
        </span>
        <span className="hidden leading-tight lg:block">
          <span className="block font-display text-[15px] font-extrabold tracking-tight text-card">
            Ember &amp; Oat
          </span>
          <span className="block text-[9.5px] font-bold uppercase tracking-[0.22em] text-pine-300">
            Tally POS
          </span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((n) => {
          const active = view === n.view;
          const Icon = n.icon;
          return (
            <button
              key={n.view}
              onClick={() => setView(n.view)}
              title={`${n.label} (${n.keyHint})`}
              className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${
                active ? "text-pine-950" : "text-pine-200 hover:bg-pine-800/70 hover:text-card"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-lg bg-marigold-400"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              )}
              <Icon className="relative z-10 mx-auto h-[18px] w-[18px] shrink-0 lg:mx-0" />
              <span className="relative z-10 hidden flex-1 text-left lg:block">{n.label}</span>
              <kbd className={`relative z-10 hidden rounded px-1 py-0.2 text-[10px] font-mono lg:block opacity-60 ${active ? "text-pine-950 border border-pine-950/20" : "text-pine-300 border border-pine-800"}`}>
                {n.keyHint}
              </kbd>
              {n.view === "products" && lowCount > 0 && (
                <>
                  <span className="relative z-10 ml-auto hidden h-5 min-w-5 place-items-center rounded-md bg-warn-500 px-1 font-mono text-[10.5px] font-bold text-pine-950 lg:grid">
                    {lowCount}
                  </span>
                  <span className="absolute right-1.5 top-1.5 z-10 h-2 w-2 rounded-full bg-warn-500 lg:hidden" />
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 px-3 pb-4">
        {/* Quick Shortcuts Trigger Button */}
        <button
          onClick={onOpenShortcuts}
          className="flex w-full items-center gap-2 rounded-lg border border-pine-800/80 bg-pine-950/40 p-2 text-left text-pine-300 transition hover:border-marigold-500/60 hover:bg-pine-900/60 hover:text-marigold-400"
          title="View all keyboard shortcuts (Press ?)"
        >
          <IcKeyboard className="mx-auto h-4 w-4 shrink-0 lg:mx-0" />
          <span className="hidden min-w-0 flex-1 text-[11.5px] font-semibold lg:block">
            Shortcuts Guide
          </span>
          <kbd className="hidden rounded border border-pine-700 bg-pine-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-pine-200 lg:inline-block">
            ?
          </kbd>
        </button>

        <div className="hidden rounded-lg border border-pine-800 bg-pine-950/50 px-3.5 py-3 lg:block">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-pine-300">Today</p>
          <p className="mt-1 font-mono text-[19px] font-bold leading-tight text-card">
            {fmtMoney0(today.revenue)}
          </p>
          <p className="mt-0.5 text-[11px] text-pine-300">
            {today.orders} orders · {today.items} items
          </p>
        </div>

        {/* User Card with Quick Profile Menu */}
        {currentUser && (
          <button
            onClick={onOpenProfile}
            className="flex w-full items-center gap-2.5 rounded-xl border border-transparent p-1.5 text-left transition hover:border-pine-800 hover:bg-pine-900/60"
            title="Click for user menu"
          >
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-[11.5px] font-bold text-card shadow-sm"
              style={{ backgroundColor: currentUser.avatarColor || "#1d4530" }}
            >
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <span className="hidden min-w-0 flex-1 leading-tight lg:block">
              <span className="block truncate text-[12.5px] font-semibold text-card">
                {currentUser.name}
              </span>
              <span className="block truncate text-[10px] text-pine-300">
                {ROLE_LABEL[currentUser.role].split(" ")[0]} · {currentUser.shift.split("·")[0]}
              </span>
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}

function Topbar({
  view,
  now,
  onLock,
  onOpenProfile,
  onOpenShortcuts,
}: {
  view: View;
  now: Date;
  onLock: () => void;
  onOpenProfile: () => void;
  onOpenShortcuts: () => void;
}) {
  const { currentUser, isDbConnected } = useStore();
  const m = META[view];
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-card/85 px-5">
      <div className="min-w-0">
        <h1 className="font-display text-[19px] font-extrabold leading-none tracking-tight">
          {m.title}
        </h1>
        <p className="mt-1 truncate text-[11.5px] text-ink-soft">{m.sub}</p>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <span className="hidden items-center gap-2 rounded-lg border border-line bg-paper px-3 py-1.5 text-[12px] font-semibold text-ink-soft md:flex">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                isDbConnected ? "bg-moss-500" : "bg-warn-500"
              }`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isDbConnected ? "bg-moss-500" : "bg-warn-500"
              }`}
            />
          </span>
          <span>{isDbConnected ? "pos.db Live" : "Terminal Live"}</span>
        </span>

        {/* Keyboard Shortcuts Trigger */}
        <button
          onClick={onOpenShortcuts}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[12px] font-semibold text-ink-soft transition hover:border-pine-600 hover:bg-card hover:text-ink"
          title="Keyboard Shortcuts (Press ?)"
          aria-label="Keyboard Shortcuts"
        >
          <IcKeyboard className="h-4 w-4" />
          <span className="hidden lg:inline">Shortcuts</span>
          <kbd className="rounded border border-line bg-card px-1 font-mono text-[10px] text-ink-faint">
            ?
          </kbd>
        </button>

        {/* Current user pill */}
        {currentUser && (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[12px] font-semibold text-ink transition hover:border-pine-600 hover:bg-card"
          >
            <span
              className="grid h-5 w-5 place-items-center rounded-full font-display text-[10px] font-bold text-card"
              style={{ backgroundColor: currentUser.avatarColor || "#1d4530" }}
            >
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <span className="hidden sm:inline-block">{currentUser.name.split(" ")[0]}</span>
          </button>
        )}

        {/* Quick Lock Button */}
        <button
          onClick={onLock}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-paper text-ink-soft transition hover:border-warn-500/50 hover:bg-warn-100/60 hover:text-warn-600"
          title="Lock Terminal (Ctrl+L)"
          aria-label="Lock Terminal"
        >
          <IcLock className="h-4 w-4" />
        </button>

        <span className="hidden rounded-lg border border-line bg-paper px-3 py-1.5 text-[12px] font-semibold text-ink-soft md:block">
          {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>

        <span className="rounded-lg bg-pine-900 px-3 py-1.5 font-mono text-[13.5px] font-bold tabular-nums text-marigold-400">
          {now.toLocaleTimeString("en-US", { hour12: false })}
        </span>
      </div>
    </header>
  );
}

function Shell() {
  const [view, setView] = useState<View>("register");
  const [profileOpen, setProfileOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { transactions, products, currentUser, isLocked, lockTerminal, logout } = useStore();
  const now = useClock();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // Lock Terminal: Ctrl+L or Alt+L
      if ((e.ctrlKey || e.altKey) && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        lockTerminal();
        return;
      }

      // View switching: Alt+1..5 or F1..F5
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === "1") { e.preventDefault(); setView("register"); return; }
        if (e.key === "2") { e.preventDefault(); setView("dashboard"); return; }
        if (e.key === "3") { e.preventDefault(); setView("transactions"); return; }
        if (e.key === "4") { e.preventDefault(); setView("products"); return; }
        if (e.key === "5") { e.preventDefault(); setView("staff"); return; }
      }
      if (e.key === "F1") { e.preventDefault(); setView("register"); return; }
      if (e.key === "F2") { e.preventDefault(); setView("dashboard"); return; }
      if (e.key === "F3") { e.preventDefault(); setView("transactions"); return; }
      if (e.key === "F4") { e.preventDefault(); setView("products"); return; }
      if (e.key === "F5" && !e.ctrlKey) { e.preventDefault(); setView("staff"); return; }

      // Help / Shortcuts modal: ? (Shift+/) or F1 when not in input
      if (!isInput) {
        if (e.key === "?" || (e.shiftKey && e.key === "/")) {
          e.preventDefault();
          setShortcutsOpen((prev) => !prev);
          return;
        }
      }

      // Escape closes open top-level modals
      if (e.key === "Escape") {
        if (shortcutsOpen) {
          setShortcutsOpen(false);
        } else if (profileOpen) {
          setProfileOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [lockTerminal, shortcutsOpen, profileOpen]);

  const today = useMemo(() => {
    const from = dayStart(Date.now());
    return summarize(transactions.filter((t) => t.time >= from));
  }, [transactions]);

  const lowCount = products.filter((p) => p.available && p.stock <= 8).length;

  if (!currentUser || isLocked) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        view={view}
        setView={setView}
        lowCount={lowCount}
        today={today}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          view={view}
          now={now}
          onLock={lockTerminal}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
        />
        <main className="dotgrid relative min-h-0 flex-1">
          <motion.div
            key={view}
            className="h-full"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {view === "register" && <Register />}
            {view === "dashboard" && <Dashboard />}
            {view === "transactions" && <Transactions />}
            {view === "products" && <Products />}
            {view === "staff" && <StaffManagement />}
          </motion.div>
        </main>
      </div>

      <UserMenuModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onLock={lockTerminal}
        onSwitchUser={lockTerminal}
        onLogout={logout}
      />

      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

