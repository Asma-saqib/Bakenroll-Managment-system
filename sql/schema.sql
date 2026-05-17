-- -----------------------------------------------
-- Database: bakenroll_db
-- Bake n' Roll — Inventory & Order Management
-- -----------------------------------------------

CREATE DATABASE IF NOT EXISTS bakenroll_db;
USE bakenroll_db;

-- USERS (admin login)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
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
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  source ENUM('instagram','whatsapp','walkin') DEFAULT 'instagram',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
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
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('jazzcash','easypaisa','bank_tt','cash') DEFAULT 'cash',
  status ENUM('paid','pending','refunded') DEFAULT 'pending',
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- -----------------------------------------------
-- SEED DATA
-- -----------------------------------------------

-- Default admin user (password: admin123)
-- Hash generated with bcryptjs rounds=10
INSERT IGNORE INTO users (username, password_hash) VALUES
  ('admin', '$2a$10$b3/FD22U8Kqpn8pqaRzYReoCs2pNQ.WCc2axJIrw5Ze7ccAY3QRti');

-- Categories
INSERT IGNORE INTO categories (id, name) VALUES
  (1, 'Rolls'),
  (2, 'Box patties'),
  (3, 'Shami kebab'),
  (4, 'Samosa'),
  (5, 'Nuggets'),
  (6, 'Meatballs');

-- Sample Products (PKR prices)
INSERT IGNORE INTO products (sku, name, category_id, price, stock_qty, reorder_threshold) VALUES
  ('BNR-01', 'Chicken Rolls',  1,  550.00,  10, 2),
  ('BNR-02', 'Vegetable Rolls',     1,  500.00,  10, 2),
  ('BNR-03', 'Chicken cheese',        2,  700.00, 5, 1),
  ('BNR-04', 'Chicken shami',     3,  15,00.00,  4, 1),
  ('BNR-05', 'Beef shami',    3,  1000.00, 5, 1),
  ('BNR-06', 'Chicken Nuggets',  5, 600.00,  3,  1),
  ('BNR-07', 'Chicken Cheese',  4, 600.00,  5,  1),
  ('BNR-08', 'Chicken allu',  4, 500.00,  5,  1),
  ('BNR-09', 'Classic Meatballs',  6, 1000.00,  2,  1),
  ;

-- Sample Customers
INSERT IGNORE INTO customers (id, name, phone, source) VALUES
  (1, 'Sohail',    '0345-1965005', 'whatsapp'),
  (2, 'Shumila',    '0347-2392672', 'instagram'),
  (3, 'Mahnoor',   '0333-2654819', 'whatsapp'),
  (4, 'Sidra',   '0311-5673249', 'instagram'),
  (5, 'Farheen', '0333-2314562', 'whatsapp');

-- Sample Orders
INSERT IGNORE INTO orders (id, customer_id, channel, status, notes, total_amount, created_at) VALUES
  (1, 1, 'whatsapp', 'delivered', 'Extra spices please',      1000.00, NOW() - INTERVAL 2 DAY),
  (2, 2, 'instagram',  'baking',    NULL,                       900.00, NOW() - INTERVAL 1 DAY),
  (3, 3, 'whatsapp',    'pending',   'Extra Salt',  3500.00, NOW()),
  (4, 4, 'instagram', 'ready',     NULL,                       550.00, NOW()),
  (5, 5, 'whatsapp',  'delivered', NULL,                      1400.00, NOW() - INTERVAL 3 DAY);

-- Sample Order Items
INSERT IGNORE INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 1, 450.00),
  (1, 4, 1, 350.00),
  (1, 5, 0, 200.00),
  (2, 5, 1, 900.00),
  (3, 6, 1, 3500.00),
  (4, 2, 1, 550.00),
  (5, 1, 2, 450.00),
  (5, 4, 1, 350.00),
  (5, 3, 0, 100.00);

-- Sample Payments
INSERT IGNORE INTO payments (order_id, amount, method, status, paid_at) VALUES
  (1, 1000.00, 'jazzcash',  'paid',    NOW() - INTERVAL 2 DAY),
  (2,  900.00, 'easypaisa', 'pending', NOW() - INTERVAL 1 DAY),
  (3, 3500.00, 'cash',      'pending', NOW()),
  (4,  550.00, 'bank_tt',   'paid',    NOW()),
  (5, 1400.00, 'cash',      'paid',    NOW() - INTERVAL 3 DAY);
