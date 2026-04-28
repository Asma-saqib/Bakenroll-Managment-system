# Bake n' Roll — Inventory & Order Management System
### Full Project Documentation · Tech Stack: Node.js · Express.js · MySQL · Vanilla JS

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Business Context](#2-business-context)
3. [Feature Modules](#3-feature-modules)
4. [Tech Stack](#4-tech-stack)
5. [Database Schema (MySQL)](#5-database-schema-mysql)
6. [Folder Structure](#6-folder-structure)
7. [Module-by-Module Build Plan](#7-module-by-module-build-plan)
8. [Step-by-Step Prompts (AI-Assisted Dev)](#8-step-by-step-prompts-ai-assisted-dev)
9. [API Route Reference](#9-api-route-reference)
10. [UI Screens Summary](#10-ui-screens-summary)
11. [Phase Roadmap](#11-phase-roadmap)

---

## 1. Project Overview

**Bake n' Roll** is a Karachi-based artisan home bakery that takes orders via Instagram DMs, WhatsApp, and walk-ins. This system is a full-stack internal management tool that lets the owner track inventory, manage orders, record payments, view customers, and analyse daily/weekly sales — all in one place.

| Item | Detail |
|---|---|
| Business name | Bake n' Roll (`@__bakenroll`) |
| Location | Karachi, Pakistan |
| Currency | PKR (Rs) |
| Order channels | Instagram, WhatsApp, Walk-in |
| Payment methods | JazzCash, EasyPaisa, Bank Transfer, Cash |

---

## 2. Business Context

### Pain points this system solves

- Orders coming in through Instagram DMs and WhatsApp with no central tracking
- No visibility into which products are running low before they sell out
- Revenue and sales data tracked manually in notebooks or not at all
- No customer history — impossible to identify repeat customers or top spenders
- No daily summary of what was baked, sold, and earned

### Who uses this system

- **Owner / baker** — enters orders, marks them ready/delivered, checks stock
- No multi-user auth required in v1 (single admin login)

---

## 3. Feature Modules

### Module 1 — Dashboard
- KPI cards: today's revenue, active orders, customer count, low-stock count
- Weekly revenue bar chart (last 7 days)
- Low-stock alert panel (items below reorder threshold)
- Recent orders table (last 5)

### Module 2 — Products
- Full product catalogue table (SKU, name, category, price, stock, status)
- Add / edit product form
- Stock status badges: Good / Medium / Low (auto-calculated vs threshold)
- Filter by category and stock status

### Module 3 — Customers
- Customer list with contact, order count, total spent, last order date
- Source channel tracking (Instagram / WhatsApp / Walk-in)
- Search by name or phone number

### Module 4 — Orders
- Orders table with channel, status, total
- Status flow: Pending → Baking → Ready → Delivered / Cancelled
- Order detail view: line items, notes, customer info, total breakdown
- Add new order form with product selector and quantity

### Module 5 — Payments
- Transaction log per order
- Payment methods: JazzCash, EasyPaisa, Bank TT, Cash
- Status: Paid / Pending / Refunded
- Summary cards: collected today, pending, refunded

### Module 6 — Reports
- Daily sales chart (hourly breakdown)
- Best-seller table (units sold + revenue)
- Weekly/monthly summary cards
- Top channel and top category stats

---

## 4. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend runtime | **Node.js** | JavaScript server runtime |
| Backend framework | **Express.js** | REST API routing + middleware |
| Database | **MySQL** | Relational data storage |
| DB query library | **mysql2** | Node.js MySQL driver (Promise-based) |
| Frontend | **Vanilla JS + HTML/CSS** | No framework — clean, lightweight |
| Templating | **EJS** (optional) | Server-rendered views if preferred over SPA |
| Auth | **express-session** + **bcryptjs** | Single admin login |
| Environment | **dotenv** | Manage DB credentials and secrets |
| Dev tooling | **nodemon** | Auto-restart on file changes |

---

## 5. Database Schema (MySQL)

```sql
-- -----------------------------------------------
-- Database: bakenroll_db
-- -----------------------------------------------

CREATE DATABASE IF NOT EXISTS bakenroll_db;
USE bakenroll_db;

-- USERS (admin login)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- PRODUCTS
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category_id INT,
  price DECIMAL(10,2) NOT NULL,
  stock_qty INT NOT NULL DEFAULT 0,
  reorder_threshold INT NOT NULL DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- CUSTOMERS
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  source ENUM('instagram','whatsapp','walkin') DEFAULT 'instagram',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  channel ENUM('instagram','whatsapp','walkin') DEFAULT 'instagram',
  status ENUM('pending','baking','ready','delivered','cancelled') DEFAULT 'pending',
  notes TEXT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ORDER ITEMS
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- PAYMENTS
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('jazzcash','easypaisa','bank_tt','cash') DEFAULT 'cash',
  status ENUM('paid','pending','refunded') DEFAULT 'pending',
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- SEED: default categories
INSERT INTO categories (name) VALUES
  ('Rolls'), ('Brownies'), ('Cookies'), ('Cakes'), ('Seasonal');

-- SEED: sample products
INSERT INTO products (sku, name, category_id, price, stock_qty, reorder_threshold) VALUES
  ('BNR-01', 'Classic Cinnamon Roll', 1, 450.00, 3, 10),
  ('BNR-02', 'Lotus Biscoff Roll',    1, 550.00, 1, 10),
  ('BNR-03', 'Red Velvet Roll',        1, 500.00, 14, 10),
  ('BNR-04', 'Choco Lava Brownie',    2, 350.00, 7, 10),
  ('BNR-05', 'Cookie Box (12 pcs)',   3, 900.00, 22, 10),
  ('BNR-06', 'Custom Birthday Cake',  4, 3500.00, 8, 5);
```

---

## 6. Folder Structure

```
bakenroll/
├── server.js                  # Entry point — starts Express server
├── .env                       # DB credentials (never commit)
├── .gitignore
├── package.json
│
├── config/
│   └── db.js                  # MySQL connection pool (mysql2)
│
├── routes/
│   ├── auth.js                # POST /login, POST /logout
│   ├── dashboard.js           # GET /api/dashboard
│   ├── products.js            # CRUD /api/products
│   ├── customers.js           # CRUD /api/customers
│   ├── orders.js              # CRUD /api/orders
│   ├── payments.js            # CRUD /api/payments
│   └── reports.js             # GET /api/reports/*
│
├── controllers/
│   ├── dashboardController.js
│   ├── productsController.js
│   ├── customersController.js
│   ├── ordersController.js
│   ├── paymentsController.js
│   └── reportsController.js
│
├── middleware/
│   └── auth.js                # Session check — protect all /api routes
│
├── public/                    # Frontend (served as static files)
│   ├── index.html             # Single-page shell
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js             # Router — loads correct page module
│       ├── dashboard.js
│       ├── products.js
│       ├── customers.js
│       ├── orders.js
│       ├── payments.js
│       └── reports.js
│
└── sql/
    └── schema.sql             # Full DB schema + seed data
```

---

## 7. Module-by-Module Build Plan

### Phase 1 — Project Setup (Day 1)
- [ ] Initialise Node project (`npm init`)
- [ ] Install dependencies: `express`, `mysql2`, `dotenv`, `express-session`, `bcryptjs`, `nodemon`
- [ ] Create `.env` with DB config
- [ ] Set up `config/db.js` connection pool
- [ ] Create `server.js` with base Express setup
- [ ] Import and run `schema.sql` in MySQL

### Phase 2 — Auth (Day 1)
- [ ] Create `users` table, seed one admin user (hashed password)
- [ ] `POST /login` — validate credentials, create session
- [ ] `POST /logout` — destroy session
- [ ] Auth middleware to protect all API routes
- [ ] Login HTML page (`/login`)

### Phase 3 — Products Module (Day 2)
- [ ] `GET /api/products` — list all with category name and stock status
- [ ] `POST /api/products` — create new product
- [ ] `PUT /api/products/:id` — update product
- [ ] `DELETE /api/products/:id` — soft delete
- [ ] Frontend: products table + add/edit form + filter controls

### Phase 4 — Customers Module (Day 2)
- [ ] `GET /api/customers` — list with order count + total spent
- [ ] `POST /api/customers` — create
- [ ] `PUT /api/customers/:id` — update
- [ ] Frontend: customers table + search

### Phase 5 — Orders Module (Day 3)
- [ ] `GET /api/orders` — list with customer name, items count, status
- [ ] `GET /api/orders/:id` — full detail with line items
- [ ] `POST /api/orders` — create order + order_items + update stock
- [ ] `PUT /api/orders/:id/status` — update status
- [ ] Frontend: orders table + detail view + new order form

### Phase 6 — Payments Module (Day 3)
- [ ] `GET /api/payments` — list all transactions
- [ ] `POST /api/payments` — record payment for an order
- [ ] `PUT /api/payments/:id` — update status (e.g. mark as refunded)
- [ ] Frontend: payments table + summary cards

### Phase 7 — Dashboard (Day 4)
- [ ] `GET /api/dashboard` — aggregate query returning all KPIs
- [ ] Query: today's revenue, active orders, customer count, low-stock items
- [ ] Query: last 7 days revenue (grouped by date)
- [ ] Query: 5 most recent orders
- [ ] Frontend: KPI cards + bar chart + alerts panel + recent orders

### Phase 8 — Reports Module (Day 4)
- [ ] `GET /api/reports/daily` — hourly sales for a given date
- [ ] `GET /api/reports/bestsellers` — top products by units/revenue this week
- [ ] `GET /api/reports/summary` — week and month totals + top channel/category
- [ ] Frontend: daily chart + best-sellers table + summary cards

### Phase 9 — Polish & QA (Day 5)
- [ ] Responsive layout check
- [ ] Form validation (frontend + backend)
- [ ] Error handling middleware in Express
- [ ] Loading states on API calls
- [ ] Low-stock badge auto-calculation
- [ ] Final CSS theming (amber/cream Bake n' Roll palette)

---

## 8. Step-by-Step Prompts (AI-Assisted Dev)

Use these prompts with any AI coding assistant (Claude, Cursor, Copilot) to build each module.

---

### PROMPT 1 — Project Scaffolding

```
Create a Node.js + Express.js project scaffold for a bakery inventory management 
system called "Bake n' Roll".

Requirements:
- Entry point: server.js
- Use express, mysql2, dotenv, express-session, bcryptjs
- Create config/db.js that exports a mysql2 connection pool using .env variables:
  DB_HOST, DB_USER, DB_PASS, DB_NAME, PORT
- server.js should: load dotenv, import db, set up express with JSON body parser,
  serve static files from /public, and listen on PORT
- Create a basic health check route: GET /api/health → { status: "ok" }
- Add nodemon to dev script in package.json
```

---

### PROMPT 2 — MySQL Schema

```
Write a complete MySQL schema file (schema.sql) for a bakery order management system.

Tables needed:
1. users — id, username, password_hash, created_at
2. categories — id, name
3. products — id, sku, name, category_id (FK), price, stock_qty, reorder_threshold, created_at
4. customers — id, name, phone, source ENUM('instagram','whatsapp','walkin'), created_at
5. orders — id, customer_id (FK), channel ENUM, status ENUM('pending','baking','ready','delivered','cancelled'), notes, total_amount, created_at
6. order_items — id, order_id (FK), product_id (FK), quantity, unit_price
7. payments — id, order_id (FK), amount, method ENUM('jazzcash','easypaisa','bank_tt','cash'), status ENUM('paid','pending','refunded'), paid_at

Also seed:
- 5 categories: Rolls, Brownies, Cookies, Cakes, Seasonal
- 6 products with Pakistani prices in PKR
```

---

### PROMPT 3 — Auth Module

```
Build a complete auth module for an Express.js app using express-session and bcryptjs.

Files to create:
- middleware/auth.js — exports requireAuth middleware that checks req.session.userId;
  if missing, returns 401 JSON for API routes
- routes/auth.js — POST /api/auth/login (validate username+password from MySQL users table,
  create session), POST /api/auth/logout (destroy session)
- controllers/authController.js — handles login/logout logic

Use mysql2 promise pool from config/db.js.
Return { success: true, user: { id, username } } on successful login.
Hash comparison with bcrypt.compare().
```

---

### PROMPT 4 — Products Module (Backend)

```
Build the Products REST API module for an Express.js + MySQL app.

Files:
- routes/products.js
- controllers/productsController.js

Endpoints:
- GET /api/products — return all products joined with category name; add computed
  field "stock_status": 'low' if stock_qty <= reorder_threshold,
  'medium' if stock_qty <= reorder_threshold * 1.5, else 'good'
- GET /api/products/:id — single product
- POST /api/products — create (body: sku, name, category_id, price, stock_qty, reorder_threshold)
- PUT /api/products/:id — update any fields
- DELETE /api/products/:id — delete (check for existing order_items first)

Use mysql2 promise pool. All routes protected by requireAuth middleware.
Return proper HTTP status codes and error messages.
```

---

### PROMPT 5 — Products Module (Frontend)

```
Build the Products page frontend using Vanilla JS, HTML, and CSS.

File: public/js/products.js

The page should:
1. On load: fetch GET /api/products and render a table with columns:
   SKU, Product name, Category, Price (Rs), Stock qty, Status badge, Edit button
2. Status badge colours: 
   - low → red pill (#FCEBEB text #A32D2D)
   - medium → amber pill (#FAEEDA text #854F0B)
   - good → green pill (#EAF3DE text #3B6D11)
3. Below the table: render an Add/Edit form with fields:
   Product name, SKU, Category (dropdown from GET /api/categories),
   Price, Stock quantity, Reorder threshold
4. On "Save product" — POST or PUT depending on whether editing
5. On "Edit" in table row — populate form with that product's data
6. Filter bar: search input (client-side filter on name/sku),
   Category dropdown, Stock status dropdown

Use fetch() for all API calls. No jQuery, no frameworks.
```

---

### PROMPT 6 — Customers Module

```
Build the full Customers module (backend + frontend) for the Bake n' Roll system.

Backend (routes/customers.js + controllers/customersController.js):
- GET /api/customers — list all customers with computed fields:
  order_count (COUNT of orders), total_spent (SUM of order total_amount),
  last_order_date (MAX created_at from orders)
- POST /api/customers — create (name, phone, source)
- PUT /api/customers/:id — update
- GET /api/customers/:id — single customer detail

Frontend (public/js/customers.js):
- Table: avatar initials circle, name, phone, source badge, orders, total spent, last order
- Search bar filtering by name or phone
- Clicking a row could show a simple detail panel (optional in v1)
- Source badge colours: instagram → blue, whatsapp → amber/brown, walkin → gray
```

---

### PROMPT 7 — Orders Module (Backend)

```
Build the Orders backend module for Express.js + MySQL.

Files: routes/orders.js, controllers/ordersController.js

Endpoints:
- GET /api/orders — list with: order id, customer name, channel, item count,
  total_amount, status, created_at
- GET /api/orders/:id — full detail: order fields + customer info +
  array of order_items (with product name, qty, unit_price)
- POST /api/orders — create order transaction:
  1. Insert into orders table
  2. Insert all order_items
  3. Decrement stock_qty for each product
  4. Calculate and store total_amount
  All in a MySQL transaction — rollback on error.
- PUT /api/orders/:id/status — update status field only
- DELETE /api/orders/:id — only allowed if status is 'pending'

Return full order detail object after create/update.
```

---

### PROMPT 8 — Orders Module (Frontend)

```
Build the Orders page frontend in Vanilla JS.

File: public/js/orders.js

Two views: list view and detail view (toggle with display:none).

List view:
- Filters: search input, status dropdown, channel dropdown
- Table: order #, customer, items (comma list), total, channel badge, status badge, View → link
- Clicking View → switches to detail view for that order

Detail view:
- Back button (← Back to orders) switches back to list
- Left card: order meta (date, customer, contact, channel, delivery, status, total)
- Right card: items table (product, qty, price) + subtotal/total rows + notes field
- Status update dropdown — calls PUT /api/orders/:id/status on change

New Order button (in topbar):
- Opens a modal/panel with: customer search or create inline,
  product rows (select product + qty, add more rows),
  channel selector, notes textarea, submit button
- On submit: POST /api/orders → refresh list

Use fetch() only. No frameworks.
```

---

### PROMPT 9 — Payments Module

```
Build the full Payments module for the Bake n' Roll system.

Backend (routes/payments.js + controllers/paymentsController.js):
- GET /api/payments — all payments joined with order id and customer name;
  include daily summary: { collected_today, pending_total, refunded_total }
- POST /api/payments — record payment (order_id, amount, method, status)
- PUT /api/payments/:id — update status

Frontend (public/js/payments.js):
- Three summary metric cards at top: Collected today, Pending/COD, Refunded
- Transactions table: Txn ID, Order #, Customer, Amount (Rs), Method, Channel, Date, Status badge
- Filter bar: search, method dropdown, status dropdown
- "Record Payment" button opens a simple form: select order (dropdown of unpaid orders),
  amount, method, status — POST to API on submit

Method badge styles:
- jazzcash → purple
- easypaisa → green  
- bank_tt → blue
- cash → gray
```

---

### PROMPT 10 — Dashboard Module

```
Build the Dashboard backend and frontend for the Bake n' Roll system.

Backend (routes/dashboard.js + controllers/dashboardController.js):
Single endpoint: GET /api/dashboard
Return one JSON object with:
{
  kpis: {
    revenue_today: Number,      -- SUM payments where DATE(paid_at) = TODAY and status='paid'
    active_orders: Number,      -- COUNT orders where status IN ('pending','baking','ready')
    total_customers: Number,    -- COUNT customers
    low_stock_count: Number     -- COUNT products where stock_qty <= reorder_threshold
  },
  weekly_revenue: [             -- last 7 days, each: { date, total }
    { date: "2026-04-13", total: 21000 }, ...
  ],
  low_stock_items: [            -- products where stock_qty <= reorder_threshold, limit 5
    { id, name, stock_qty, reorder_threshold }, ...
  ],
  recent_orders: [              -- last 5 orders with customer name
    { id, customer_name, total_amount, status, channel, created_at }, ...
  ]
}

Frontend (public/js/dashboard.js):
- 4 KPI cards in a grid
- Bar chart using Canvas API (no libraries) for weekly revenue
- Low-stock alert list with red/amber dots
- Recent orders mini-table
```

---

### PROMPT 11 — Reports Module

```
Build the Reports module for the Bake n' Roll system.

Backend (routes/reports.js + controllers/reportsController.js):

GET /api/reports/daily?date=YYYY-MM-DD
→ Hourly revenue for that day:
  SELECT HOUR(created_at) as hour, SUM(total_amount) as revenue
  FROM orders WHERE DATE(created_at) = ? AND status != 'cancelled'
  GROUP BY HOUR(created_at)

GET /api/reports/bestsellers?period=week
→ Top 10 products by revenue this week:
  SELECT p.name, SUM(oi.quantity) as units_sold, SUM(oi.quantity * oi.unit_price) as revenue
  FROM order_items oi JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND o.status != 'cancelled'
  GROUP BY p.id ORDER BY revenue DESC LIMIT 10

GET /api/reports/summary
→ { week_revenue, month_revenue, week_growth_pct, month_growth_pct,
    top_channel, top_category }

Frontend (public/js/reports.js):
- Daily chart: Canvas bar chart, date picker input, re-fetch on date change
- Best-sellers table: rank, product name, units sold, revenue
- Summary row: 4 metric cards (week, month, top channel, top category)
```

---

### PROMPT 12 — Frontend Router & Shell

```
Build the frontend shell for a single-page vanilla JS app.

File: public/index.html
- Clean HTML shell with sidebar nav and main content area
- Sidebar links: Dashboard, Products, Customers, Orders, Payments, Reports
- Each link has a data-page attribute

File: public/js/app.js
- On DOMContentLoaded: read current page from URL hash (#dashboard) or default to dashboard
- Function loadPage(pageName): 
  1. Update active class on sidebar nav item
  2. Update page title in topbar
  3. Dynamically load the right JS module (or call its init function)
  4. Update window.location.hash
- Listen for hashchange event to handle browser back/forward

CSS theming (public/css/style.css):
- Sidebar background: #FAEEDA (warm cream)
- Sidebar active item: #EF9F27 (amber)
- Primary button: #BA7517 (dark amber)
- Badges follow same amber/cream palette
- Clean table rows with #FAEEDA hover
- Font: system-ui or Inter
```

---

### PROMPT 13 — Error Handling & Middleware

```
Add production-quality error handling to the Bake n' Roll Express app.

1. middleware/auth.js — already exists; ensure it returns 401 with JSON for API routes
   and redirect to /login for page routes

2. middleware/errorHandler.js — global error handler:
   - Catch MySQL errors: duplicate entry (409), foreign key violation (400)
   - Catch validation errors (400)
   - All others (500)
   - Always return { error: true, message: string, code: string }

3. In server.js — register errorHandler as last middleware

4. In all controllers — wrap async logic in try/catch and call next(err)

5. Frontend error handling in app.js:
   - Global fetch wrapper that checks response.ok; if not, throws with response JSON
   - Toast notification component (top-right, auto-dismiss 3s):
     - Green for success messages
     - Red for errors
   - Show toast on every API call result
```

---

## 9. API Route Reference

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/dashboard` | All dashboard data |
| GET | `/api/products` | List products + stock status |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/categories` | List categories |
| GET | `/api/customers` | List customers + stats |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| GET | `/api/orders` | List orders |
| GET | `/api/orders/:id` | Order detail |
| POST | `/api/orders` | Create order (with transaction) |
| PUT | `/api/orders/:id/status` | Update order status |
| GET | `/api/payments` | List payments + daily summary |
| POST | `/api/payments` | Record payment |
| PUT | `/api/payments/:id` | Update payment status |
| GET | `/api/reports/daily` | Hourly sales for a date |
| GET | `/api/reports/bestsellers` | Top products this week |
| GET | `/api/reports/summary` | Week/month aggregates |

---

## 10. UI Screens Summary

| Screen | Key components |
|---|---|
| Dashboard | 4 KPI cards, weekly bar chart, low-stock alerts, recent orders table |
| Products | Table with stock badges, add/edit form (2-col grid), filter bar |
| Customers | Table with avatar initials, channel badges, stats columns |
| Orders | List view + detail view toggle, status update, new order form |
| Payments | 3 summary cards, transactions table, record payment form |
| Reports | Daily chart with date picker, best-sellers table, monthly summary cards |

### Colour palette (Bake n' Roll brand)

| Token | Hex | Usage |
|---|---|---|
| Cream light | `#FAEEDA` | Sidebar bg, card bg, row hover |
| Amber mid | `#EF9F27` | Active nav, chart bars, accents |
| Amber dark | `#BA7517` | Primary button, links |
| Amber deep | `#633806` | Body text on cream |
| Darkest | `#412402` | Headings, values |

---

## 11. Phase Roadmap

| Phase | Days | Deliverables |
|---|---|---|
| Phase 1 — Planning | Day 1 | Wireframes, DB schema, folder scaffold |
| Phase 2 — Backend Core | Days 2–3 | Auth, Products, Customers, Orders APIs |
| Phase 3 — Frontend Core | Days 3–4 | All 6 UI screens wired to live API |
| Phase 4 — Reports + Dashboard | Day 4 | Aggregation queries, charts |
| Phase 5 — Polish | Day 5 | Validation, error handling, toasts, responsive |
| Phase 6 — Launch | Day 6 | Deploy on local machine or VPS, seed real data |

---

*Built for `@__bakenroll` · Karachi, Pakistan · 2026*
