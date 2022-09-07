const productControllers = require('../controllers/productControllers');
const auth = require('../auth');
const express = require('express');
const router = express.Router();

router.get('/listAll', auth.authenticateToken, productControllers.getAllProducts);
router.get('/lists', productControllers.getActiveProducts);
router.post('/add', auth.authenticateToken, productControllers.addProduct);
router.delete('/remove', auth.authenticateToken, productControllers.forceRemoveProduct);

module.exports = router;