# DATAFLOW.md — Bake n' Roll Inventory & Order Management System

**Group:** Bake n' Roll  
**Instructor:** Ali Hassan  
**Course:** Database Systems Lab

---

## Where Data Enters the System

Bake n' Roll is a home-based frozen food business in Karachi that sells Rolls, Shami Kebabs, Samosas, Nuggets, Meatballs, and Box Patties. Data enters the system through two paths:

### 1. Admin Dashboard (Manual Entry)
The bakery admin logs into the web application and enters data manually:
- **Adding products:** New SKUs (e.g., BNR-01 Chicken Rolls) are added with a price, stock quantity, and category.
- **Registering customers:** When a new customer places an order via WhatsApp, Instagram, or walk-in, their name, phone number, and source channel are recorded.
- **Creating orders:** The admin creates an order, links it to a customer, selects products and quantities, and sets the order channel (WhatsApp/Instagram/Walk-in).
- **Recording payments:** Once a customer pays (via JazzCash, EasyPaisa, Bank TT, or Cash), the admin logs the payment against the order.

### 2. Initial Load (CSV Import)
For initial database setup, cleaned CSV files are loaded into MySQL using `LOAD DATA INFILE` or bulk `INSERT` statements. This is how the historical seed data and the preprocessed dataset are loaded.

---

## How Data Moves Through the Database

### Step 1 → `categories` must exist first
Before any product can be added, a category row must exist. Categories are static (Rolls, Box Patties, Shami Kebab, Samosa, Nuggets, Meatballs) and are loaded first. Every product references a `category_id` foreign key.

```
categories (loaded first)
     ↓
  products (category_id FK → categories.id)
```

### Step 2 → `customers` are registered
Customer records are created independently of products. A customer is registered when they first contact the bakery via Instagram or WhatsApp. Their `source` field records which platform they use.

### Step 3 → `orders` are created
When a customer places an order, a new row is inserted into `orders`. It references the `customer_id` and also records the `channel` used for this specific order (which may differ from the customer's usual `source`). The `status` starts as `pending` and is updated as the order progresses: `pending → baking → ready → delivered`.

```
customers (customer_id FK)
     ↓
   orders
```

### Step 4 → `order_items` link orders to products
Each product line in an order becomes one row in `order_items`. This table holds the `order_id`, `product_id`, `quantity`, and the `unit_price` at the time of ordering. Stock is decremented from `products.stock_qty` when an order is confirmed. The dashboard surfaces a low-stock alert when `stock_qty` falls below `reorder_threshold`.

```
   orders (order_id FK)          products (product_id FK)
         ↘                            ↙
           order_items
           (quantity, unit_price)
                ↓
     stock_qty decremented in products
```

### Step 5 → `payments` are recorded
After the customer pays, a row is inserted into `payments` linked to the `order_id`. The payment method reflects how Bake n' Roll's customers typically pay: JazzCash and EasyPaisa are most common for WhatsApp/Instagram orders; cash is used for walk-ins; Bank TT is used for bulk orders.

```
orders (order_id FK)
     ↓
  payments (amount, method, status)
```

---

## Full Dependency Chain (CSV Load Order)

```
categories
    ↓
products
customers
    ↓
orders
    ↓
order_items ← (also depends on products)
    ↓
payments
```

CSV files must be loaded in this exact order to satisfy all foreign key constraints.

---

## What Comes Out

| Output | Which Tables Are Queried |
|---|---|
| Dashboard: today's revenue | `orders`, `payments` |
| Dashboard: low-stock alerts | `products` (WHERE stock_qty < reorder_threshold) |
| Dashboard: recent orders | `orders`, `customers` |
| Order status board (Pending → Delivered) | `orders`, `order_items`, `products` |
| Customer order history | `customers`, `orders` |
| Payment transaction log | `payments`, `orders` |
| Best-selling products | `order_items`, `products` (GROUP BY product_id) |
| Weekly/monthly revenue summary | `orders`, `payments` (GROUP BY date) |
| Stock replenishment list | `products` (WHERE stock_qty <= reorder_threshold) |
