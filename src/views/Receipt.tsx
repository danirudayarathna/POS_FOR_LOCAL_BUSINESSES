import type { Txn } from "../types";
import { METHOD_LABEL } from "../types";
import { fmtClockShort, fmtDay, fmtMoney } from "../data";
import { useStore } from "../store";
import { Barcode } from "../ui";
import { IcLogo, IcPrint } from "../icons";

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-neutral-500">{k}</span>
      <span className={`text-right ${bold ? "font-bold text-neutral-900" : "text-neutral-800"}`}>{v}</span>
    </div>
  );
}

export function ReceiptBody({ txn }: { txn: Txn }) {
  return (
    <div>
      <div className="zz-top" />
      <div className="relative bg-white px-5 pb-5 pt-4 font-mono text-[12px] leading-relaxed text-neutral-800">
        {txn.status === "refunded" && (
          <span className="absolute right-4 top-20 z-10 -rotate-12 rounded border-2 border-danger-500 px-2 py-0.5 text-[11px] font-bold tracking-[0.2em] text-danger-500 opacity-80">
            REFUNDED
          </span>
        )}

        <div className="text-center">
          <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-pine-900 text-marigold-500">
            <IcLogo className="h-5 w-5" />
          </span>
          <p className="mt-1.5 font-display text-[17px] font-extrabold tracking-tight text-neutral-900">
            EMBER &amp; OAT
          </p>
          <p className="text-[10.5px] text-neutral-500">42 Galle Road · Colombo 03, Sri Lanka</p>
        </div>

        <div className="my-2.5 border-t border-dashed border-neutral-300" />

        <div className="space-y-0.5">
          <Row k="Receipt" v={txn.id} bold />
          <Row k="Date" v={`${fmtDay(txn.time)} · ${fmtClockShort(txn.time)}`} />
          <Row k="Served by" v={txn.cashierName || "Kasun P."} />
          <Row k="Payment" v={METHOD_LABEL[txn.method]} />
        </div>

        <div className="my-2.5 border-t border-dashed border-neutral-300" />

        <div className="space-y-1">
          {txn.lines.map((l, i) => (
            <div key={i} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                {l.qty} × {l.name}
              </span>
              <span className="shrink-0">{fmtMoney(l.price * l.qty)}</span>
            </div>
          ))}
        </div>

        <div className="my-2.5 border-t border-dashed border-neutral-300" />

        <div className="space-y-0.5">
          <Row k="Subtotal" v={fmtMoney(txn.subtotal)} />
          {txn.discount > 0 && <Row k="Discount" v={`−${fmtMoney(txn.discount)}`} />}
          <Row k="Tax 8.5%" v={fmtMoney(txn.tax)} />
        </div>

        <div className="mt-2 flex justify-between border-t-2 border-neutral-900 pt-1.5 text-[14px] font-bold text-neutral-900">
          <span>TOTAL</span>
          <span>{fmtMoney(txn.total)}</span>
        </div>

        {txn.tendered !== undefined && txn.change !== undefined && (
          <div className="mt-1.5 space-y-0.5">
            <Row k="Cash tendered" v={fmtMoney(txn.tendered)} />
            <Row k="Change" v={fmtMoney(txn.change)} bold />
          </div>
        )}

        <div className="my-2.5 border-t border-dashed border-neutral-300" />

        <Barcode value={txn.id} className="mx-auto h-9 w-44 text-neutral-900" />
        <p className="mt-1 text-center text-[10.5px] tracking-[0.2em] text-neutral-500">{txn.id}</p>
        <p className="mt-2 text-center text-[11px] text-neutral-700">
          {Math.floor(txn.total * 10)} loyalty points earned
        </p>
        <p className="mt-2 text-center text-[11.5px]">Thanks — see you tomorrow</p>
        <p className="mt-1 text-center text-[9.5px] text-neutral-400">Powered by Tally POS</p>
      </div>
      <div className="zz-bot" />
    </div>
  );
}

export function ReceiptPanel({ txn, onClose }: { txn: Txn; onClose: () => void }) {
  const { notify } = useStore();
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-[0_30px_70px_-24px_rgba(11,28,20,0.65)]">
      <ReceiptBody txn={txn} />
      <div className="flex gap-2 border-t border-line bg-card p-3">
        <button
          onClick={() => notify("info", `Receipt ${txn.id} sent to the counter printer`)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-paper py-2.5 text-[13px] font-bold text-ink transition-colors hover:border-pine-600/50 hover:bg-pine-100/60"
        >
          <IcPrint className="h-4 w-4" />
          Print
        </button>
        <button
          onClick={onClose}
          className="flex-1 rounded-lg bg-pine-800 py-2.5 text-[13px] font-bold text-card transition-colors hover:bg-pine-700"
        >
          Done
        </button>
      </div>
    </div>
  );
}
