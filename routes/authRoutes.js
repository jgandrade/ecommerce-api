const authControllers = require('../controllers/authControllers');
const auth = require('../auth');
const express = require('express');
const router = express.Router();

router.post('/register', authControllers.register);
router.post('/login', authControllers.login);
router.post('/logout', auth.authenticateToken, authControllers.logout);

module.exports = router;