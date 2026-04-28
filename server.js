require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const db = require('./config/db');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productsRoutes = require('./routes/products');
const customersRoutes = require('./routes/customers');
const ordersRoutes = require('./routes/orders');
const paymentsRoutes = require('./routes/payments');
const reportsRoutes = require('./routes/reports');
const errorHandler = require('./middleware/errorHandler');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'bakenroll_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,        // set true when using HTTPS in production
    maxAge: 1000 * 60 * 60 * 8  // 8 hours
  }
}));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/products', requireAuth, productsRoutes);
app.use('/api/customers', requireAuth, customersRoutes);
app.use('/api/orders', requireAuth, ordersRoutes);
app.use('/api/payments', requireAuth, paymentsRoutes);
app.use('/api/reports', requireAuth, reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bake n\' Roll API is running 🍞' });
});

// Serve SPA for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return;
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Error Handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Bake n' Roll server running at http://localhost:${PORT}`);
});

module.exports = app;
