const db = require('../config/db');

async function getDashboard(req, res, next) {
  try {
    // KPIs
    const [[kpiRow]] = await db.query(`
      SELECT
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE DATE(paid_at) = CURDATE() AND status = 'paid') AS revenue_today,
        (SELECT COUNT(*) FROM orders WHERE status IN ('pending','baking','ready'))                          AS active_orders,
        (SELECT COUNT(*) FROM customers)                                                                    AS total_customers,
        (SELECT COUNT(*) FROM products WHERE stock_qty <= reorder_threshold)                               AS low_stock_count
    `);

    // Weekly revenue (last 7 days)
    const [weeklyRevenue] = await db.query(`
      SELECT DATE(paid_at) AS date, COALESCE(SUM(amount),0) AS total
      FROM payments
      WHERE paid_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND status = 'paid'
      GROUP BY DATE(paid_at)
      ORDER BY DATE(paid_at) ASC
    `);

    // Build full 7-day array (fill gaps with 0)
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = weeklyRevenue.find(r => {
        const rd = new Date(r.date);
        return rd.toISOString().split('T')[0] === dateStr;
      });
      last7.push({ date: dateStr, total: found ? parseFloat(found.total) : 0 });
    }

    // Low stock items
    const [lowStockItems] = await db.query(`
      SELECT id, name, stock_qty, reorder_threshold
      FROM products
      WHERE stock_qty <= reorder_threshold
      ORDER BY stock_qty ASC
      LIMIT 8
    `);

    // Recent orders
    const [recentOrders] = await db.query(`
      SELECT o.id, COALESCE(c.name,'Walk-in') AS customer_name,
             o.total_amount, o.status, o.channel, o.created_at
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    return res.json({
      kpis: {
        revenue_today:   parseFloat(kpiRow.revenue_today)  || 0,
        active_orders:   parseInt(kpiRow.active_orders)    || 0,
        total_customers: parseInt(kpiRow.total_customers)  || 0,
        low_stock_count: parseInt(kpiRow.low_stock_count)  || 0,
      },
      weekly_revenue: last7,
      low_stock_items: lowStockItems,
      recent_orders: recentOrders,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
