const db = require('../config/db');

function stockStatus(qty, threshold) {
  if (qty <= threshold) return 'low';
  if (qty <= threshold * 1.5) return 'medium';
  return 'good';
}

async function getAll(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    const products = rows.map(p => ({
      ...p,
      stock_status: stockStatus(p.stock_qty, p.reorder_threshold)
    }));
    res.json(products);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const [rows] = await db.query(
      'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: true, message: 'Product not found.' });
    const p = rows[0];
    res.json({ ...p, stock_status: stockStatus(p.stock_qty, p.reorder_threshold) });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { sku, name, category_id, price, stock_qty, reorder_threshold } = req.body;
    if (!sku || !name || price == null) {
      const e = new Error('SKU, name, and price are required.'); e.status = 400; return next(e);
    }
    const [result] = await db.query(
      'INSERT INTO products (sku, name, category_id, price, stock_qty, reorder_threshold) VALUES (?,?,?,?,?,?)',
      [sku, name, category_id || null, parseFloat(price), parseInt(stock_qty) || 0, parseInt(reorder_threshold) || 10]
    );
    const [rows] = await db.query('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [result.insertId]);
    const p = rows[0];
    res.status(201).json({ ...p, stock_status: stockStatus(p.stock_qty, p.reorder_threshold) });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { sku, name, category_id, price, stock_qty, reorder_threshold } = req.body;
    const [existing] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: true, message: 'Product not found.' });
    await db.query(
      'UPDATE products SET sku=?, name=?, category_id=?, price=?, stock_qty=?, reorder_threshold=? WHERE id=?',
      [sku, name, category_id || null, parseFloat(price), parseInt(stock_qty), parseInt(reorder_threshold) || 10, req.params.id]
    );
    const [rows] = await db.query('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [req.params.id]);
    const p = rows[0];
    res.json({ ...p, stock_status: stockStatus(p.stock_qty, p.reorder_threshold) });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const [inUse] = await db.query('SELECT id FROM order_items WHERE product_id = ? LIMIT 1', [req.params.id]);
    if (inUse.length) return res.status(400).json({ error: true, message: 'Cannot delete product — it is used in existing orders.' });
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: true, message: 'Product not found.' });
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) { next(err); }
}

async function getCategories(req, res, next) {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update, remove, getCategories };
