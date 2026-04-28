import { api, setContent, toast, openModal, closeModal, stockBadge, fmtPKR } from './app.js';

let allProducts = [], allCategories = [], editingId = null;

export async function initProducts() {
  setContent('<div class="loading">Loading products…</div>');
  try {
    [allProducts, allCategories] = await Promise.all([api('/api/products'), api('/api/products/categories')]);
    render();
  } catch (e) { toast(e.message, 'error'); }

  window.addEventListener('page:action', openAddModal, { once: true });
}

function render(filtered = allProducts) {
  setContent(`
    <div class="card">
      <div class="filter-bar">
        <input type="search" id="prod-search" placeholder="🔍 Search name or SKU…" />
        <select id="prod-cat-filter"><option value="">All Categories</option>
          ${allCategories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
        <select id="prod-stock-filter">
          <option value="">All Stock</option>
          <option value="low">⚠️ Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="good">✅ Good</option>
        </select>
      </div>
      <div class="table-wrap">
        <table id="prod-table">
          <thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${renderRows(filtered)}</tbody>
        </table>
      </div>
    </div>
  `);

  document.getElementById('prod-search').addEventListener('input', applyFilters);
  document.getElementById('prod-cat-filter').addEventListener('change', applyFilters);
  document.getElementById('prod-stock-filter').addEventListener('change', applyFilters);
  document.querySelectorAll('.edit-prod-btn').forEach(btn => btn.addEventListener('click', () => openEditModal(+btn.dataset.id)));
  document.querySelectorAll('.del-prod-btn').forEach(btn => btn.addEventListener('click', () => deleteProduct(+btn.dataset.id)));
}

function renderRows(list) {
  if (!list.length) return `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">🧁</div><p>No products found</p></div></td></tr>`;
  return list.map(p => `
    <tr>
      <td><code style="background:#faf3e8;padding:2px 7px;border-radius:5px;font-size:12px">${p.sku}</code></td>
      <td><b>${p.name}</b></td>
      <td>${p.category_name || '—'}</td>
      <td><b>${fmtPKR(p.price)}</b></td>
      <td>${p.stock_qty}</td>
      <td>${stockBadge(p.stock_status)}</td>
      <td style="display:flex;gap:6px">
        <button class="btn btn-outline btn-sm edit-prod-btn" data-id="${p.id}">✏️ Edit</button>
        <button class="btn btn-danger btn-sm del-prod-btn" data-id="${p.id}">🗑</button>
      </td>
    </tr>`).join('');
}

function applyFilters() {
  const q = document.getElementById('prod-search').value.toLowerCase();
  const cat = document.getElementById('prod-cat-filter').value;
  const stock = document.getElementById('prod-stock-filter').value;
  const f = allProducts.filter(p =>
    (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
    (!cat || String(p.category_id) === cat) &&
    (!stock || p.stock_status === stock)
  );
  document.querySelector('#prod-table tbody').innerHTML = renderRows(f);
  document.querySelectorAll('.edit-prod-btn').forEach(btn => btn.addEventListener('click', () => openEditModal(+btn.dataset.id)));
  document.querySelectorAll('.del-prod-btn').forEach(btn => btn.addEventListener('click', () => deleteProduct(+btn.dataset.id)));
}

function productForm(p = {}) {
  return `
    <div class="form-grid">
      <div class="form-group"><label>Product Name *</label><input id="f-name" value="${p.name||''}" placeholder="Classic Cinnamon Roll" /></div>
      <div class="form-group"><label>SKU *</label><input id="f-sku" value="${p.sku||''}" placeholder="BNR-01" /></div>
      <div class="form-group"><label>Category</label>
        <select id="f-cat">
          <option value="">— Select —</option>
          ${allCategories.map(c=>`<option value="${c.id}" ${p.category_id==c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Price (PKR) *</label><input id="f-price" type="number" value="${p.price||''}" placeholder="450" /></div>
      <div class="form-group"><label>Stock Qty</label><input id="f-stock" type="number" value="${p.stock_qty??0}" /></div>
      <div class="form-group"><label>Reorder Threshold</label><input id="f-threshold" type="number" value="${p.reorder_threshold??10}" /></div>
    </div>`;
}

function openAddModal() {
  editingId = null;
  openModal('Add New Product', productForm(),
    `<button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="save-prod-btn">Save Product</button>`);
  document.getElementById('save-prod-btn').addEventListener('click', saveProduct);
}

function openEditModal(id) {
  editingId = id;
  const p = allProducts.find(x => x.id === id);
  openModal('Edit Product', productForm(p),
    `<button class="btn btn-outline" id="modal-cancel">Cancel</button><button class="btn btn-primary" id="save-prod-btn">Update Product</button>`);
  document.getElementById('save-prod-btn').addEventListener('click', saveProduct);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
}

async function saveProduct() {
  const body = {
    name: document.getElementById('f-name').value.trim(),
    sku: document.getElementById('f-sku').value.trim(),
    category_id: document.getElementById('f-cat').value || null,
    price: document.getElementById('f-price').value,
    stock_qty: document.getElementById('f-stock').value,
    reorder_threshold: document.getElementById('f-threshold').value,
  };
  if (!body.name || !body.sku || !body.price) { toast('Name, SKU and price are required.', 'error'); return; }
  try {
    const btn = document.getElementById('save-prod-btn');
    btn.disabled = true; btn.textContent = 'Saving…';
    if (editingId) {
      const updated = await api(`/api/products/${editingId}`, { method:'PUT', body: JSON.stringify(body) });
      allProducts = allProducts.map(p => p.id === editingId ? updated : p);
      toast('Product updated!', 'success');
    } else {
      const created = await api('/api/products', { method:'POST', body: JSON.stringify(body) });
      allProducts.unshift(created);
      toast('Product added!', 'success');
    }
    closeModal(); render();
  } catch (e) { toast(e.message, 'error'); document.getElementById('save-prod-btn').disabled = false; document.getElementById('save-prod-btn').textContent = editingId?'Update Product':'Save Product'; }
}

async function deleteProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
  try {
    await api(`/api/products/${id}`, { method: 'DELETE' });
    allProducts = allProducts.filter(x => x.id !== id);
    toast('Product deleted.', 'success');
    render();
  } catch (e) { toast(e.message, 'error'); }
}
