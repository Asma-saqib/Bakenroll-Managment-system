const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ordersController');

router.get('/',              ctrl.getAll);
router.get('/:id',           ctrl.getOne);
router.post('/',             ctrl.create);
router.put('/:id/status',    ctrl.updateStatus);
router.delete('/:id',        ctrl.remove);

module.exports = router;
