const userControllers = require('../controllers/userControllers');
const auth = require('../auth');
const express = require('express');
const router = express.Router();


router.patch('/name/set', auth.authenticateToken, userControllers.changeName);
router.patch('/email/set', auth.authenticateToken, userControllers.changeEmail);
router.patch('/password/set', auth.authenticateToken, userControllers.changePassword);
router.patch('/mobilenumber/set', auth.authenticateToken, userControllers.changeNumber);

module.exports = router;