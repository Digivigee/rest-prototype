# SpiceHub Restaurant Management System (Prototype)

SpiceHub is a modern, high-performance Restaurant Management System (RMS) designed to streamline dining operations from order placement to final settlement. Built as an MVP for a demo presentation, it features a premium "glassmorphism" UI, real-time status synchronization, and role-based access control.

## ✨ Features

- **Multi-Role Dashboard**: Tailored experiences for Admin, Waiter, Kitchen, and Cashier roles.
- **Waiter POS**: Intuitive split-view order management with real-time cart and category filtering.
- **Kitchen Display System (KDS)**: Real-time ticket management with delay alerts and dark-mode optimization.
- **Billing & Settlement**: Itemized invoicing with GST (5%), discount logic, and UPI/Cash/Card payment support.
- **Inventory Tracking**: Stock level monitoring with automated low-stock visual alerts and transaction logs.
- **Reports & Analytics**: Comprehensive sales daily reports, top-selling items tracking, and KPI summaries.
- **Branding & Localization**: Full INR (₹) currency support and "SpiceHub" branding.

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS (Premium Glassmorphism Design)
- **Database**: SQLite with Prisma ORM
- **Icons**: Lucide React
- **State Management**: React Context & Hooks
- **Notifications**: Custom Toast Notification System

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x or later)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd rest-prototype
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Database Setup**:
   Initialize the SQLite database and run Prisma migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed Demo Data**:
   Populate the system with SpiceHub branded menu items, tables, and inventory:
   ```bash
   npm run seed
   # or
   npx prisma db seed
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔑 Demo Login Roles

For easy prototyping, the system uses a demo login screen. Select from the following roles:
- **Admin**: Full access to all modules including Staff and Settings.
- **Manager**: Access to Inventory, Reports, Menu, and Staff.
- **Waiter**: Focused on Tables and Orders pages.
- **Kitchen**: Access only to the Kitchen Display System (KDS).
- **Cashier**: Access to Billing and active order settlement.

## 📂 Folder Structure

```text
src/
├── app/               # Next.js App Router (Pages & Actions)
│   ├── dashboard/     # Core application modules (Orders, Kitchen, Billing, etc.)
│   └── layout.tsx     # Root layout with ToastProvider
├── components/        # Reusable UI components (Modals, Cards, Sidebar)
├── lib/               # Shared utilities, config, and Prisma client
│   ├── config.ts      # Global Branding (Name, Currency, Tax)
│   └── ToastContext.tsx # Notification system
├── prisma/            # Database schema and seed scripts
└── public/            # Static assets
```

## ⚠️ Known Limitations & Future Improvements

### Limitations
- **Auth**: Fully implemented NextAuth.js (v5) with credentials provider and session management.
- **Persistence**: Optimized SQLite for prototype; easily swappable to PostgreSQL via Prisma.

## 🚢 Production Deployment

### 1. Build and Run via Docker (Recommended)
This project is configured for standalone builds and includes a multi-stage Dockerfile.
```bash
docker build -t spicehub-rms .
docker run -p 3000:3000 --env-file .env spicehub-rms
```

### 2. Manual Deployment
1. Set `output: 'standalone'` in `next.config.ts` (already done).
2. Run `npm run build`.
3. Start the server: `NODE_ENV=production node .next/standalone/server.js`.

### 3. Environment Variables
Ensure the following are set in your production environment:
- `AUTH_SECRET`: Random string for session encryption.
- `DATABASE_URL`: Connection string.
- `NEXTAUTH_URL`: Your production domain.

### 4. Vercel Deployment
1. **Push to GitHub**: Connect your repository to Vercel.
2. **Environment Variables**: Add `AUTH_SECRET` and `DATABASE_URL` in the Vercel Dashboard.
3. **Database Warning**: Vercel is **serverless**. The local SQLite (`dev.db`) will NOT persist data.
   - **Recommendation**: Use **PostgreSQL** (e.g., [Neon](https://neon.tech/)) or **Turso** (Managed SQLite) for persistence.
   - Update `schema.prisma` provider to `"postgresql"` if you switch to Postgres.

---
**SpiceHub v1.0** — Premium Restaurant Operations.
