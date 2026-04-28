import { api, setContent, toast, openModal, closeModal, methodBadge, channelBadge, fmtPKR, fmtDate } from './app.js';

let allPayments = [], summary = {};

export async function initPayments() {
  setContent('<div class="loading">Loading payments…</div>');
  try {
    const data = await api('/api/payments');
    allPayments = data.payments;
    summary = data.summary;
    render();
  } catch (e) { toast(e.message, 'error'); }

  window.addEventListener('page:action', openRecordModal, { once: true });
}

function render(list = allPayments) {
  const statusBadge = (s) => `<span class="badge badge-${s}">${s}</span>`;
  setContent(`
    <div class="three-col" style="margin-bottom:22px">
      <div class="metric-card">
        <div class="metric-label">Collected Today</div>
        <div class="metric-val" style="color:#2e7d32">${fmtPKR(summary.collected_today)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Pending / COD</div>
        <div class="metric-val" style="color:#9a6800">${fmtPKR(summary.pending_total)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Refunded</div>
        <div class="metric-val" style="color:#6a1b9a">${fmtPKR(summary.refunded_total)}</div>
      </div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <input type="search" id="pay-search" placeholder="🔍 Search customer or order…" />
        <select id="pay-method-filter">
          <option value="">All Methods</option>
          <option value="jazzcash">JazzCash</option>
          <option value="easypaisa">EasyPaisa</option>
          <option value="bank_tt">Bank TT</option>
          <option value="cash">Cash</option>
        </select>
        <select id="pay-status-filter">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      <div class="table-wrap">
        <table id="pay-table">
          <thead><tr><th>Txn #</th><th>Order</th><th>Customer</th><th>Amount</th><th>Method</th><th>Channel</th><th>Date</th><th>Status</th><th></th></tr></thead>
          <tbody>${renderRows(list)}</tbody>
        </table>
      </div>
    </div>
  `);

  document.getElementById('pay-search').addEventListener('input', applyFilters);
  document.getElementById('pay-method-filter').addEventListener('change', applyFilters);
  document.getElementById('pay-status-filter').addEventListener('change', applyFilters);
  document.querySelectorAll('.mark-paid-btn').forEach(b => b.addEventListener('click', () => markPaid(+b.dataset.id)));
}

function renderRows(list) {
  if (!list.length) return `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">💳</div><p>No transactions found</p></div></td></tr>`;
  return list.map(p => `
    <tr>
      <td><b>#${p.id}</b></td>
      <td><b>#${p.order_id}</b></td>
      <td>${p.customer_name}</td>
      <td><b>${fmtPKR(p.amount)}</b></td>
      <td>${methodBadge(p.method)}</td>
      <td>${channelBadge(p.channel)}</td>
      <td style="color:#9a7a5a">${fmtDate(p.paid_at)}</td>
      <td><span class="badge badge-${p.status}">${p.status}</span></td>
      <td>${p.status==='pending'?`<button class="btn btn-outline btn-sm mark-paid-btn" data-id="${p.id}">✅ Mark Paid</button>`:'—'}</td>
    </tr>`).join('');
}

function applyFilters() {
  const q = document.getElementById('pay-search').value.toLowerCase();
  const m = document.getElementById('pay-method-filter').value;
  const s = document.getElementById('pay-status-filter').value;
  const f = allPayments.filter(p =>
    (!q || p.customer_name.toLowerCase().includes(q) || String(p.order_id).includes(q)) &&
    (!m || p.method === m) && (!s || p.status === s)
  );
  document.querySelector('#pay-table tbody').innerHTML = renderRows(f);
  document.querySelectorAll('.mark-paid-btn').forEach(b => b.addEventListener('click', () => markPaid(+b.dataset.id)));
}

async function markPaid(id) {
  try {
    const updated = await api(`/api/payments/${id}`, { method:'PUT', body: JSON.stringify({ status: 'paid' }) });
    allPayments = allPayments.map(p => p.id===id ? {...p,...updated} : p);
    // Update summary
    const prev = allPayments.find(p=>p.id===id);
    summary.pending_total = Math.max(0, summary.pending_total - (prev?.amount||0));
    summary.collected_today = (summary.collected_today||0) + (updated.amount||0);
    toast('Marked as paid!', 'success');
    render();
  } catch (e) { toast(e.message, 'error'); }
}

async function openRecordModal() {
  // Get unpaid orders
  let orders = [];
  try { orders = await api('/api/orders'); } catch { orders = []; }
  const unpaid = orders.filter(o => o.status !== 'cancelled' && o.status !== 'delivered');

  openModal('Record Payment', `
    <div class="form-grid">
      <div class="form-group full"><label>Order *</label>
        <select id="f-order-id">
          <option value="">— Select order —</option>
          ${unpaid.map(o=>`<option value="${o.id}">#${o.id} — ${o.customer_name} (${fmtPKR(o.total_amount)})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Amount (PKR) *</label><input id="f-pay-amount" type="number" placeholder="1500" /></div>
      <div class="form-group"><label>Method</label>
        <select id="f-pay-method">
          <option value="cash">Cash</option>
          <option value="jazzcash">JazzCash</option>
          <option value="easypaisa">EasyPaisa</option>
          <option value="bank_tt">Bank TT</option>
        </select>
      </div>
      <div class="form-group"><label>Status</label>
        <select id="f-pay-status">
          <option value="paid">Paid</option>
          <option value="pending">Pending / COD</option>
        </select>
      </div>
    </div>`,
    `<button class="btn btn-outline" id="mc">Cancel</button><button class="btn btn-primary" id="save-pay-btn">Record Payment</button>`
  );
  document.getElementById('mc').addEventListener('click', closeModal);
  document.getElementById('save-pay-btn').addEventListener('click', savePayment);
}

async function savePayment() {
  const body = {
    order_id: document.getElementById('f-order-id').value,
    amount: document.getElementById('f-pay-amount').value,
    method: document.getElementById('f-pay-method').value,
    status: document.getElementById('f-pay-status').value,
  };
  if (!body.order_id || !body.amount) { toast('Order and amount are required.', 'error'); return; }
  try {
    const btn = document.getElementById('save-pay-btn'); btn.disabled=true; btn.textContent='Saving…';
    await api('/api/payments', { method:'POST', body: JSON.stringify(body) });
    toast('Payment recorded!', 'success');
    closeModal();
    const data = await api('/api/payments');
    allPayments = data.payments; summary = data.summary;
    render();
  } catch (e) { toast(e.message,'error'); document.getElementById('save-pay-btn').disabled=false; document.getElementById('save-pay-btn').textContent='Record Payment'; }
}
