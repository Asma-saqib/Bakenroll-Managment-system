import { api, setContent, toast, openModal, closeModal, statusBadge, channelBadge, fmtPKR, fmtDate } from './app.js';

let allOrders = [], allProducts = [], allCustomers = [];
let currentView = 'list'; // 'list' | 'detail'

export async function initOrders() {
  setContent('<div class="loading">Loading orders…</div>');
  try {
    [allOrders, allProducts, allCustomers] = await Promise.all([
      api('/api/orders'), api('/api/products'), api('/api/customers')
    ]);
    renderList();
  } catch (e) { toast(e.message, 'error'); }

  window.addEventListener('page:action', openNewOrderModal, { once: true });
}

// ── List View ─────────────────────────────────────────────────
function renderList(list = allOrders) {
  currentView = 'list';
  setContent(`
    <div class="card">
      <div class="filter-bar">
        <input type="search" id="ord-search" placeholder="🔍 Search customer or order #…" />
        <select id="ord-status-filter">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="baking">Baking</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select id="ord-chan-filter">
          <option value="">All Channels</option>
          <option value="instagram">Instagram</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="walkin">Walk-in</option>
        </select>
      </div>
      <div class="table-wrap">
        <table id="ord-table">
          <thead><tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Channel</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>${renderOrderRows(list)}</tbody>
        </table>
      </div>
    </div>
  `);
  document.getElementById('ord-search').addEventListener('input', applyFilters);
  document.getElementById('ord-status-filter').addEventListener('change', applyFilters);
  document.getElementById('ord-chan-filter').addEventListener('change', applyFilters);
  document.querySelectorAll('.view-ord-btn').forEach(b => b.addEventListener('click', () => renderDetail(+b.dataset.id)));
}

function renderOrderRows(list) {
  if (!list.length) return `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📦</div><p>No orders found</p></div></td></tr>`;
  return list.map(o => `
    <tr>
      <td><b>#${o.id}</b></td>
      <td>${o.customer_name}</td>
      <td>${o.item_count} item${o.item_count!==1?'s':''}</td>
      <td><b>${fmtPKR(o.total_amount)}</b></td>
      <td>${channelBadge(o.channel)}</td>
      <td>${statusBadge(o.status)}</td>
      <td style="color:#9a7a5a">${fmtDate(o.created_at)}</td>
      <td><button class="btn btn-outline btn-sm view-ord-btn" data-id="${o.id}">View →</button></td>
    </tr>`).join('');
}

function applyFilters() {
  const q = document.getElementById('ord-search').value.toLowerCase();
  const st = document.getElementById('ord-status-filter').value;
  const ch = document.getElementById('ord-chan-filter').value;
  const f = allOrders.filter(o =>
    (!q || o.customer_name.toLowerCase().includes(q) || String(o.id).includes(q)) &&
    (!st || o.status === st) && (!ch || o.channel === ch)
  );
  document.querySelector('#ord-table tbody').innerHTML = renderOrderRows(f);
  document.querySelectorAll('.view-ord-btn').forEach(b => b.addEventListener('click', () => renderDetail(+b.dataset.id)));
}

// ── Detail View ───────────────────────────────────────────────
async function renderDetail(id) {
  currentView = 'detail';
  setContent('<div class="loading">Loading order…</div>');
  try {
    const o = await api(`/api/orders/${id}`);
    setContent(`
      <div style="margin-bottom:16px">
        <button class="btn btn-outline" id="back-btn">← Back to Orders</button>
      </div>
      <div class="two-col">
        <div class="card">
          <div class="card-title">📋 Order #${o.id}</div>
          <table style="width:100%">
            <tr><td style="color:#9a7a5a;font-size:12px;padding:6px 0">Date</td><td><b>${fmtDate(o.created_at)}</b></td></tr>
            <tr><td style="color:#9a7a5a;font-size:12px;padding:6px 0">Customer</td><td><b>${o.customer_name}</b></td></tr>
            <tr><td style="color:#9a7a5a;font-size:12px;padding:6px 0">Phone</td><td>${o.phone||'—'}</td></tr>
            <tr><td style="color:#9a7a5a;font-size:12px;padding:6px 0">Channel</td><td>${channelBadge(o.channel)}</td></tr>
            <tr><td style="color:#9a7a5a;font-size:12px;padding:6px 0">Status</td>
              <td>
                <select id="status-select" class="btn btn-outline btn-sm" style="padding:6px 10px">
                  ${['pending','baking','ready','delivered','cancelled'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
                </select>
              </td>
            </tr>
            <tr><td style="color:#9a7a5a;font-size:12px;padding:6px 0">Notes</td><td>${o.notes||'—'}</td></tr>
          </table>
        </div>
        <div class="card">
          <div class="card-title">🛒 Items</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                ${o.items.map(i=>`<tr>
                  <td>${i.product_name}</td><td>${i.quantity}</td>
                  <td>${fmtPKR(i.unit_price)}</td>
                  <td><b>${fmtPKR(i.quantity*i.unit_price)}</b></td>
                </tr>`).join('')}
              </tbody>
              <tfoot>
                <tr style="background:#faf3e8"><td colspan="3" style="text-align:right;font-weight:700;padding:10px 14px">Total</td><td style="font-weight:800;font-size:16px;padding:10px 14px">${fmtPKR(o.total_amount)}</td></tr>
              </tfoot>
            </table>
          </div>
          ${o.payments.length ? `<div style="margin-top:14px">
            <b style="font-size:12px;color:#9a7a5a;text-transform:uppercase">Payments</b>
            ${o.payments.map(p=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #f5ede0;font-size:13px">
              <span>${p.method} — <span class="badge badge-${p.status}">${p.status}</span></span>
              <b>${fmtPKR(p.amount)}</b>
            </div>`).join('')}
          </div>` : ''}
        </div>
      </div>
    `);
    document.getElementById('back-btn').addEventListener('click', () => renderList());
    document.getElementById('status-select').addEventListener('change', async (e) => {
      try {
        await api(`/api/orders/${id}/status`, { method:'PUT', body: JSON.stringify({ status: e.target.value }) });
        allOrders = allOrders.map(x => x.id===id ? {...x, status:e.target.value} : x);
        toast('Status updated!', 'success');
      } catch(err) { toast(err.message,'error'); }
    });
  } catch (e) { toast(e.message,'error'); renderList(); }
}

// ── New Order Modal ───────────────────────────────────────────
let itemCount = 1;
function openNewOrderModal() {
  itemCount = 1;
  openModal('New Order', newOrderForm(),
    `<button class="btn btn-outline" id="mc">Cancel</button><button class="btn btn-primary" id="submit-order-btn">Place Order</button>`);
  document.getElementById('mc').addEventListener('click', closeModal);
  document.getElementById('add-item-row').addEventListener('click', addItemRow);
  document.getElementById('submit-order-btn').addEventListener('click', submitOrder);
}

function newOrderForm() {
  const custOptions = allCustomers.map(c=>`<option value="${c.id}">${c.name} — ${c.phone||'no phone'}</option>`).join('');
  const prodOptions = allProducts.map(p=>`<option value="${p.id}" data-price="${p.price}">${p.name} (${fmtPKR(p.price)})</option>`).join('');
  return `
    <div class="form-grid" style="margin-bottom:16px">
      <div class="form-group full"><label>Customer</label>
        <select id="f-cust-id"><option value="">— Walk-in / No Account —</option>${custOptions}</select>
      </div>
      <div class="form-group"><label>Channel</label>
        <select id="f-channel">
          <option value="walkin">🚶 Walk-in</option>
          <option value="instagram">📸 Instagram</option>
          <option value="whatsapp">💬 WhatsApp</option>
        </select>
      </div>
      <div class="form-group full"><label>Notes</label><textarea id="f-notes" placeholder="Any special requests…"></textarea></div>
    </div>
    <b style="font-size:12px;color:#9a7a5a;text-transform:uppercase;letter-spacing:.05em">Order Items</b>
    <div id="items-container" style="margin-top:10px">
      <div class="order-item-row" data-row="1">
        <select class="item-product" style="padding:9px 12px;border:2px solid #f0dfc0;border-radius:9px;font-family:inherit;font-size:13px;color:#412402">
          <option value="">— Select product —</option>${prodOptions}
        </select>
        <input class="item-qty" type="number" min="1" value="1" style="padding:9px 12px;border:2px solid #f0dfc0;border-radius:9px;font-family:inherit;font-size:13px;color:#412402" />
        <button class="btn btn-danger btn-sm remove-item" style="padding:9px">✕</button>
      </div>
    </div>
    <button class="btn btn-outline btn-sm" id="add-item-row" style="margin-top:10px">＋ Add Item</button>
    <div id="order-total" style="text-align:right;margin-top:14px;font-size:16px;font-weight:800;color:#412402"></div>`;
}

function addItemRow() {
  itemCount++;
  const prodOptions = allProducts.map(p=>`<option value="${p.id}" data-price="${p.price}">${p.name} (${fmtPKR(p.price)})</option>`).join('');
  const row = document.createElement('div');
  row.className = 'order-item-row'; row.dataset.row = itemCount;
  row.innerHTML = `
    <select class="item-product" style="padding:9px 12px;border:2px solid #f0dfc0;border-radius:9px;font-family:inherit;font-size:13px;color:#412402">
      <option value="">— Select product —</option>${prodOptions}
    </select>
    <input class="item-qty" type="number" min="1" value="1" style="padding:9px 12px;border:2px solid #f0dfc0;border-radius:9px;font-family:inherit;font-size:13px;color:#412402" />
    <button class="btn btn-danger btn-sm remove-item" style="padding:9px">✕</button>`;
  document.getElementById('items-container').appendChild(row);
  row.querySelector('.remove-item').addEventListener('click', () => { row.remove(); calcTotal(); });
  row.querySelector('.item-product').addEventListener('change', calcTotal);
  row.querySelector('.item-qty').addEventListener('input', calcTotal);
}

function calcTotal() {
  let total = 0;
  document.querySelectorAll('#items-container .order-item-row').forEach(row => {
    const sel = row.querySelector('.item-product');
    const qty = parseInt(row.querySelector('.item-qty').value) || 0;
    const opt = sel.options[sel.selectedIndex];
    const price = opt ? parseFloat(opt.dataset.price || 0) : 0;
    total += price * qty;
  });
  const el = document.getElementById('order-total');
  if (el) el.textContent = total > 0 ? `Total: ${fmtPKR(total)}` : '';
}

async function submitOrder() {
  const items = [];
  let valid = true;
  document.querySelectorAll('#items-container .order-item-row').forEach(row => {
    const pid = row.querySelector('.item-product').value;
    const qty = parseInt(row.querySelector('.item-qty').value) || 0;
    if (pid && qty > 0) items.push({ product_id: parseInt(pid), quantity: qty });
    else if (!pid) valid = false;
  });
  if (!items.length || !valid) { toast('Please select a product and quantity for each row.', 'error'); return; }
  const body = {
    customer_id: document.getElementById('f-cust-id').value || null,
    channel: document.getElementById('f-channel').value,
    notes: document.getElementById('f-notes').value,
    items,
  };
  try {
    const btn = document.getElementById('submit-order-btn'); btn.disabled=true; btn.textContent='Placing…';
    const created = await api('/api/orders', { method:'POST', body: JSON.stringify(body) });
    allOrders.unshift({ ...created, item_count: items.length, customer_name: allCustomers.find(c=>c.id==body.customer_id)?.name||'Walk-in' });
    toast('Order placed!', 'success');
    closeModal(); renderList();
  } catch (e) { toast(e.message,'error'); document.getElementById('submit-order-btn').disabled=false; document.getElementById('submit-order-btn').textContent='Place Order'; }
}

// bind calcTotal to initial row
document.addEventListener('change', (e) => { if(e.target.classList.contains('item-product')||e.target.classList.contains('item-qty')) calcTotal(); });
document.addEventListener('input', (e) => { if(e.target.classList.contains('item-qty')) calcTotal(); });
