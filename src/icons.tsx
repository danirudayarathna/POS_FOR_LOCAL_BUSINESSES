import type { SVGProps } from "react";
import type { Category } from "./types";

type P = SVGProps<SVGSVGElement>;

const base: P = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const IcLogo = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2.6c1.9 3.2 5.6 5.6 5.6 10.2a5.6 5.6 0 0 1-11.2 0c0-2 .7-3.9 1.9-5.6.4 1.3 1.1 2.2 2.3 2.7-.5-2.6.2-5.3 1.4-7.3Z" />
  </svg>
);

export const IcTill = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5.2 9.5h13.6l1.1 9.4a1.2 1.2 0 0 1-1.2 1.3H5.3a1.2 1.2 0 0 1-1.2-1.3l1.1-9.4Z" />
    <path d="M8.2 9.5V6A1.5 1.5 0 0 1 9.7 4.5h4.6A1.5 1.5 0 0 1 15.8 6v3.5" />
    <path d="M8.7 13.2h6.6M8.7 16.4h4" />
  </svg>
);

export const IcChart = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 20h16" />
    <path d="M6.5 20v-6M11 20V8.5M15.5 20V5.5M20 20v-9" />
  </svg>
);

export const IcReceipt = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 3.5h12V20l-2-1.3-2 1.3-2-1.3L10 20l-2-1.3L6 20V3.5Z" />
    <path d="M9 8.5h6M9 12h6" />
  </svg>
);

export const IcBox = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
    <path d="m4 7 8 4 8-4" />
    <path d="M12 11v10" />
  </svg>
);

export const IcSearch = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const IcPlus = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IcMinus = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
);

export const IcTrash = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h16" />
    <path d="M9.5 7V5.4A1.4 1.4 0 0 1 10.9 4h2.2a1.4 1.4 0 0 1 1.4 1.4V7" />
    <path d="m6.5 7 .9 11.6a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const IcX = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const IcCheck = (p: P) => (
  <svg {...base} {...p}>
    <path d="m5 13 4 4L19 7" />
  </svg>
);

export const IcCard = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10.5h18M7 15h4" />
  </svg>
);

export const IcCash = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="7" width="18" height="11" rx="2" />
    <circle cx="12" cy="12.5" r="2.4" />
    <path d="M6.4 10.4h.01M17.6 14.6h.01" />
  </svg>
);

export const IcPhone = (p: P) => (
  <svg {...base} {...p}>
    <rect x="8" y="3" width="8" height="18" rx="2" />
    <path d="M11 17.5h2" />
  </svg>
);

export const IcUp = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 19V5" />
    <path d="m6 11 6-6 6 6" />
  </svg>
);

export const IcDown = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14" />
    <path d="m6 13 6 6 6-6" />
  </svg>
);

export const IcAlert = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4 2.9 19.1a1 1 0 0 0 .9 1.6h16.4a1 1 0 0 0 .9-1.6L12 4Z" />
    <path d="M12 10.2v4" />
    <path d="M12 17.4h.01" />
  </svg>
);

export const IcInfo = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11.2V16" />
    <path d="M12 8.2h.01" />
  </svg>
);

export const IcPencil = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 20h4L19.4 8.6a2.05 2.05 0 0 0-2.9-2.9L5 17.1V20Z" />
    <path d="m14.4 7.8 2.9 2.9" />
  </svg>
);

export const IcPrint = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 8.5V3.5h10v5" />
    <path d="M7 16.5H5.5A1.5 1.5 0 0 1 4 15v-5a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 10v5a1.5 1.5 0 0 1-1.5 1.5H17" />
    <rect x="7" y="13.5" width="10" height="7" rx="1" />
  </svg>
);

export const IcCup = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 9.5h11V15a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9.5Z" />
    <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" />
    <path d="M8.2 3.8c-.8 1 .8 1.7 0 2.8M11.7 3.8c-.8 1 .8 1.7 0 2.8" />
  </svg>
);

export const IcLeaf = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 19.5C5 9.5 12.5 4.5 20 4.5c0 8.5-5 15-13.5 15" />
    <path d="M5 19.5c2-5.5 6.5-9.5 11-11.5" />
  </svg>
);

export const IcWheat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 21V9.5" />
    <path d="M12 9.5C9.5 9.5 8 8 8 5.5c2.5 0 4 1.5 4 4Z" />
    <path d="M12 9.5c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4Z" />
    <path d="M12 14.5c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4Z" />
    <path d="M12 14.5c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4Z" />
  </svg>
);

export const IcBag = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 8h12l1 11.2a1 1 0 0 1-1 1.1H6a1 1 0 0 1-1-1.1L6 8Z" />
    <path d="M9 10.5V6a3 3 0 0 1 6 0v4.5" />
  </svg>
);

export const IcRefund = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 3.5v5h5" />
    <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8.5" />
  </svg>
);

export const IcClock = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IcLock = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const IcUnlock = (p: P) => (
  <svg {...base} {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0" />
  </svg>
);

export const IcUser = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M6 20v-1a6 6 0 0 1 12 0v1" />
  </svg>
);

export const IcUsers = (p: P) => (
  <svg {...base} {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const IcKeypad = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4" y="2" width="16" height="20" rx="3" />
    <circle cx="8.5" cy="7.5" r="1" fill="currentColor" />
    <circle cx="12" cy="7.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="7.5" r="1" fill="currentColor" />
    <circle cx="8.5" cy="11.5" r="1" fill="currentColor" />
    <circle cx="12" cy="11.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="11.5" r="1" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
    <circle cx="12" cy="15.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
  </svg>
);

export const IcKeyboard = (p: P) => (
  <svg {...base} {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2.5" />
    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7.5 16h9" />
  </svg>
);

export const IcLogOut = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const IcShield = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const IcEye = (p: P) => (
  <svg {...base} {...p}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IcEyeOff = (p: P) => (
  <svg {...base} {...p}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export const IcSwitch = (p: P) => (
  <svg {...base} {...p}>
    <path d="M16 3h5v5" />
    <path d="m21 3-6.5 6.5" />
    <path d="M4 14v5a2 2 0 0 0 2 2h12" />
    <path d="M8 21H3v-5" />
    <path d="m3 21 6.5-6.5" />
  </svg>
);

export const CATEGORY_ICON: Record<Category, (p: P) => ReturnType<typeof IcCup>> = {
  espresso: IcCup,
  brew: IcLeaf,
  bakery: IcWheat,
  retail: IcBag,
};

