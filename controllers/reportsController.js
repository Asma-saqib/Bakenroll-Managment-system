const db = require('../config/db');

async function daily(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const [rows] = await db.query(`
      SELECT HOUR(created_at) AS hour, COALESCE(SUM(total_amount),0) AS revenue
      FROM orders
      WHERE DATE(created_at) = ? AND status != 'cancelled'
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    `, [date]);

    // Fill all 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => {
      const found = rows.find(r => r.hour === i);
      return { hour: i, revenue: found ? parseFloat(found.revenue) : 0 };
    });
    res.json({ date, hours });
  } catch (err) { next(err); }
}

async function bestsellers(req, res, next) {
  try {
    const period = req.query.period === 'month' ? 30 : 7;
    const [rows] = await db.query(`
      SELECT p.id, p.name, p.sku,
             SUM(oi.quantity)                     AS units_sold,
             SUM(oi.quantity * oi.unit_price)     AS revenue
      FROM order_items oi
      JOIN products p  ON oi.product_id = p.id
      JOIN orders o    ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 10
    `, [period]);
    res.json(rows);
  } catch (err) { next(err); }
}

async function summary(req, res, next) {
  try {
    const [[weekRow]] = await db.query(`
      SELECT COALESCE(SUM(total_amount),0) AS week_revenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status != 'cancelled'
    `);
    const [[monthRow]] = await db.query(`
      SELECT COALESCE(SUM(total_amount),0) AS month_revenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status != 'cancelled'
    `);
    const [[prevWeekRow]] = await db.query(`
      SELECT COALESCE(SUM(total_amount),0) AS prev_week_revenue
      FROM orders
      WHERE created_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND status != 'cancelled'
    `);

    const weekRev = parseFloat(weekRow.week_revenue);
    const prevWeekRev = parseFloat(prevWeekRow.prev_week_revenue);
    const weekGrowth = prevWeekRev > 0 ? ((weekRev - prevWeekRev) / prevWeekRev * 100).toFixed(1) : null;

    // Top channel
    const [[topChannel]] = await db.query(`
      SELECT channel, COUNT(*) AS cnt FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status != 'cancelled'
      GROUP BY channel ORDER BY cnt DESC LIMIT 1
    `);

    // Top category
    const [[topCategory]] = await db.query(`
      SELECT cat.name, SUM(oi.quantity * oi.unit_price) AS rev
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories cat ON p.category_id = cat.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND o.status != 'cancelled'
      GROUP BY cat.id ORDER BY rev DESC LIMIT 1
    `);

    res.json({
      week_revenue: weekRev,
      month_revenue: parseFloat(monthRow.month_revenue),
      week_growth_pct: weekGrowth,
      top_channel: topChannel ? topChannel.channel : null,
      top_category: topCategory ? topCategory.name : null,
    });
  } catch (err) { next(err); }
}

module.exports = { daily, bestsellers, summary };
