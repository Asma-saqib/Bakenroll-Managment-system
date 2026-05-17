-- =============================================================
-- Bake n' Roll — DDL Script (Milestone 4)
-- Database: bakenroll_db
-- Based on finalized normalized schema
-- =============================================================

CREATE DATABASE IF NOT EXISTS bakenroll_db;
USE bakenroll_db;

-- =============================================================
-- TABLE: users
-- Admin login credentials
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT           NOT NULL AUTO_INCREMENT,
  username      VARCHAR(100)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username)
);

-- Index on username — used on every login query
CREATE INDEX idx_users_username ON users(username);

-- =============================================================
-- TABLE: categories
-- Product categories: Rolls, Box Patties, Shami Kebab, etc.
-- =============================================================
CREATE TABLE IF NOT EXISTS categories (
  id   INT          NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
);

-- =============================================================
-- TABLE: products
-- Frozen food items with SKU, price, stock, reorder threshold
-- =============================================================
CREATE TABLE IF NOT EXISTS products (
  id                INT           NOT NULL AUTO_INCREMENT,
  sku               VARCHAR(50)   NOT NULL,
  name              VARCHAR(200)  NOT NULL,
  category_id       INT           NOT NULL,
  price             DECIMAL(10,2) NOT NULL,
  stock_qty         INT           NOT NULL DEFAULT 0,
  reorder_threshold INT           NOT NULL DEFAULT 10,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_sku (sku),
  CONSTRAINT chk_products_price       CHECK (price >= 0),
  CONSTRAINT chk_products_stock       CHECK (stock_qty >= 0),
  CONSTRAINT chk_products_reorder     CHECK (reorder_threshold >= 0),
  CONSTRAINT fk_products_category     FOREIGN KEY (category_id)
      REFERENCES categories(id)
      ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Index on category_id (FK) — used in category-filter queries
CREATE INDEX idx_products_category_id ON products(category_id);
-- Index on stock_qty — used for low-stock alerts (WHERE stock_qty <= reorder_threshold)
CREATE INDEX idx_products_stock_qty   ON products(stock_qty);

-- =============================================================
-- TABLE: customers
-- Customer profiles: name, phone, order source channel
-- =============================================================
CREATE TABLE IF NOT EXISTS customers (
  id         INT     NOT NULL AUTO_INCREMENT,
  name       VARCHAR(200) NOT NULL,
  phone      VARCHAR(20),
  source     ENUM('instagram','whatsapp','walkin') NOT NULL DEFAULT 'instagram',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_customers_phone CHECK (phone IS NOT NULL)
);

-- Index on phone — used for customer lookup
CREATE INDEX idx_customers_phone  ON customers(phone);
-- Index on source — used for channel-based reporting
CREATE INDEX idx_customers_source ON customers(source);

-- =============================================================
-- TABLE: orders
-- Customer orders with channel, status, and total amount
-- =============================================================
CREATE TABLE IF NOT EXISTS orders (
  id           INT           NOT NULL AUTO_INCREMENT,
  customer_id  INT           NOT NULL,
  channel      ENUM('instagram','whatsapp','walkin') NOT NULL DEFAULT 'instagram',
  status       ENUM('pending','baking','ready','delivered','cancelled') NOT NULL DEFAULT 'pending',
  notes        TEXT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_orders_total  CHECK (total_amount >= 0),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
      REFERENCES customers(id)
      ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Index on customer_id (FK) — used in customer order history queries
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
-- Index on status — used in order status board queries
CREATE INDEX idx_orders_status      ON orders(status);
-- Index on created_at — used in daily/weekly revenue reports
CREATE INDEX idx_orders_created_at  ON orders(created_at);

-- =============================================================
-- TABLE: order_items
-- Line items per order: which product, quantity, price at time of order
-- =============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id         INT           NOT NULL AUTO_INCREMENT,
  order_id   INT           NOT NULL,
  product_id INT           NOT NULL,
  quantity   INT           NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_order_product (order_id, product_id),
  CONSTRAINT chk_order_items_qty   CHECK (quantity > 0),
  CONSTRAINT chk_order_items_price CHECK (unit_price >= 0),
  CONSTRAINT fk_order_items_order  FOREIGN KEY (order_id)
      REFERENCES orders(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
      REFERENCES products(id)
      ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Index on order_id (FK) — used in every order detail query
CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
-- Index on product_id (FK) — used in best-seller and stock queries
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- =============================================================
-- TABLE: payments
-- Payment records per order — JazzCash, EasyPaisa, Bank TT, Cash
-- =============================================================
CREATE TABLE IF NOT EXISTS payments (
  id       INT           NOT NULL AUTO_INCREMENT,
  order_id INT           NOT NULL,
  amount   DECIMAL(10,2) NOT NULL,
  method   ENUM('jazzcash','easypaisa','bank_tt','cash') NOT NULL DEFAULT 'cash',
  status   ENUM('paid','pending','refunded')             NOT NULL DEFAULT 'pending',
  paid_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_order (order_id),
  CONSTRAINT chk_payments_amount CHECK (amount > 0),
  CONSTRAINT fk_payments_order   FOREIGN KEY (order_id)
      REFERENCES orders(id)
      ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Index on order_id (FK) — used to join payments with orders
CREATE INDEX idx_payments_order_id ON payments(order_id);
-- Index on method — used in payment method breakdown reports
CREATE INDEX idx_payments_method   ON payments(method);
-- Index on status — used to find pending/unpaid orders
CREATE INDEX idx_payments_status   ON payments(status);
-- Index on paid_at — used in daily revenue queries
CREATE INDEX idx_payments_paid_at  ON payments(paid_at);
