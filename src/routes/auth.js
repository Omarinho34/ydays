const express = require('express');
const router = express.Router();
const { AuthController, DashboardController } = require('../controllers');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Auth
router.post('/auth/login', AuthController.login);
router.get('/auth/me', authenticateToken, AuthController.me);

// Dashboard (protégé)
router.get('/dashboard', authenticateToken, DashboardController.stats);

module.exports = router;
