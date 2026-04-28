const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentsController');

router.get('/',     ctrl.getAll);
router.post('/',    ctrl.create);
router.put('/:id',  ctrl.update);

module.exports = router;
