import { api, setContent, toast, openModal, closeModal, channelBadge, fmtPKR, fmtDate, initials } from './app.js';

let allCustomers = [], editingId = null;

export async function initCustomers() {
  setContent('<div class="loading">Loading customers…</div>');
  try {
    allCustomers = await api('/api/customers');
    render();
  } catch (e) { toast(e.message, 'error'); }

  window.addEventListener('page:action', openAddModal, { once: true });
}

function render(list = allCustomers) {
  setContent(`
    <div class="card">
      <div class="filter-bar">
        <input type="search" id="cust-search" placeholder="🔍 Search name or phone…" />
        <select id="cust-src-filter">
          <option value="">All Channels</option>
          <option value="instagram">📸 Instagram</option>
          <option value="whatsapp">💬 WhatsApp</option>
          <option value="walkin">🚶 Walk-in</option>
        </select>
      </div>
      <div class="table-wrap">
        <table id="cust-table">
          <thead><tr><th>Customer</th><th>Phone</th><th>Source</th><th>Orders</th><th>Total Spent</th><th>Last Order</th><th>Actions</th></tr></thead>
          <tbody>${renderRows(list)}</tbody>
        </table>
      </div>
    </div>
  `);
  document.getElementById('cust-search').addEventListener('input', applyFilters);
  document.getElementById('cust-src-filter').addEventListener('change', applyFilters);
  document.querySelectorAll('.edit-cust-btn').forEach(b => b.addEventListener('click', () => openEditModal(+b.dataset.id)));
}

function renderRows(list) {
  if (!list.length) return `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👤</div><p>No customers found</p></div></td></tr>`;
  return list.map(c => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:10px"><div class="avatar">${initials(c.name)}</div><b>${c.name}</b></div></td>
      <td>${c.phone || '—'}</td>
      <td>${channelBadge(c.source)}</td>
      <td><b>${c.order_count}</b></td>
      <td><b>${fmtPKR(c.total_spent)}</b></td>
      <td style="color:#9a7a5a">${fmtDate(c.last_order_date)}</td>
      <td><button class="btn btn-outline btn-sm edit-cust-btn" data-id="${c.id}">✏️ Edit</button></td>
    </tr>`).join('');
}

function applyFilters() {
  const q = document.getElementById('cust-search').value.toLowerCase();
  const src = document.getElementById('cust-src-filter').value;
  const f = allCustomers.filter(c =>
    (!q || c.name.toLowerCase().includes(q) || (c.phone||'').includes(q)) &&
    (!src || c.source === src)
  );
  document.querySelector('#cust-table tbody').innerHTML = renderRows(f);
  document.querySelectorAll('.edit-cust-btn').forEach(b => b.addEventListener('click', () => openEditModal(+b.dataset.id)));
}

function custForm(c = {}) {
  return `
    <div class="form-grid">
      <div class="form-group full"><label>Full Name *</label><input id="f-cname" value="${c.name||''}" placeholder="Sara Ahmed" /></div>
      <div class="form-group"><label>Phone</label><input id="f-phone" value="${c.phone||''}" placeholder="0300-1234567" /></div>
      <div class="form-group"><label>Source Channel</label>
        <select id="f-source">
          <option value="instagram" ${c.source==='instagram'?'selected':''}>📸 Instagram</option>
          <option value="whatsapp"  ${c.source==='whatsapp'?'selected':''}>💬 WhatsApp</option>
          <option value="walkin"    ${c.source==='walkin'?'selected':''}>🚶 Walk-in</option>
        </select>
      </div>
    </div>`;
}

function openAddModal() {
  editingId = null;
  openModal('Add Customer', custForm(),
    `<button class="btn btn-outline" id="mc">Cancel</button><button class="btn btn-primary" id="save-cust-btn">Save Customer</button>`);
  document.getElementById('mc').addEventListener('click', closeModal);
  document.getElementById('save-cust-btn').addEventListener('click', saveCustomer);
}

function openEditModal(id) {
  editingId = id;
  const c = allCustomers.find(x => x.id === id);
  openModal('Edit Customer', custForm(c),
    `<button class="btn btn-outline" id="mc">Cancel</button><button class="btn btn-primary" id="save-cust-btn">Update Customer</button>`);
  document.getElementById('mc').addEventListener('click', closeModal);
  document.getElementById('save-cust-btn').addEventListener('click', saveCustomer);
}

async function saveCustomer() {
  const body = {
    name: document.getElementById('f-cname').value.trim(),
    phone: document.getElementById('f-phone').value.trim(),
    source: document.getElementById('f-source').value,
  };
  if (!body.name) { toast('Name is required.', 'error'); return; }
  try {
    const btn = document.getElementById('save-cust-btn'); btn.disabled=true; btn.textContent='Saving…';
    if (editingId) {
      const upd = await api(`/api/customers/${editingId}`, { method:'PUT', body:JSON.stringify(body) });
      allCustomers = allCustomers.map(c => c.id===editingId?{...c,...upd}:c);
      toast('Customer updated!', 'success');
    } else {
      const created = await api('/api/customers', { method:'POST', body:JSON.stringify(body) });
      allCustomers.unshift({...created, order_count:0, total_spent:0, last_order_date:null});
      toast('Customer added!', 'success');
    }
    closeModal(); render();
  } catch (e) { toast(e.message,'error'); }
}
