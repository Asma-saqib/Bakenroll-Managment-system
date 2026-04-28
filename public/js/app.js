// ── app.js — Frontend Router & Global Utilities ──────────────
import { initDashboard }  from './dashboard.js';
import { initProducts }   from './products.js';
import { initCustomers }  from './customers.js';
import { initOrders }     from './orders.js';
import { initPayments }   from './payments.js';
import { initReports }    from './reports.js';

// ── Auth guard ───────────────────────────────────────────────
(async () => {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.loggedIn) { window.location.href = '/login.html'; return; }
    document.getElementById('topbar-username').textContent = data.user.username;
  } catch {
    window.location.href = '/login.html'; return;
  }
  initRouter();
})();

// ── Toast ────────────────────────────────────────────────────
export function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── API fetch wrapper ────────────────────────────────────────
export async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.message || 'API error'), { data, status: res.status });
  }
  return data;
}

// ── Modal ────────────────────────────────────────────────────
export function openModal(title, bodyHTML, footerHTML = '') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-footer').innerHTML = footerHTML;
  document.getElementById('modal-overlay').classList.add('open');
}
export function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}
document.getElementById('modal-close-btn').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// ── Badge helpers ────────────────────────────────────────────
export function badge(text, cls) {
  return `<span class="badge badge-${cls}">${text}</span>`;
}
export function statusBadge(status) { return badge(status, status); }
export function channelBadge(ch) {
  const labels = { instagram: '📸 Instagram', whatsapp: '💬 WhatsApp', walkin: '🚶 Walk-in' };
  return badge(labels[ch] || ch, ch);
}
export function methodBadge(m) {
  const labels = { jazzcash:'JazzCash', easypaisa:'EasyPaisa', bank_tt:'Bank TT', cash:'Cash' };
  return badge(labels[m] || m, m);
}
export function stockBadge(s) { return badge(s.toUpperCase(), s); }
export function fmtPKR(n) { return 'Rs ' + Number(n).toLocaleString('en-PK'); }
export function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' }) : '—'; }
export function initials(name) { return name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?'; }

// ── Page modules ─────────────────────────────────────────────
const pages = {
  dashboard: { init: initDashboard, title: 'Dashboard',  action: null },
  products:  { init: initProducts,  title: 'Products',   action: '＋ Add Product' },
  customers: { init: initCustomers, title: 'Customers',  action: '＋ Add Customer' },
  orders:    { init: initOrders,    title: 'Orders',     action: '＋ New Order' },
  payments:  { init: initPayments,  title: 'Payments',   action: '＋ Record Payment' },
  reports:   { init: initReports,   title: 'Reports',    action: null },
};

function initRouter() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });

  window.addEventListener('hashchange', () => loadPage(getHash()));
  loadPage(getHash());
}

function getHash() {
  const h = window.location.hash.replace('#', '');
  return pages[h] ? h : 'dashboard';
}

export function loadPage(name) {
  const page = pages[name];
  if (!page) return;

  // Active nav
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById(`nav-${name}`);
  if (navEl) navEl.classList.add('active');

  // Title
  document.getElementById('page-title').textContent = page.title;

  // Action button
  const actionBtn = document.getElementById('topbar-action-btn');
  if (page.action) {
    actionBtn.textContent = page.action;
    actionBtn.style.display = 'flex';
    actionBtn.onclick = () => window.dispatchEvent(new CustomEvent('page:action'));
  } else {
    actionBtn.style.display = 'none';
    actionBtn.onclick = null;
  }

  // Hash
  window.location.hash = name;

  // Load module
  document.getElementById('page-content').innerHTML = '<div class="loading">Loading…</div>';
  page.init();
}

export function setContent(html) {
  document.getElementById('page-content').innerHTML = html;
}
