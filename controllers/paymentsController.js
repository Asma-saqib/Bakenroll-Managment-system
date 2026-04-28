const db = require('../config/db');

async function getAll(req, res, next) {
  try {
    const [[summary]] = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN DATE(paid_at) = CURDATE() AND status='paid' THEN amount ELSE 0 END), 0) AS collected_today,
        COALESCE(SUM(CASE WHEN status='pending' THEN amount ELSE 0 END), 0)                            AS pending_total,
        COALESCE(SUM(CASE WHEN status='refunded' THEN amount ELSE 0 END), 0)                           AS refunded_total
      FROM payments
    `);

    const [rows] = await db.query(`
      SELECT p.*, o.channel, COALESCE(c.name,'Walk-in') AS customer_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY p.paid_at DESC
    `);

    res.json({ summary, payments: rows });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { order_id, amount, method, status } = req.body;
    if (!order_id || amount == null) {
      const e = new Error('order_id and amount are required.'); e.status = 400; return next(e);
    }
    const [result] = await db.query(
      'INSERT INTO payments (order_id, amount, method, status) VALUES (?,?,?,?)',
      [order_id, parseFloat(amount), method || 'cash', status || 'pending']
    );
    const [rows] = await db.query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { status, method, amount } = req.body;
    const [existing] = await db.query('SELECT id FROM payments WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: true, message: 'Payment not found.' });
    await db.query(
      'UPDATE payments SET status=COALESCE(?,status), method=COALESCE(?,method), amount=COALESCE(?,amount) WHERE id=?',
      [status || null, method || null, amount ? parseFloat(amount) : null, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getAll, create, update };
