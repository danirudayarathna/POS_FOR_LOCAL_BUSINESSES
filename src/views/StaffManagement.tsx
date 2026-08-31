import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { User, UserRole } from "../types";
import { ROLE_BADGE_STYLE, ROLE_LABEL } from "../types";
import { useStore } from "../store";
import { EmptyState, Modal, Seg, Toggle } from "../ui";
import {
  IcKeypad,
  IcPencil,
  IcPlus,
  IcSearch,
  IcShield,
  IcTrash,
  IcUsers,
  IcUser,
} from "../icons";

const inputCls =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px] font-medium outline-none transition focus:border-pine-600 focus:bg-card focus:ring-2 focus:ring-pine-600/15";

export default function StaffManagement() {
  const { users, currentUser, registerUser, updateUser, deleteUser, notify } = useStore();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resettingPin, setResettingPin] = useState<User | null>(null);
  const [newPin, setNewPin] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation for Staff view
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if (editing || creating || resettingPin || deleteConfirmId) return;

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
  }, [editing, creating, resettingPin, deleteConfirmId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (
        needle &&
        !u.name.toLowerCase().includes(needle) &&
        !u.email.toLowerCase().includes(needle) &&
        !u.shift.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [users, q, roleFilter]);

  const activeCount = users.filter((u) => u.active).length;

  const handleSavePin = () => {
    if (!resettingPin) return;
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      notify("danger", "PIN must be exactly 4 digits.");
      return;
    }
    updateUser({
      ...resettingPin,
      pin: newPin,
    });
    notify("success", `PIN updated for ${resettingPin.name}.`);
    setResettingPin(null);
    setNewPin("");
  };

  return (
    <div className="h-full overflow-y-auto scroll-slim">
      <div className="mx-auto max-w-[1150px] space-y-4 p-5">
        {/* Header Controls */}
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
              placeholder="Search staff name or email (/)"
              className="w-full rounded-lg border border-line bg-card py-2 pl-9 pr-10 text-[13.5px] font-medium outline-none transition focus:border-pine-600 focus:ring-2 focus:ring-pine-600/15"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
              /
            </kbd>
          </div>

          <Seg<"all" | UserRole>
            id="staff-role-seg"
            size="sm"
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: "all", label: "All Roles" },
              { value: "admin", label: "Admin" },
              { value: "manager", label: "Manager" },
              { value: "cashier", label: "Cashier" },
              { value: "barista", label: "Barista" },
            ]}
          />

          <span className="ml-auto font-mono text-[11.5px] text-ink-soft">
            {users.length} staff members · {activeCount} active
          </span>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setCreating(true)}
            title="Add staff member (Alt+N)"
            className="flex items-center gap-1.5 rounded-lg bg-marigold-500 px-3.5 py-2 text-[13px] font-extrabold text-pine-950 shadow-[0_8px_20px_-10px_rgba(217,138,16,0.9)] transition-colors hover:bg-marigold-400"
          >
            <IcPlus className="h-4 w-4" />
            <span>Add Staff</span>
            <kbd className="rounded bg-pine-950/15 px-1 py-0.5 font-mono text-[10px]">
              Alt+N
            </kbd>
          </motion.button>
        </motion.div>

        {/* Staff Table */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<IcUsers className="h-5 w-5" />}
            title="No staff members found"
            sub="Try a different search or click Add Staff Member to onboard a new employee."
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
                    <th className="px-4 py-3 font-bold">Staff Member</th>
                    <th className="px-3 py-3 font-bold">Role</th>
                    <th className="px-3 py-3 font-bold">Assigned Shift</th>
                    <th className="px-3 py-3 font-bold">Passcode</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => {
                    const badge = ROLE_BADGE_STYLE[u.role];
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        className={`border-b border-line-soft transition-colors last:border-0 hover:bg-paper/80 ${
                          !u.active ? "opacity-55" : ""
                        }`}
                      >
                        {/* Name & Initials */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-[12px] font-bold text-card"
                              style={{ backgroundColor: u.avatarColor || "#1d4530" }}
                            >
                              {u.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                            <div className="min-w-0">
                              <span className="flex items-center gap-1.5 font-semibold text-ink">
                                {u.name}
                                {isSelf && (
                                  <span className="rounded bg-marigold-100 px-1.5 py-0.5 text-[9.5px] font-bold text-marigold-600">
                                    You
                                  </span>
                                )}
                              </span>
                              <span className="block font-mono text-[11px] text-ink-faint">
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role badge */}
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${badge.bg} ${badge.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                            {ROLE_LABEL[u.role]}
                          </span>
                        </td>

                        {/* Shift */}
                        <td className="px-3 py-3 text-[12.5px] font-medium text-ink-soft">
                          {u.shift}
                        </td>

                        {/* PIN */}
                        <td className="px-3 py-3">
                          <button
                            onClick={() => {
                              setResettingPin(u);
                              setNewPin("");
                            }}
                            className="group flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 font-mono text-[11.5px] font-bold text-ink-soft transition hover:border-pine-600 hover:text-pine-700"
                            title="Click to reset PIN"
                          >
                            <IcKeypad className="h-3 w-3 text-ink-faint group-hover:text-pine-600" />
                            ••••
                            <span className="text-[10px] text-ink-faint">({u.pin})</span>
                          </button>
                        </td>

                        {/* Active toggle */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Toggle
                              on={u.active}
                              label={`Toggle active state for ${u.name}`}
                              onChange={() => {
                                updateUser({ ...u, active: !u.active });
                                notify(
                                  "info",
                                  u.active
                                    ? `${u.name} deactivated.`
                                    : `${u.name} reactivated.`,
                                );
                              }}
                            />
                            <span
                              className={`text-[11px] font-bold ${
                                u.active ? "text-moss-600" : "text-ink-faint"
                              }`}
                            >
                              {u.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditing(u)}
                              className="grid h-7 w-7 place-items-center rounded-md border border-line text-ink-soft transition-colors hover:border-pine-600/50 hover:bg-pine-100/60 hover:text-pine-700"
                              title="Edit details"
                              aria-label={`Edit ${u.name}`}
                            >
                              <IcPencil className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteConfirmId(u.id)}
                              disabled={isSelf || users.length <= 1}
                              className="grid h-7 w-7 place-items-center rounded-md border border-line text-ink-soft transition-colors hover:border-danger-500/50 hover:bg-danger-100/60 hover:text-danger-600 disabled:pointer-events-none disabled:opacity-30"
                              title="Remove staff member"
                              aria-label={`Delete ${u.name}`}
                            >
                              <IcTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
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

      {/* Add / Edit Staff Modal */}
      <StaffFormModal
        open={creating || !!editing}
        initial={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={(data) => {
          if (editing) {
            updateUser({
              ...editing,
              ...data,
            });
            notify("success", `Updated details for ${data.name}.`);
          } else {
            registerUser({
              ...data,
              active: true,
            });
          }
          setCreating(false);
          setEditing(null);
        }}
      />

      {/* Reset PIN Modal */}
      <Modal open={!!resettingPin} onClose={() => setResettingPin(null)} w="max-w-sm">
        {resettingPin && (
          <div className="rounded-xl bg-card p-5 shadow-[0_30px_70px_-24px_rgba(11,28,20,0.65)]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine-100 text-pine-700">
              <IcKeypad className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-display text-[18px] font-extrabold tracking-tight">
              Reset Passcode for {resettingPin.name}
            </h3>
            <p className="mt-1 text-[12.5px] text-ink-soft">
              Enter a new 4-digit PIN for this staff member to unlock the terminal.
            </p>

            <div className="mt-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                New 4-Digit Passcode
              </label>
              <input
                type="text"
                maxLength={4}
                autoFocus
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 5678"
                className="mt-1 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 font-mono text-[16px] font-bold tracking-widest text-ink outline-none transition focus:border-pine-600 focus:bg-card focus:ring-2 focus:ring-pine-600/15"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setResettingPin(null)}
                className="flex-1 rounded-lg border border-line bg-paper py-2.5 text-[13px] font-bold transition hover:bg-line-soft"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePin}
                disabled={newPin.length !== 4}
                className="flex-1 rounded-lg bg-pine-800 py-2.5 text-[13px] font-bold text-card transition hover:bg-pine-700 disabled:pointer-events-none disabled:opacity-35"
              >
                Update PIN
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} w="max-w-sm">
        {deleteConfirmId && (
          <div className="rounded-xl bg-card p-5 shadow-[0_30px_70px_-24px_rgba(11,28,20,0.65)]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-danger-100 text-danger-600">
              <IcTrash className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-display text-[18px] font-extrabold tracking-tight text-ink">
              Remove Staff Member?
            </h3>
            <p className="mt-1 text-[13px] text-ink-soft">
              This staff member will no longer have access to this POS terminal.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-lg border border-line bg-paper py-2.5 text-[13px] font-bold transition hover:bg-line-soft"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteUser(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 rounded-lg bg-danger-500 py-2.5 text-[13px] font-bold text-card transition hover:bg-danger-600"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ================= Staff Form Modal ================= */

function StaffFormModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: User | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    email: string;
    pin: string;
    role: UserRole;
    shift: string;
    avatarColor?: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<UserRole>("cashier");
  const [shift, setShift] = useState("Shift 1 · Morning Rush");
  const [err, setErr] = useState("");

  const handleOpen = () => {
    if (initial) {
      setName(initial.name);
      setEmail(initial.email);
      setPin(initial.pin);
      setRole(initial.role);
      setShift(initial.shift);
      setErr("");
    } else {
      setName("");
      setEmail("");
      setPin("");
      setRole("cashier");
      setShift("Shift 1 · Morning Rush");
      setErr("");
    }
  };

  const handleSave = () => {
    if (!name.trim()) return setErr("Please enter staff member's name.");
    if (!email.trim()) return setErr("Please enter email address.");
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return setErr("Passcode must be exactly 4 digits.");
    }

    const color =
      role === "admin"
        ? "#cd4f38"
        : role === "manager"
          ? "#1d4530"
          : role === "cashier"
            ? "#2e9e62"
            : "#f0a32b";

    onSave({
      name: name.trim(),
      email: email.trim(),
      pin: pin.trim(),
      role,
      shift,
      avatarColor: color,
    });
  };

  useEffect(() => {
    if (!open) return;
    const handleModalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleModalKey);
    return () => window.removeEventListener("keydown", handleModalKey);
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      w="max-w-md"
    >
      <div
        onAnimationStart={handleOpen}
        className="rounded-xl bg-card p-5 shadow-[0_30px_70px_-24px_rgba(11,28,20,0.65)]"
      >
        <h3 className="font-display text-[18px] font-extrabold tracking-tight">
          {initial ? `Edit ${initial.name}` : "Add New Staff Member"}
        </h3>
        <p className="mt-0.5 text-[12px] text-ink-soft">
          {initial ? "Update staff member role & shift" : "Grant access to the register and terminal"}
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
              Full Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="e.g. Kasun Perera"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="kasun@emberandoat.lk"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                4-Digit Passcode
              </span>
              <input
                type="text"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className={`${inputCls} font-mono font-bold`}
                placeholder="4321"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                Role
              </span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className={inputCls}
              >
                <option value="barista">Barista</option>
                <option value="cashier">Cashier</option>
                <option value="manager">Shift Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                Shift
              </span>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className={inputCls}
              >
                <option value="Shift 1 · Morning Rush">Shift 1 · Morning Rush</option>
                <option value="Shift 2 · Midday & Close">Shift 2 · Midday & Close</option>
                <option value="Shift 3 · Weekend Special">Shift 3 · Weekend Special</option>
                <option value="All Shifts · Floater">All Shifts · Floater</option>
              </select>
            </label>
          </div>

          {err && <p className="text-[12px] font-semibold text-danger-600">{err}</p>}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-line bg-paper py-2.5 text-[13px] font-bold transition hover:bg-line-soft"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="flex-1 rounded-lg bg-pine-800 py-2.5 text-[13px] font-bold text-card transition hover:bg-pine-700"
          >
            {initial ? "Save Changes" : "Create Staff Member"}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}
