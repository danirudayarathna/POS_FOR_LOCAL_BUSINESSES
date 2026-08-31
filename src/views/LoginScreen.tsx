import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { User, UserRole } from "../types";
import { ROLE_BADGE_STYLE, ROLE_LABEL } from "../types";
import { useStore } from "../store";
import {
  IcEye,
  IcEyeOff,
  IcKeypad,
  IcLock,
  IcLogo,
  IcPlus,
  IcShield,
  IcUser,
  IcUsers,
} from "../icons";

type LoginMode = "pin" | "email" | "register";

export default function LoginScreen() {
  const {
    users,
    currentUser,
    isLocked,
    loginWithPin,
    loginWithEmail,
    registerUser,
    unlockTerminal,
  } = useStore();

  const [mode, setMode] = useState<LoginMode>("pin");
  const [selectedUser, setSelectedUser] = useState<User | null>(() => currentUser ?? users[0] ?? null);
  const [pin, setPin] = useState<string>("");
  const [pinError, setPinError] = useState<boolean>(false);
  const [shakeKey, setShakeKey] = useState<number>(0);

  // Email form state
  const [email, setEmail] = useState("");
  const [emailPin, setEmailPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("cashier");
  const [regPin, setRegPin] = useState("");
  const [regShift, setRegShift] = useState("Shift 1 · Morning Rush");
  const [regError, setRegError] = useState("");

  // Update selected user when users change
  useEffect(() => {
    if (!selectedUser && users.length > 0) {
      setSelectedUser(currentUser ?? users[0]);
    }
  }, [users, currentUser, selectedUser]);

  // Physical keyboard listener for PIN entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== "pin") return;
      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, pin, selectedUser]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setPinError(false);

    if (nextPin.length === 4) {
      submitPin(nextPin);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleClear = () => {
    setPin("");
    setPinError(false);
  };

  const submitPin = (pinToSubmit: string) => {
    if (isLocked && currentUser && (!selectedUser || selectedUser.id === currentUser.id)) {
      const ok = unlockTerminal(pinToSubmit);
      if (!ok) {
        setPinError(true);
        setShakeKey((k) => k + 1);
        setPin("");
      }
    } else if (selectedUser) {
      const ok = loginWithPin(selectedUser.id, pinToSubmit);
      if (!ok) {
        setPinError(true);
        setShakeKey((k) => k + 1);
        setPin("");
      }
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !emailPin) return;
    loginWithEmail(email, emailPin);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setRegError("Please enter staff member's name.");
      return;
    }
    if (!regEmail.trim()) {
      setRegError("Please enter email address.");
      return;
    }
    if (regPin.length !== 4 || !/^\d{4}$/.test(regPin)) {
      setRegError("Passcode must be exactly 4 numeric digits.");
      return;
    }

    const newUser = registerUser({
      name: regName.trim(),
      email: regEmail.trim(),
      pin: regPin.trim(),
      role: regRole,
      shift: regShift,
      avatarColor:
        regRole === "admin"
          ? "#cd4f38"
          : regRole === "manager"
            ? "#1d4530"
            : regRole === "cashier"
              ? "#2e9e62"
              : "#f0a32b",
      active: true,
    });

    setSelectedUser(newUser);
    setMode("pin");
    setPin("");
    setRegName("");
    setRegEmail("");
    setRegPin("");
    setRegError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen bg-pine-950 text-paper antialiased">
      {/* Background aesthetic glow effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(240, 163, 43, 0.15), transparent), radial-gradient(circle 35% at 85% 85%, rgba(46, 158, 98, 0.08), transparent)",
        }}
      />

      {/* Main card container */}
      <div className="relative z-10 m-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-pine-800 bg-[#0e2419]/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl md:flex-row">
        {/* Left branding & staff column */}
        <div className="flex flex-col justify-between border-b border-pine-800/80 bg-gradient-to-b from-[#132d20] to-[#0b1c14] p-6 md:w-[340px] md:border-b-0 md:border-r">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-marigold-500 text-pine-950 shadow-[0_6px_20px_-6px_rgba(240,163,43,0.7)]">
                <IcLogo className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-[18px] font-extrabold tracking-tight text-card">
                  Ember &amp; Oat
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-pine-300">
                  Tally POS · Terminal 01
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-pine-300">
                {isLocked ? "Terminal Status" : "Active Roster"}
              </p>

              {isLocked && (
                <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-warn-500/30 bg-warn-500/10 px-3.5 py-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-warn-500/20 text-warn-400">
                    <IcLock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-bold text-warn-400">Terminal Locked</p>
                    <p className="text-[11px] text-pine-300">Enter PIN to resume shift</p>
                  </div>
                </div>
              )}

              {/* Staff quick selector cards */}
              <div className="mt-3 space-y-2">
                {users.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const badge = ROLE_BADGE_STYLE[u.role];
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setSelectedUser(u);
                        setMode("pin");
                        setPin("");
                        setPinError(false);
                      }}
                      className={`group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all ${
                        isSelected && mode === "pin"
                          ? "bg-pine-800 border border-marigold-500/40 shadow-sm"
                          : "border border-transparent hover:bg-pine-900/60"
                      }`}
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-[12px] font-bold text-card shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: u.avatarColor || "#1d4530" }}
                      >
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-card">{u.name}</p>
                        <p className="truncate text-[10.5px] text-pine-300">{u.shift}</p>
                      </div>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text}`}
                      >
                        {ROLE_LABEL[u.role].split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Demo logins banner */}
          <div className="mt-6 rounded-xl border border-pine-800 bg-pine-900/40 p-3">
            <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-marigold-400">
              <IcShield className="h-3.5 w-3.5" />
              Demo Quick Logins
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                onClick={() => {
                  const u = users.find((x) => x.id === "u-kasun") ?? users[0];
                  setSelectedUser(u);
                  loginWithPin(u.id, u.pin);
                }}
                className="rounded-lg bg-pine-800/80 px-2 py-1 text-left font-medium text-pine-200 transition hover:bg-marigold-500 hover:text-pine-950"
              >
                Kasun <span className="font-mono text-[10px] opacity-75">(1234)</span>
              </button>
              <button
                onClick={() => {
                  const u = users.find((x) => x.id === "u-nuwan") ?? users[1];
                  if (u) {
                    setSelectedUser(u);
                    loginWithPin(u.id, u.pin);
                  }
                }}
                className="rounded-lg bg-pine-800/80 px-2 py-1 text-left font-medium text-pine-200 transition hover:bg-marigold-500 hover:text-pine-950"
              >
                Nuwan <span className="font-mono text-[10px] opacity-75">(2468)</span>
              </button>
              <button
                onClick={() => {
                  const u = users.find((x) => x.id === "u-dilshan") ?? users[2];
                  if (u) {
                    setSelectedUser(u);
                    loginWithPin(u.id, u.pin);
                  }
                }}
                className="rounded-lg bg-pine-800/80 px-2 py-1 text-left font-medium text-pine-200 transition hover:bg-marigold-500 hover:text-pine-950"
              >
                Dilshan <span className="font-mono text-[10px] opacity-75">(9999)</span>
              </button>
              <button
                onClick={() => {
                  const u = users.find((x) => x.id === "u-tharushi") ?? users[3];
                  if (u) {
                    setSelectedUser(u);
                    loginWithPin(u.id, u.pin);
                  }
                }}
                className="rounded-lg bg-pine-800/80 px-2 py-1 text-left font-medium text-pine-200 transition hover:bg-marigold-500 hover:text-pine-950"
              >
                Tharushi <span className="font-mono text-[10px] opacity-75">(5555)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right authentication interaction panel */}
        <div className="flex flex-1 flex-col p-6 sm:p-8">
          {/* Top mode tabs */}
          <div className="flex items-center justify-between border-b border-pine-800/80 pb-4">
            <div className="inline-flex rounded-xl border border-pine-800 bg-pine-950/70 p-1">
              <button
                onClick={() => {
                  setMode("pin");
                  setPin("");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition ${
                  mode === "pin"
                    ? "bg-marigold-500 text-pine-950 shadow-sm"
                    : "text-pine-200 hover:text-card"
                }`}
              >
                <IcKeypad className="h-3.5 w-3.5" />
                PIN Passcode
              </button>
              <button
                onClick={() => setMode("email")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition ${
                  mode === "email"
                    ? "bg-marigold-500 text-pine-950 shadow-sm"
                    : "text-pine-200 hover:text-card"
                }`}
              >
                <IcUser className="h-3.5 w-3.5" />
                Email Login
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition ${
                  mode === "register"
                    ? "bg-marigold-500 text-pine-950 shadow-sm"
                    : "text-pine-200 hover:text-card"
                }`}
              >
                <IcPlus className="h-3.5 w-3.5" />
                Add Staff
              </button>
            </div>

            <span className="hidden font-mono text-[11px] text-pine-300 sm:inline-block">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>

          {/* Mode 1: Quick PIN Pad */}
          {mode === "pin" && selectedUser && (
            <div className="flex flex-1 flex-col items-center justify-center py-4">
              <div className="text-center">
                <span
                  className="mx-auto grid h-14 w-14 place-items-center rounded-2xl font-display text-[18px] font-bold text-card shadow-lg"
                  style={{ backgroundColor: selectedUser.avatarColor || "#1d4530" }}
                >
                  {selectedUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <h2 className="mt-2.5 font-display text-[18px] font-extrabold text-card">
                  {selectedUser.name}
                </h2>
                <p className="text-[12px] text-pine-300">
                  {ROLE_LABEL[selectedUser.role]} · Enter 4-digit PIN
                </p>
              </div>

              {/* 4 Animated PIN Dots */}
              <motion.div
                key={shakeKey}
                animate={shakeKey ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="my-5 flex items-center justify-center gap-3.5"
              >
                {[0, 1, 2, 3].map((i) => {
                  const filled = pin.length > i;
                  return (
                    <motion.div
                      key={i}
                      animate={filled ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                      className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
                        pinError
                          ? "border-danger-500 bg-danger-500/30"
                          : filled
                            ? "border-marigold-400 bg-marigold-400 shadow-[0_0_12px_rgba(246,185,85,0.6)]"
                            : "border-pine-700 bg-pine-950"
                      }`}
                    />
                  );
                })}
              </motion.div>

              {pinError && (
                <p className="mb-2 text-[12px] font-semibold text-danger-400">
                  Invalid Passcode. Please try again.
                </p>
              )}

              {/* Tactile 3x4 Touch Numeric Keypad */}
              <div className="grid w-[260px] grid-cols-3 gap-2.5">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                  <motion.button
                    key={digit}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleDigit(digit)}
                    className="flex h-12 items-center justify-center rounded-xl border border-pine-800 bg-pine-900/60 font-display text-[20px] font-bold text-card shadow-sm transition hover:border-marigold-500/40 hover:bg-pine-800 active:bg-marigold-500 active:text-pine-950"
                  >
                    {digit}
                  </motion.button>
                ))}

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleClear}
                  className="flex h-12 items-center justify-center rounded-xl border border-pine-800 bg-pine-950/80 text-[12px] font-bold uppercase tracking-wider text-pine-300 transition hover:border-danger-500/40 hover:bg-danger-500/20 hover:text-danger-400"
                >
                  Clear
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleDigit("0")}
                  className="flex h-12 items-center justify-center rounded-xl border border-pine-800 bg-pine-900/60 font-display text-[20px] font-bold text-card shadow-sm transition hover:border-marigold-500/40 hover:bg-pine-800 active:bg-marigold-500 active:text-pine-950"
                >
                  0
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleBackspace}
                  className="flex h-12 items-center justify-center rounded-xl border border-pine-800 bg-pine-950/80 text-[16px] font-bold text-pine-300 transition hover:border-pine-700 hover:bg-pine-800 hover:text-card"
                  aria-label="Backspace"
                >
                  ⌫
                </motion.button>
              </div>

              <p className="mt-3 text-[11px] text-pine-400">
                You can also type your PIN directly on the keyboard
              </p>
            </div>
          )}

          {/* Mode 2: Email & Password Sign In */}
          {mode === "email" && (
            <form onSubmit={handleEmailSubmit} className="my-auto max-w-sm py-4">
              <h2 className="font-display text-[18px] font-extrabold text-card">
                Sign In with Credentials
              </h2>
              <p className="mt-0.5 text-[12.5px] text-pine-300">
                Log into terminal management or reset access
              </p>

              <div className="mt-5 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-pine-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kasun@emberandoat.lk"
                    className="mt-1 w-full rounded-xl border border-pine-800 bg-pine-900/80 px-3.5 py-2.5 text-[13.5px] text-card outline-none transition focus:border-marigold-500 focus:ring-2 focus:ring-marigold-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-pine-300">
                    4-Digit Passcode / PIN
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      maxLength={8}
                      value={emailPin}
                      onChange={(e) => setEmailPin(e.target.value)}
                      placeholder="••••"
                      className="w-full rounded-xl border border-pine-800 bg-pine-900/80 px-3.5 py-2.5 pr-10 font-mono text-[14px] text-card outline-none transition focus:border-marigold-500 focus:ring-2 focus:ring-marigold-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-pine-400 hover:text-card"
                    >
                      {showPassword ? (
                        <IcEyeOff className="h-4 w-4" />
                      ) : (
                        <IcEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="mt-2 w-full rounded-xl bg-marigold-500 py-3 font-display text-[14.5px] font-extrabold text-pine-950 shadow-md transition hover:bg-marigold-400"
                >
                  Sign In to Terminal
                </motion.button>
              </div>
            </form>
          )}

          {/* Mode 3: Register New User / Staff */}
          {mode === "register" && (
            <form
              onSubmit={handleRegisterSubmit}
              className="my-auto max-h-[460px] overflow-y-auto pr-1 scroll-slim"
            >
              <h2 className="font-display text-[18px] font-extrabold text-card">
                Register New Staff Member
              </h2>
              <p className="mt-0.5 text-[12px] text-pine-300">
                Add a new team member with immediate POS access
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-pine-300">
                    Full Name
                  </label>
                  <input
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Kasun Perera"
                    className="mt-1 w-full rounded-xl border border-pine-800 bg-pine-900/80 px-3.5 py-2 text-[13.5px] text-card outline-none transition focus:border-marigold-500 focus:ring-2 focus:ring-marigold-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-pine-300">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="kasun@emberandoat.lk"
                      className="mt-1 w-full rounded-xl border border-pine-800 bg-pine-900/80 px-3.5 py-2 text-[13px] text-card outline-none transition focus:border-marigold-500 focus:ring-2 focus:ring-marigold-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-pine-300">
                      4-Digit Passcode
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 7788"
                      className="mt-1 w-full rounded-xl border border-pine-800 bg-pine-900/80 px-3.5 py-2 font-mono text-[13px] text-card outline-none transition focus:border-marigold-500 focus:ring-2 focus:ring-marigold-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-pine-300">
                      Role
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="mt-1 w-full rounded-xl border border-pine-800 bg-pine-900/80 px-3 py-2 text-[13px] text-card outline-none transition focus:border-marigold-500"
                    >
                      <option value="barista">Barista</option>
                      <option value="cashier">Cashier</option>
                      <option value="manager">Shift Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-pine-300">
                      Shift Assignment
                    </label>
                    <select
                      value={regShift}
                      onChange={(e) => setRegShift(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-pine-800 bg-pine-900/80 px-3 py-2 text-[13px] text-card outline-none transition focus:border-marigold-500"
                    >
                      <option value="Shift 1 · Morning Rush">Shift 1 · Morning Rush</option>
                      <option value="Shift 2 · Midday & Close">Shift 2 · Midday & Close</option>
                      <option value="Shift 3 · Weekend Special">Shift 3 · Weekend Special</option>
                      <option value="All Shifts · Floater">All Shifts · Floater</option>
                    </select>
                  </div>
                </div>

                {regError && (
                  <p className="text-[12px] font-semibold text-danger-400">{regError}</p>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="mt-2 w-full rounded-xl bg-marigold-500 py-2.5 font-display text-[14px] font-extrabold text-pine-950 shadow-md transition hover:bg-marigold-400"
                >
                  Create &amp; Register Staff Member
                </motion.button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
