const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportsController');

router.get('/daily',       ctrl.daily);
router.get('/bestsellers', ctrl.bestsellers);
router.get('/summary',     ctrl.summary);

module.exports = router;
