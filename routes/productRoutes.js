const productControllers = require('../controllers/productControllers');
const auth = require('../auth');
const express = require('express');
const router = express.Router();

router.get('/listAll', auth.authenticateToken, productControllers.getAllProducts);
router.get('/lists', productControllers.getActiveProducts);
router.post('/add', auth.authenticateToken, productControllers.addProduct);
router.delete('/remove', auth.authenticateToken, productControllers.forceRemoveProduct);
router.get('/getproduct', auth.authenticateToken, productControllers.getSpecificProduct);
router.patch('/update/price_stocks', auth.authenticateToken, productControllers.updateProductStocksPrice);
router.patch('/update/name_description', auth.authenticateToken, productControllers.updateProductNameDescription);
router.get('/search/:product', productControllers.searchProduct);

module.exports = router;