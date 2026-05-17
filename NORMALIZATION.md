# NORMALIZATION.md — Bake n' Roll Inventory & Order Management System


**Instructor:** Ali Hassan  
**Course:** Database Systems Lab

---

## Tables in Schema

The Bake n' Roll database contains the following tables:

1. `users` — Admin login credentials
2. `categories` — Product categories (Rolls, Box Patties, Shami Kebab, Samosa, Nuggets, Meatballs)
3. `products` — Frozen food items with SKU, price, stock, and reorder threshold
4. `customers` — Customer name, phone, and order source channel
5. `orders` — Customer orders with channel, status, and total amount
6. `order_items` — Individual line items per order (product + quantity + unit price)
7. `payments` — Payment records per order with method and status

---

## First Normal Form (1NF)

**Definition:** Every column must hold a single, atomic (indivisible) value. No repeating groups. Each row must be uniquely identifiable by a primary key.

---

### `users`
| Column | Atomic? |
|---|---|
| id | ✅ |
| username | ✅ |
| password_hash | ✅ |
| created_at | ✅ |

**Assessment:** All columns store a single value. No repeating groups. Primary key `id` uniquely identifies each admin.  
**Change made:** None.  
**Justification:** The table already satisfies 1NF. Every attribute is atomic and there are no multi-valued columns or repeating groups anywhere in the row structure.

---

### `categories`
| Column | Atomic? |
|---|---|
| id | ✅ |
| name | ✅ |

**Assessment:** Only two columns, both atomic. Each category (Rolls, Box Patties, Shami Kebab, Samosa, Nuggets, Meatballs) is stored as a single name string.  
**Change made:** None.  
**Justification:** Already in 1NF. The original schema had no repeating groups or multi-valued attributes in this table.

---

### `products`
| Column | Atomic? |
|---|---|
| id | ✅ |
| sku | ✅ |
| name | ✅ |
| category_id | ✅ |
| price | ✅ |
| stock_qty | ✅ |
| reorder_threshold | ✅ |
| created_at | ✅ |

**Issue found:** In the raw seed data, product `BNR-04` had a typo in the price field — `15,00.00` instead of `1500.00`. This is a data entry error that violates atomicity and causes the price column to be non-parseable.  
**Change made:** Corrected `BNR-04` (Chicken Shami) price from `15,00.00` → `1500.00`.  
**Justification:** After this correction, all columns are atomic. Each product is uniquely identified by `id` and also by `sku` (UNIQUE constraint). No repeating groups exist.

---

### `customers`
| Column | Atomic? |
|---|---|
| id | ✅ |
| name | ✅ |
| phone | ✅ |
| source | ✅ |
| created_at | ✅ |

**Assessment:** All values are atomic. `source` uses an ENUM (`instagram`, `whatsapp`, `walkin`) which stores a single channel value per row.  
**Change made:** None.  
**Justification:** Already in 1NF. There are no multi-valued fields. Each customer is uniquely identified by `id`. Note: the original ERD included an `Address` field, but since Bake n' Roll operates locally in Karachi and takes orders primarily via WhatsApp and Instagram, address was intentionally omitted from the schema — orders are mostly picked up or delivered by arrangement, not to a stored postal address.

---

### `orders`
| Column | Atomic? |
|---|---|
| id | ✅ |
| customer_id | ✅ |
| channel | ✅ |
| status | ✅ |
| notes | ✅ |
| total_amount | ✅ |
| created_at | ✅ |

**Assessment:** All values are atomic. `channel` and `status` use ENUMs that each store exactly one value.  
**Change made:** None.  
**Justification:** Already in 1NF. There are no repeating groups. The original ERD showed `OrderDate` and `TotalAmount` — both are present in the schema as `created_at` and `total_amount` respectively.

---

### `order_items`
| Column | Atomic? |
|---|---|
| id | ✅ |
| order_id | ✅ |
| product_id | ✅ |
| quantity | ✅ |
| unit_price | ✅ |

**Issue found:** In the raw seed data, two order_item rows had `quantity = 0`, which is logically invalid — you cannot have zero quantity in an order line item.  
**Change made:** Removed the two rows with `quantity = 0` (order 1 product 5, and order 5 product 3) from the dataset during preprocessing.  
**Justification:** After cleanup, the table satisfies 1NF. This table was specifically designed to resolve the repeating group that would have existed if multiple products were stored directly inside the `orders` table.

---

### `payments`
| Column | Atomic? |
|---|---|
| id | ✅ |
| order_id | ✅ |
| amount | ✅ |
| method | ✅ |
| status | ✅ |
| paid_at | ✅ |

**Assessment:** All columns are atomic. `method` is an ENUM (`jazzcash`, `easypaisa`, `bank_tt`, `cash`) and `status` is an ENUM (`paid`, `pending`, `refunded`), each holding exactly one value.  
**Change made:** None.  
**Justification:** Already in 1NF. Each payment row is uniquely identified by `id` and stores one atomic value per column.

---

## Second Normal Form (2NF)

**Definition:** Must be in 1NF. Every non-key attribute must be **fully functionally dependent** on the entire primary key. Partial dependencies (a non-key attribute depending on only part of a composite key) must be eliminated.

> **Note:** Partial dependencies can only occur in tables with a **composite primary key**. All tables in this schema use a single-column surrogate primary key (`id` AUTO_INCREMENT), **except** `order_items` which logically represents a composite relationship between `order_id` and `product_id`.

---

### `users`
Single-column PK (`id`). Partial dependency is structurally impossible.  
**Change made:** None.  
**Justification:** Already in 2NF. `username`, `password_hash`, and `created_at` all depend entirely on `id`.

---

### `categories`
Single-column PK (`id`). No partial dependencies possible.  
**Change made:** None.  
**Justification:** Already in 2NF. `name` depends entirely and only on `id`.

---

### `products`
Single-column PK (`id`). All attributes — `sku`, `name`, `category_id`, `price`, `stock_qty`, `reorder_threshold` — describe the product itself.  
**Change made:** None.  
**Justification:** Already in 2NF. No attribute depends on only part of the key because the key is a single column.

---

### `customers`
Single-column PK (`id`). `name`, `phone`, `source` all describe the customer directly.  
**Change made:** None.  
**Justification:** Already in 2NF.

---

### `orders`
Single-column PK (`id`). `customer_id`, `channel`, `status`, `notes`, `total_amount` all describe the specific order.  
**Change made:** None.  
**Justification:** Already in 2NF.

---

### `order_items`
This table has its own surrogate PK (`id`), but the **logical composite key** is (`order_id`, `product_id`) — which product is in which order.

**Analysis of dependencies:**
- `quantity` → depends on both `order_id` AND `product_id` (how many units of that product in that order). ✅ Fully dependent on the composite logical key.
- `unit_price` → depends on both keys. It captures the price of that product **at the time that specific order was placed**, not just the product in isolation. ✅ Fully dependent — this is intentional historical price preservation.

**Change made:** None.  
**Justification:** Already in 2NF. Neither `quantity` nor `unit_price` depends on only `order_id` alone or only `product_id` alone. Both attributes require knowing which product is part of which specific order.

---

### `payments`
Single-column PK (`id`). `order_id`, `amount`, `method`, `status`, `paid_at` all describe the payment transaction itself.  
**Change made:** None.  
**Justification:** Already in 2NF.

---

## Third Normal Form (3NF)

**Definition:** Must be in 2NF. No transitive dependencies — a non-key attribute must not depend on another non-key attribute. All non-key attributes must depend **directly** on the primary key and nothing else.

---

### `users`
No non-key attribute depends on another non-key attribute. `username` and `password_hash` are independent of each other.  
**Change made:** None.  
**Justification:** Already in 3NF.

---

### `categories`
Only one non-key column (`name`). No transitive dependency is possible with a single non-key attribute.  
**Change made:** None.  
**Justification:** Already in 3NF.

---

### `products`
**Transitive dependency reviewed:**  
`category_id` is a foreign key — it is itself a primary key of the `categories` table. Storing `category_id` in `products` is the correct relational design, not a transitive dependency. The category name is retrieved via JOIN, not stored here.

All attributes depend directly on `id`:
- `sku` → depends on product id ✅
- `name` → depends on product id ✅
- `category_id` → FK reference, not a transitive dependency ✅
- `price` → depends on product id ✅
- `stock_qty` → depends on product id ✅
- `reorder_threshold` → depends on product id ✅

**Change made:** None.  
**Justification:** Already in 3NF.

---

### `customers`
`name`, `phone`, and `source` all depend directly on `id`. None of these depend on each other (a customer's phone number is not determined by their source channel).  
**Change made:** None.  
**Justification:** Already in 3NF.

---

### `orders`
**Transitive dependency reviewed:**  
`total_amount` is derivable from `SUM(order_items.quantity * order_items.unit_price)`, which could be considered a transitive dependency through `order_items`. However, storing `total_amount` directly on the `orders` table is a justified and intentional design decision:
- It avoids a JOIN + aggregate on every order read.
- It preserves the final billed amount even if unit prices change later.
- It allows manual adjustments for discounts (e.g., a loyal customer gets a discount on a WhatsApp order).

`channel` in `orders` is separate from `source` in `customers` — a customer who normally orders on Instagram might place a specific order via WhatsApp. These are independent attributes.

**Change made:** None.  
**Justification:** `total_amount` is a documented intentional denormalization for performance and business correctness. All other attributes depend directly on `id`.

---

### `order_items`
`quantity` and `unit_price` do not depend on each other — knowing the quantity of an item does not tell you its price. Both depend on the composite logical key (`order_id`, `product_id`).  
**Change made:** None.  
**Justification:** Already in 3NF.

---

### `payments`
`amount`, `method`, `status`, and `paid_at` all depend directly on the payment `id`. None of these attributes determines another (the payment method does not determine the amount, and the amount does not determine the status).  
**Change made:** None.  
**Justification:** Already in 3NF.

---

## Summary of All Changes

| Table | 1NF | 2NF | 3NF | Change Made |
|---|---|---|---|---|
| users | ✅ | ✅ | ✅ | None |
| categories | ✅ | ✅ | ✅ | None |
| products | ⚠️→✅ | ✅ | ✅ | Fixed price typo in BNR-04: `15,00.00` → `1500.00` |
| customers | ✅ | ✅ | ✅ | None |
| orders | ✅ | ✅ | ✅ | `total_amount` retained (justified) |
| order_items | ⚠️→✅ | ✅ | ✅ | Removed 2 rows with `quantity = 0` |
| payments | ✅ | ✅ | ✅ | None |

---

## Duplicate & Redundancy Check (Step 2)

- No duplicate rows found across any table.
- No overlapping columns between tables — each attribute appears in exactly one table.
- `channel` in `orders` and `source` in `customers` appear similar but are **not** redundant — they record different things (customer's usual platform vs. the specific channel used for a given order).
- `unit_price` in `order_items` is not a duplicate of `price` in `products` — it preserves the historical price at time of order, which is intentional and necessary.
- No redundant columns were removed.
