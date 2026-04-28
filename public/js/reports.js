import { api, setContent, toast, fmtPKR } from './app.js';

export async function initReports() {
  const today = new Date().toISOString().split('T')[0];
  setContent('<div class="loading">Loading reports…</div>');
  try {
    const [daily, bestsellers, summary] = await Promise.all([
      api(`/api/reports/daily?date=${today}`),
      api('/api/reports/bestsellers?period=week'),
      api('/api/reports/summary'),
    ]);
    render(daily, bestsellers, summary, today);
  } catch (e) { toast(e.message, 'error'); }
}

function render(daily, bestsellers, summary, selectedDate) {
  setContent(`
    <div class="three-col" style="margin-bottom:22px">
      <div class="metric-card">
        <div class="metric-label">This Week</div>
        <div class="metric-val">${fmtPKR(summary.week_revenue)}</div>
        ${summary.week_growth_pct !== null ? `<div style="font-size:12px;color:${parseFloat(summary.week_growth_pct)>=0?'#2e7d32':'#b91c1c'};margin-top:4px">${parseFloat(summary.week_growth_pct)>=0?'▲':'▼'} ${Math.abs(summary.week_growth_pct)}% vs last week</div>` : ''}
      </div>
      <div class="metric-card">
        <div class="metric-label">This Month</div>
        <div class="metric-val">${fmtPKR(summary.month_revenue)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Top Channel</div>
        <div class="metric-val" style="font-size:18px;margin:8px 0">${summary.top_channel ? ({ instagram:'📸 Instagram', whatsapp:'💬 WhatsApp', walkin:'🚶 Walk-in' }[summary.top_channel] || summary.top_channel) : '—'}</div>
        <div class="metric-label">Top Category: <b>${summary.top_category || '—'}</b></div>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-title" style="justify-content:space-between">
          <span>📊 Daily Sales</span>
          <input type="date" id="date-picker" value="${selectedDate}" style="padding:6px 10px;border:2px solid #f0dfc0;border-radius:8px;font-family:inherit;font-size:13px;color:#412402;outline:none" />
        </div>
        <div class="chart-wrap"><canvas id="dailyChart" height="200"></canvas></div>
      </div>
      <div class="card">
        <div class="card-title">🏆 Best Sellers (This Week)</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Product</th><th>Units</th><th>Revenue</th></tr></thead>
            <tbody>
              ${bestsellers.length === 0
                ? `<tr><td colspan="4" style="text-align:center;color:#9a7a5a;padding:20px">No sales data yet</td></tr>`
                : bestsellers.map((p,i) => `<tr>
                  <td><b style="color:${i===0?'#EF9F27':i===1?'#9a7a5a':'#b8956a'}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</b></td>
                  <td>${p.name}</td>
                  <td>${p.units_sold}</td>
                  <td><b>${fmtPKR(p.revenue)}</b></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `);

  drawDailyChart(daily.hours);

  document.getElementById('date-picker').addEventListener('change', async (e) => {
    try {
      const d = await api(`/api/reports/daily?date=${e.target.value}`);
      drawDailyChart(d.hours);
    } catch(err) { toast(err.message,'error'); }
  });
}

function drawDailyChart(hours) {
  const canvas = document.getElementById('dailyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth; const H = 200;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const maxVal = Math.max(...hours.map(h => h.revenue), 1);
  const pad = { top: 16, right: 10, bottom: 36, left: 56 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const barW = chartW / 24 * 0.65;
  const gap = chartW / 24;

  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#f0dfc0'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
    ctx.fillStyle = '#b8956a'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
    ctx.fillText(fmtPKR(maxVal*(1-i/4)).replace('Rs ',''), pad.left - 4, y + 4);
  }

  hours.forEach((h, i) => {
    if (h.revenue === 0) return;
    const x = pad.left + gap * i + (gap - barW) / 2;
    const bH = (h.revenue / maxVal) * chartH;
    const y = pad.top + chartH - bH;
    const grad = ctx.createLinearGradient(0, y, 0, y + bH);
    grad.addColorStop(0, '#EF9F27'); grad.addColorStop(1, '#BA7517');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(x, y, barW, bH, [3,3,0,0]); ctx.fill();
  });

  // Hour labels (every 6h)
  [0,6,12,18,23].forEach(i => {
    const x = pad.left + gap * i + gap/2;
    ctx.fillStyle = '#9a7a5a'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
    ctx.fillText(`${i}:00`, x, pad.top + chartH + 20);
  });
}
