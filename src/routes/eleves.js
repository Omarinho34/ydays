const express = require('express');
const router = express.Router();
const { EleveController, GroupeController } = require('../controllers');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Élèves
router.get('/eleves', authenticateToken, EleveController.list);
router.get('/eleves/:id', authenticateToken, EleveController.get);
router.post('/eleves', authenticateToken, requireRole('admin', 'secretaire'), EleveController.create);
router.put('/eleves/:id', authenticateToken, requireRole('admin', 'secretaire'), EleveController.update);
router.delete('/eleves/:id', authenticateToken, requireRole('admin'), EleveController.delete);
router.get('/eleves/:id/stats', authenticateToken, EleveController.stats);
router.get('/eleves/:id/cours', authenticateToken, EleveController.cours);

// Groupes
router.get('/groupes', authenticateToken, GroupeController.list);
router.get('/groupes/:id', authenticateToken, GroupeController.get);
router.post('/groupes', authenticateToken, requireRole('admin', 'secretaire'), GroupeController.create);
router.put('/groupes/:id', authenticateToken, requireRole('admin', 'secretaire'), GroupeController.update);
router.delete('/groupes/:id', authenticateToken, requireRole('admin'), GroupeController.delete);
router.post('/groupes/:id/eleves', authenticateToken, requireRole('admin', 'secretaire'), GroupeController.addEleve);
router.delete('/groupes/:id/eleves/:eleveId', authenticateToken, requireRole('admin', 'secretaire'), GroupeController.removeEleve);
router.get('/groupes/:id/stats', authenticateToken, GroupeController.stats);

module.exports = router;
