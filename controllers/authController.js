const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      const err = new Error('Username and password are required.'); err.status = 400;
      return next(err);
    }

    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: true, code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: true, code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    return res.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      return res.json({ success: true, message: 'Logged out successfully.' });
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  if (req.session && req.session.userId) {
    return res.json({ loggedIn: true, user: { id: req.session.userId, username: req.session.username } });
  }
  return res.json({ loggedIn: false });
}

module.exports = { login, logout, me };
