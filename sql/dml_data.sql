-- =============================================================
-- Bake n' Roll — DML Script (Milestone 5)
-- Database: bakenroll_db
-- =============================================================

USE bakenroll_db;

-- =============================================================
-- SECTION 1: LOAD DATA FROM CSV FILES
-- Place all CSV files in MySQL's secure-file-priv directory first.
-- To find that directory, run: SHOW VARIABLES LIKE 'secure_file_priv';
-- =============================================================

-- Step 1: Disable FK checks during load (re-enabled at end)
SET FOREIGN_KEY_CHECKS = 0;

-- --- Load categories ---
LOAD DATA INFILE '/path/to/csv/categories.csv'
INTO TABLE categories
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(id, name);

-- --- Load products ---
LOAD DATA INFILE '/path/to/csv/products.csv'
INTO TABLE products
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(sku, name, category_id, price, stock_qty, reorder_threshold);

-- --- Load customers ---
LOAD DATA INFILE '/path/to/csv/customers.csv'
INTO TABLE customers
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(id, name, phone, source);

-- --- Load orders ---
LOAD DATA INFILE '/path/to/csv/orders.csv'
INTO TABLE orders
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(id, customer_id, channel, status, notes, total_amount, created_at);

-- --- Load order_items ---
LOAD DATA INFILE '/path/to/csv/order_items.csv'
INTO TABLE order_items
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(id, order_id, product_id, quantity, unit_price);

-- --- Load payments ---
LOAD DATA INFILE '/path/to/csv/payments.csv'
INTO TABLE payments
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(id, order_id, amount, method, status, paid_at);

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- Also insert the admin user (not in CSV — credentials are sensitive)
INSERT IGNORE INTO users (username, password_hash) VALUES
  ('admin', '$2a$10$b3/FD22U8Kqpn8pqaRzYReoCs2pNQ.WCc2axJIrw5Ze7ccAY3QRti');


-- =============================================================
-- SECTION 2: UPDATE DEMONSTRATIONS
-- =============================================================

-- UPDATE 1: Restock Chicken Nuggets after a new batch is prepared
-- Before: stock_qty = 3
UPDATE products
SET stock_qty = stock_qty + 10
WHERE sku = 'BNR-06'
  AND name = 'Chicken Nuggets';
-- After: stock_qty = 13

-- Verify:
SELECT id, sku, name, stock_qty
FROM products
WHERE sku = 'BNR-06';


-- UPDATE 2: Mark order #2 as delivered (was 'baking')
UPDATE orders
SET status = 'delivered'
WHERE id = 2
  AND status = 'baking';

-- Verify:
SELECT id, customer_id, status, total_amount
FROM orders
WHERE id = 2;


-- UPDATE 3: Mark the payment for order #2 as paid (was 'pending')
UPDATE payments
SET status = 'paid',
    paid_at = NOW()
WHERE order_id = 2
  AND status = 'pending';

-- Verify:
SELECT id, order_id, amount, method, status
FROM payments
WHERE order_id = 2;


-- =============================================================
-- SECTION 3: DELETE DEMONSTRATIONS
-- =============================================================

-- DELETE 1: Remove a cancelled order's payment record
-- Order #3 status is 'pending' with an erroneous payment entry — delete it
DELETE FROM payments
WHERE order_id = 3
  AND status = 'pending';

-- Verify:
SELECT COUNT(*) AS remaining_payment_for_order3
FROM payments
WHERE order_id = 3;


-- DELETE 2: Remove a test/duplicate customer record (id = 50, added during testing)
DELETE FROM customers
WHERE id = 50
  AND name = 'Mariam';

-- Verify:
SELECT COUNT(*) AS customer_50_exists
FROM customers
WHERE id = 50;


-- =============================================================
-- SECTION 4: VALIDATION QUERIES
-- Run all of these and include screenshots or output in submission
-- =============================================================

-- ── 4.1: Row count for every table ───────────────────────────
-- Expected: all counts > 0

SELECT 'users'       AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'categories',                COUNT(*)               FROM categories
UNION ALL
SELECT 'products',                  COUNT(*)               FROM products
UNION ALL
SELECT 'customers',                 COUNT(*)               FROM customers
UNION ALL
SELECT 'orders',                    COUNT(*)               FROM orders
UNION ALL
SELECT 'order_items',               COUNT(*)               FROM order_items
UNION ALL
SELECT 'payments',                  COUNT(*)               FROM payments;

/*
Expected output (before deletes):
+-------------+-----------+
| table_name  | row_count |
+-------------+-----------+
| users       |         1 |
| categories  |         6 |
| products    |         9 |
| customers   |        50 |
| orders      |        60 |
| order_items |       122 |
| payments    |        60 |
+-------------+-----------+
*/


-- ── 4.2: NULL checks on key columns ──────────────────────────
-- Expected: all issue counts = 0

SELECT 'products: NULL price'          AS check_name, COUNT(*) AS issues
  FROM products WHERE price IS NULL
UNION ALL
SELECT 'products: NULL category_id',               COUNT(*)
  FROM products WHERE category_id IS NULL
UNION ALL
SELECT 'products: NULL sku',                       COUNT(*)
  FROM products WHERE sku IS NULL
UNION ALL
SELECT 'customers: NULL name',                     COUNT(*)
  FROM customers WHERE name IS NULL
UNION ALL
SELECT 'customers: NULL phone',                    COUNT(*)
  FROM customers WHERE phone IS NULL
UNION ALL
SELECT 'orders: NULL customer_id',                 COUNT(*)
  FROM orders WHERE customer_id IS NULL
UNION ALL
SELECT 'orders: NULL total_amount',                COUNT(*)
  FROM orders WHERE total_amount IS NULL
UNION ALL
SELECT 'order_items: NULL order_id',               COUNT(*)
  FROM order_items WHERE order_id IS NULL
UNION ALL
SELECT 'order_items: NULL product_id',             COUNT(*)
  FROM order_items WHERE product_id IS NULL
UNION ALL
SELECT 'order_items: quantity <= 0',               COUNT(*)
  FROM order_items WHERE quantity <= 0
UNION ALL
SELECT 'payments: NULL order_id',                  COUNT(*)
  FROM payments WHERE order_id IS NULL
UNION ALL
SELECT 'payments: NULL amount',                    COUNT(*)
  FROM payments WHERE amount IS NULL;

-- Expected: all issues = 0


-- ── 4.3: FK integrity — JOIN checks ──────────────────────────

-- Check: all order_items link to a valid order
SELECT oi.id AS item_id, oi.order_id AS orphan_order_id
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;
-- Expected: 0 rows

-- Check: all order_items link to a valid product
SELECT oi.id AS item_id, oi.product_id AS orphan_product_id
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE p.id IS NULL;
-- Expected: 0 rows

-- Check: all orders link to a valid customer
SELECT o.id AS order_id, o.customer_id AS orphan_customer_id
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE c.id IS NULL;
-- Expected: 0 rows

-- Check: all payments link to a valid order
SELECT pay.id AS payment_id, pay.order_id AS orphan_order_id
FROM payments pay
LEFT JOIN orders o ON pay.order_id = o.id
WHERE o.id IS NULL;
-- Expected: 0 rows

-- Check: all products link to a valid category
SELECT p.id AS product_id, p.name, p.category_id AS orphan_category_id
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE c.id IS NULL;
-- Expected: 0 rows


-- ── 4.4: Business logic check — low stock products ───────────
SELECT id, sku, name, stock_qty, reorder_threshold
FROM products
WHERE stock_qty <= reorder_threshold
ORDER BY stock_qty ASC;
-- Shows any products that need restocking (actionable output for the bakery)


-- ── 4.5: Business logic check — orders with no payment ───────
SELECT o.id AS order_id, o.status, o.total_amount, c.name AS customer_name
FROM orders o
LEFT JOIN payments pay ON o.id = pay.order_id
JOIN customers c ON o.customer_id = c.id
WHERE pay.id IS NULL
  AND o.status NOT IN ('cancelled');
-- Shows delivered/ready orders with no payment recorded (data integrity warning)


-- ── 4.6: Sample JOIN report — order summary ──────────────────
SELECT
    o.id           AS order_id,
    c.name         AS customer,
    c.phone,
    o.channel,
    o.status,
    o.total_amount,
    pay.method     AS payment_method,
    pay.status     AS payment_status
FROM orders o
JOIN customers c  ON o.customer_id = c.id
LEFT JOIN payments pay ON o.id = pay.order_id
ORDER BY o.created_at DESC
LIMIT 10;
-- Shows the 10 most recent orders with customer and payment details
