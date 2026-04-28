# 🥐 Bake n' Roll — Inventory & Order Management System

> Full-stack internal management tool for the **Bake n' Roll** artisan bakery, Karachi, Pakistan.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## 📋 Features

| Module | Description |
|---|---|
| 📊 Dashboard | KPI cards, weekly revenue chart, low-stock alerts, recent orders |
| 🧁 Products | Catalogue with stock badges, add/edit form, category & stock filters |
| 👤 Customers | Customer list with order stats, channel tracking, search |
| 📦 Orders | Full order flow: Pending → Baking → Ready → Delivered, new order form |
| 💳 Payments | Transaction log, daily summary, record payment with method badges |
| 📈 Reports | Daily hourly chart, best-sellers table, weekly/monthly summaries |

---

## 🛠 Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MySQL via `mysql2` (Promise-based)
- **Auth**: `express-session` + `bcryptjs`
- **Frontend**: Vanilla JavaScript ES Modules + HTML + CSS
- **Dev**: `nodemon` for auto-restart

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js ≥ 18
- MySQL 8.x running locally

### 2. Clone & Install

```bash
git clone https://github.com/Asma-saqib/Bakenroll-Managment-system.git
cd Bakenroll-Managment-system
npm install
```

### 3. Database Setup

```bash
# Create the database and seed data
mysql -u root -p < sql/schema.sql
```

### 4. Environment Variables

```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password_here
DB_NAME=bakenroll_db
SESSION_SECRET=change_this_to_something_secret
```

### 5. Run

```bash
npm run dev      # development (nodemon)
npm start        # production
```

Open **http://localhost:3000** in your browser.

**Default login:** `admin` / `admin123`

---

## 📁 Folder Structure

```
bakenroll/
├── server.js                  # Entry point
├── .env.example               # Environment template
├── config/db.js               # MySQL connection pool
├── routes/                    # Express route definitions
├── controllers/               # Business logic
├── middleware/                # Auth + error handler
├── public/                    # Frontend (static)
│   ├── index.html             # SPA shell
│   ├── login.html             # Login page
│   ├── css/style.css          # Global styles
│   └── js/                    # Page modules (ES Modules)
└── sql/schema.sql             # DB schema + seed data
```

---

## 🎨 Brand Palette

| Token | Hex | Usage |
|---|---|---|
| Cream | `#FAEEDA` | Sidebar, cards |
| Amber | `#EF9F27` | Active nav, chart bars |
| Dark Amber | `#BA7517` | Primary buttons |
| Deep | `#633806` | Body text |
| Darkest | `#412402` | Headings |

---

## 📡 API Reference

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/dashboard` | All dashboard data |
| GET/POST/PUT/DELETE | `/api/products` | Products CRUD |
| GET | `/api/products/categories` | List categories |
| GET/POST/PUT | `/api/customers` | Customers CRUD |
| GET/POST/PUT/DELETE | `/api/orders` | Orders CRUD |
| PUT | `/api/orders/:id/status` | Update order status |
| GET/POST/PUT | `/api/payments` | Payments CRUD |
| GET | `/api/reports/daily` | Hourly sales |
| GET | `/api/reports/bestsellers` | Top products |
| GET | `/api/reports/summary` | Week/month summary |

---

*Built for `@__bakenroll` · Karachi, Pakistan · 2026*
