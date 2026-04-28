const db = require('../config/db');

async function getAll(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT o.id, o.channel, o.status, o.total_amount, o.notes, o.created_at,
             COALESCE(c.name, 'Walk-in') AS customer_name, c.phone,
             COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const [orders] = await db.query(`
      SELECT o.*, COALESCE(c.name,'Walk-in') AS customer_name, c.phone, c.source AS customer_source
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [req.params.id]);
    if (!orders.length) return res.status(404).json({ error: true, message: 'Order not found.' });

    const [items] = await db.query(`
      SELECT oi.*, p.name AS product_name, p.sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [req.params.id]);

    const [payments] = await db.query('SELECT * FROM payments WHERE order_id = ?', [req.params.id]);

    res.json({ ...orders[0], items, payments });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { customer_id, channel, notes, items } = req.body;
    if (!items || !items.length) {
      const e = new Error('Order must have at least one item.'); e.status = 400; throw e;
    }

    // Calculate total
    let total = 0;
    for (const item of items) {
      const [prod] = await conn.query('SELECT price, stock_qty FROM products WHERE id = ?', [item.product_id]);
      if (!prod.length) throw Object.assign(new Error(`Product ${item.product_id} not found.`), { status: 400 });
      if (prod[0].stock_qty < item.quantity) throw Object.assign(new Error(`Insufficient stock for product ${item.product_id}.`), { status: 400 });
      item.unit_price = parseFloat(prod[0].price);
      total += item.unit_price * parseInt(item.quantity);
    }

    // Insert order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_id, channel, notes, total_amount) VALUES (?,?,?,?)',
      [customer_id || null, channel || 'walkin', notes || null, total]
    );
    const orderId = orderResult.insertId;

    // Insert items & decrement stock
    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?,?,?,?)',
        [orderId, item.product_id, item.quantity, item.unit_price]
      );
      await conn.query('UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await conn.commit();
    conn.release();

    // Return full detail
    req.params = { id: orderId };
    return getOne(req, res, next);
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const validStatuses = ['pending','baking','ready','delivered','cancelled'];
    if (!validStatuses.includes(status)) {
      const e = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`); e.status = 400; return next(e);
    }
    const [existing] = await db.query('SELECT id FROM orders WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: true, message: 'Order not found.' });
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, id: parseInt(req.params.id), status });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const [rows] = await db.query('SELECT status FROM orders WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: true, message: 'Order not found.' });
    if (rows[0].status !== 'pending') return res.status(400).json({ error: true, message: 'Only pending orders can be deleted.' });
    await db.query('DELETE FROM order_items WHERE order_id = ?', [req.params.id]);
    await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Order deleted.' });
  } catch (err) { next(err); }
}

module.exports = { getAll, getOne, create, updateStatus, remove };
