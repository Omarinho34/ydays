const express = require('express');
const router = express.Router();
const { CoursController, EnseignantController } = require('../controllers');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Cours
router.get('/cours', authenticateToken, CoursController.list);
router.get('/cours/planning', authenticateToken, CoursController.planning);
router.get('/cours/:id', authenticateToken, CoursController.get);
router.post('/cours', authenticateToken, requireRole('admin', 'secretaire'), CoursController.create);
router.put('/cours/:id', authenticateToken, requireRole('admin', 'secretaire'), CoursController.update);
router.delete('/cours/:id', authenticateToken, requireRole('admin'), CoursController.delete);

// Enseignants
router.get('/enseignants', authenticateToken, EnseignantController.list);
router.get('/enseignants/:id', authenticateToken, EnseignantController.get);
router.post('/enseignants', authenticateToken, requireRole('admin', 'secretaire'), EnseignantController.create);
router.put('/enseignants/:id', authenticateToken, requireRole('admin', 'secretaire'), EnseignantController.update);
router.delete('/enseignants/:id', authenticateToken, requireRole('admin'), EnseignantController.delete);
router.get('/enseignants/:id/planning', authenticateToken, EnseignantController.planning);
router.get('/enseignants/:id/absences', authenticateToken, EnseignantController.absences);
router.post('/enseignants/:id/absences', authenticateToken, requireRole('admin', 'secretaire'), EnseignantController.addAbsence);

module.exports = router;
