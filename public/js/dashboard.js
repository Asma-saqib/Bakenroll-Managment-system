import { api, setContent, toast, statusBadge, channelBadge, fmtPKR, fmtDate } from './app.js';

export async function initDashboard() {
  setContent('<div class="loading">Loading dashboard…</div>');
  try {
    const d = await api('/api/dashboard');
    render(d);
  } catch (e) { toast(e.message, 'error'); }
}

function render(d) {
  const { kpis, weekly_revenue, low_stock_items, recent_orders } = d;

  setContent(`
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-icon">💰</span>
        <div class="kpi-label">Revenue Today</div>
        <div class="kpi-value">${fmtPKR(kpis.revenue_today)}</div>
        <div class="kpi-sub">Paid payments</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-icon">📦</span>
        <div class="kpi-label">Active Orders</div>
        <div class="kpi-value">${kpis.active_orders}</div>
        <div class="kpi-sub">Pending · Baking · Ready</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-icon">👥</span>
        <div class="kpi-label">Customers</div>
        <div class="kpi-value">${kpis.total_customers}</div>
        <div class="kpi-sub">All time</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-icon">⚠️</span>
        <div class="kpi-label">Low Stock</div>
        <div class="kpi-value" style="color:${kpis.low_stock_count>0?'#e53935':'#3B6D11'}">${kpis.low_stock_count}</div>
        <div class="kpi-sub">Items below threshold</div>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-title">📊 Weekly Revenue</div>
        <div class="chart-wrap"><canvas id="weeklyChart" height="200"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title">⚠️ Low Stock Alerts</div>
        ${low_stock_items.length === 0
          ? '<p style="color:#9a7a5a;font-size:13px;">All products are well stocked ✅</p>'
          : `<ul class="low-stock-list">${low_stock_items.map(i => `
            <li class="low-stock-item">
              <div style="display:flex;align-items:center">
                <span class="low-stock-dot ${i.stock_qty===0?'critical':''}"></span>
                <span style="font-weight:600;font-size:13px">${i.name}</span>
              </div>
              <span style="font-size:12px;color:#9a7a5a">${i.stock_qty} left / ${i.reorder_threshold} threshold</span>
            </li>`).join('')}</ul>`}
      </div>
    </div>

    <div class="card">
      <div class="card-title">🕐 Recent Orders</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Customer</th><th>Channel</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            ${recent_orders.length === 0
              ? '<tr><td colspan="6" style="text-align:center;color:#9a7a5a">No orders yet</td></tr>'
              : recent_orders.map(o => `
              <tr>
                <td><b>#${o.id}</b></td>
                <td>${o.customer_name}</td>
                <td>${channelBadge(o.channel)}</td>
                <td><b>${fmtPKR(o.total_amount)}</b></td>
                <td>${statusBadge(o.status)}</td>
                <td style="color:#9a7a5a">${fmtDate(o.created_at)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `);

  drawWeeklyChart(weekly_revenue);
}

function drawWeeklyChart(data) {
  const canvas = document.getElementById('weeklyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth; const H = 200;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const maxVal = Math.max(...data.map(d => d.total), 1);
  const pad = { top: 20, right: 10, bottom: 40, left: 60 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const barW = (chartW / data.length) * 0.6;
  const gap   = chartW / data.length;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = '#f0dfc0'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
    ctx.fillStyle = '#b8956a'; ctx.font = '11px Inter'; ctx.textAlign = 'right';
    ctx.fillText(fmtPKR(maxVal * (1 - i/4)).replace('Rs ',''), pad.left - 6, y + 4);
  }

  // Bars
  data.forEach((d, i) => {
    const x = pad.left + gap * i + (gap - barW) / 2;
    const barH = (d.total / maxVal) * chartH;
    const y = pad.top + chartH - barH;
    const grad = ctx.createLinearGradient(0, y, 0, y + barH);
    grad.addColorStop(0, '#EF9F27'); grad.addColorStop(1, '#BA7517');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    // Date label
    const lbl = new Date(d.date).toLocaleDateString('en-PK',{weekday:'short'});
    ctx.fillStyle = '#9a7a5a'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
    ctx.fillText(lbl, x + barW/2, pad.top + chartH + 18);
  });
}
