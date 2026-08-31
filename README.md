## ✨ Core Features

### 📊 Dashboard & Analytics
- **Live Sales & Profit KPIs:** Instant calculations for gross revenue, net profit margins, order volume, and average order value (AOV).
- **Interactive Visualizations:** Sales velocity graphs, peak transaction hours, and category-wise performance breakdown.
- **Stock Warnings:** Automated alerts for low-stock and out-of-stock items.

### 💳 Transaction & Checkout Engine
- **Multi-Payment Support:** Checkout flows for Cash, Cards, and Split payment methods.
- **Promo & Discount Engine:** Fixed or percentage-based discount codes with real-time recalculation.
- **Smart Cash Calculator:** Automatic tendered cash change calculations to eliminate cashier errors.
- **Refund & Return Flow:** Order rollback with automated inventory restocking and database reconciliation.

### 📦 Product & Inventory Management
- **Live Margin Tracking:** Dynamic markup and profit margin calculations during product creation and updates.
- **Barcode & SKU Lookup:** Fast search and quick-add support for high-throughput scanning.
- **Persistent Stock Control:** Instant synchronization with SQLite database to prevent double-selling.

### 👥 Customer Records
- **Customer Profiles:** Store contact info, loyalty tiers, and lifetime purchase value.
- **Audit Trails:** Complete purchase history and itemized invoice records per customer.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18+](https://react.dev/) (TypeScript, Functional Components, Custom Hooks) |
| **Build Tooling** | [Vite](https://vitejs.dev/) for instant Hot Module Replacement (HMR) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) |
| **Backend Server** | [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/) REST API |
| **Database** | [SQLite](https://www.sqlite.org/) (`pos.db`) with Write-Ahead Logging (WAL) mode |
| **Testing** | [Vitest](https://vitest.dev/) for fast unit and integration testing |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 📁 Project Structure


pos-system/
├── dist/                       # Compiled production build output
├── node_modules/               # Project dependencies
├── src/                        # Frontend & Backend application source code
│   ├── assets/                 # Static images, icons, and branding
│   ├── components/             # Reusable UI widgets & POS modules
│   ├── context/                # Global React State providers
│   ├── hooks/                  # Custom React hooks
│   ├── server/                 # Express API routes, controllers & db connectors
│   ├── types/                  # TypeScript interface declarations
│   ├── utils/                  # Math formulas, currency formatters
│   ├── App.tsx                 # Root application component
│   └── main.tsx                # Frontend entry point
├── index.html                  # HTML entry template
├── package.json                # Project dependencies & npm scripts
├── package-lock.json           # Exact dependency lockfile
├── pos.db                      # Primary SQLite database file
├── pos.db-shm                  # SQLite shared-memory index
├── pos.db-wal                  # SQLite Write-Ahead Log file
├── tsconfig.json               # TypeScript configuration
├── tsconfig.tsbuildinfo        # TypeScript incremental compilation cache
├── vite.config.ts              # Vite frontend configuration
└── vitest.config.ts            # Vitest unit test configuration.

