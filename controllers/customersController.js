const db = require('../config/db');

async function getAll(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT c.*,
             COUNT(o.id)              AS order_count,
             COALESCE(SUM(o.total_amount), 0) AS total_spent,
             MAX(o.created_at)        AS last_order_date
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT c.*,
             COUNT(o.id)              AS order_count,
             COALESCE(SUM(o.total_amount), 0) AS total_spent,
             MAX(o.created_at)        AS last_order_date
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: true, message: 'Customer not found.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, phone, source } = req.body;
    if (!name) { const e = new Error('Customer name is required.'); e.status = 400; return next(e); }
    const [result] = await db.query(
      'INSERT INTO customers (name, phone, source) VALUES (?,?,?)',
      [name, phone || null, source || 'instagram']
    );
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { name, phone, source } = req.body;
    const [existing] = await db.query('SELECT id FROM customers WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: true, message: 'Customer not found.' });
    await db.query(
      'UPDATE customers SET name=?, phone=?, source=? WHERE id=?',
      [name, phone || null, source || 'instagram', req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, update };
