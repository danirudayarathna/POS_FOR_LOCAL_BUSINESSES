import { Modal } from "../ui";
import { IcKeyboard, IcX } from "../icons";

interface ShortcutItem {
  keys: string[];
  description: string;
  badge?: string;
}

interface ShortcutSection {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: "Global Navigation",
    items: [
      { keys: ["Alt", "1"], description: "Switch to Register (Cashier View)", badge: "F1" },
      { keys: ["Alt", "2"], description: "Switch to Dashboard & Metrics", badge: "F2" },
      { keys: ["Alt", "3"], description: "Switch to Order History & Receipts", badge: "F3" },
      { keys: ["Alt", "4"], description: "Switch to Product Catalog", badge: "F4" },
      { keys: ["Alt", "5"], description: "Switch to Staff & Roster", badge: "F5" },
      { keys: ["Ctrl", "L"], description: "Instantly Lock POS Terminal" },
      { keys: ["?"], description: "Open / Close this shortcuts guide", badge: "Shift+/" },
      { keys: ["Esc"], description: "Close any modal / Clear search" },
    ],
  },
  {
    title: "Register & Counter Ordering",
    items: [
      { keys: ["/"], description: "Focus Menu Search input", badge: "Ctrl+K" },
      { keys: ["↑", "↓", "←", "→"], description: "Navigate highlighted menu items" },
      { keys: ["Enter"], description: "Add highlighted item to current order" },
      { keys: ["[" , "]"], description: "Cycle previous / next category" },
      { keys: ["Alt", "A/E/B/K/R"], description: "Jump directly to category (All, Espresso, Brew...)" },
      { keys: ["Alt", "D"], description: "Focus discount code input" },
      { keys: ["Alt", "X"], description: "Clear current order", badge: "Ctrl+Del" },
      { keys: ["F9"], description: "Proceed to Charge & Payment", badge: "Ctrl+Enter" },
    ],
  },
  {
    title: "Checkout & Tender Flow",
    items: [
      { keys: ["1", "or", "C"], description: "Select Card Payment method" },
      { keys: ["2", "or", "S"], description: "Select Cash Payment method" },
      { keys: ["3", "or", "M"], description: "Select Mobile / QR Wallet" },
      { keys: ["E"], description: "Tender exact amount (Cash mode)" },
      { keys: ["1", "–", "5"], description: "Quick cash notes (Rs. 100, 500, 1k, 2k, 5k)" },
      { keys: ["Enter"], description: "Complete sale / Confirm tender" },
      { keys: ["Enter", "or", "Space"], description: "Start New Sale (on success)" },
      { keys: ["P", "or", "V"], description: "View & print receipt (on success)" },
    ],
  },
  {
    title: "Products & Staff Views",
    items: [
      { keys: ["/"], description: "Focus search query" },
      { keys: ["Alt", "N"], description: "Add new product / Add staff member" },
      { keys: ["Ctrl", "Enter"], description: "Submit & save modal form" },
      { keys: ["Esc"], description: "Dismiss modal without saving" },
    ],
  },
];

export function KeyboardShortcutsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} w="max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_30px_70px_-24px_rgba(11,28,20,0.7)]">
        {/* Modal Header */}
        <header className="flex items-center justify-between border-b border-line bg-paper/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine-900 text-marigold-400 shadow-sm">
              <IcKeyboard className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-[18px] font-extrabold tracking-tight text-ink">
                Keyboard Shortcuts &amp; Navigation
              </h2>
              <p className="text-[12px] text-ink-soft">
                Speed up counter sales, item selection, and cashier operations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-paper hover:text-ink"
            aria-label="Close shortcuts modal"
          >
            <IcX className="h-4 w-4" />
          </button>
        </header>

        {/* Shortcuts Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6 scroll-slim">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {SHORTCUT_SECTIONS.map((sec) => (
              <div
                key={sec.title}
                className="rounded-xl border border-line/80 bg-paper/40 p-4"
              >
                <h3 className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-pine-700">
                  {sec.title}
                </h3>
                <div className="mt-3 space-y-2">
                  {sec.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 text-[12.5px]"
                    >
                      <span className="text-ink-soft leading-tight">{item.description}</span>
                      <div className="flex shrink-0 items-center gap-1">
                        {item.keys.map((k, ki) =>
                          k === "or" || k === "–" ? (
                            <span key={ki} className="text-[10px] text-ink-faint px-0.5">
                              {k}
                            </span>
                          ) : (
                            <kbd
                              key={ki}
                              className="inline-grid min-w-[20px] place-items-center rounded border border-line bg-card px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
                            >
                              {k}
                            </kbd>
                          ),
                        )}
                        {item.badge && (
                          <span className="ml-1 rounded bg-pine-100 px-1 py-0.5 font-mono text-[9.5px] font-semibold text-pine-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-marigold-300/50 bg-marigold-50/70 p-3 text-[12px] text-marigold-950 flex items-center justify-between">
            <span>
              💡 <strong>Pro Tip:</strong> Press <kbd className="rounded border border-marigold-300 bg-card px-1 py-0.5 font-mono text-[11px] font-bold">?</kbd> anywhere outside text boxes to toggle this cheatsheet anytime.
            </span>
            <span className="font-mono text-[11px] font-bold opacity-75">Tally POS v2.4</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
