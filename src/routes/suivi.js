const express = require('express');
const router = express.Router();
const { PresenceController, PaiementController, NoteController, CommunicationController } = require('../controllers');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Présences
router.get('/presences', authenticateToken, PresenceController.list);
router.post('/presences', authenticateToken, requireRole('admin', 'secretaire', 'enseignant'), PresenceController.create);
router.post('/presences/bulk', authenticateToken, requireRole('admin', 'secretaire', 'enseignant'), PresenceController.bulkCreate);
router.get('/presences/stats', authenticateToken, PresenceController.stats);
router.get('/presences/alertes', authenticateToken, requireRole('admin', 'secretaire'), PresenceController.alertes);

// Paiements
router.get('/paiements', authenticateToken, requireRole('admin', 'secretaire'), PaiementController.list);
router.get('/paiements/impayes', authenticateToken, requireRole('admin', 'secretaire'), PaiementController.impayes);
router.get('/paiements/stats', authenticateToken, requireRole('admin', 'secretaire'), PaiementController.stats);
router.get('/paiements/:id', authenticateToken, requireRole('admin', 'secretaire'), PaiementController.get);
router.post('/paiements', authenticateToken, requireRole('admin', 'secretaire'), PaiementController.create);
router.put('/paiements/:id', authenticateToken, requireRole('admin', 'secretaire'), PaiementController.update);
router.delete('/paiements/:id', authenticateToken, requireRole('admin'), PaiementController.delete);
router.get('/paiements/:id/recu', authenticateToken, requireRole('admin', 'secretaire'), PaiementController.recu);

// Notes
router.get('/notes', authenticateToken, NoteController.list);
router.get('/notes/bulletin', authenticateToken, NoteController.bulletin);
router.get('/notes/evolution', authenticateToken, NoteController.evolution);
router.get('/notes/bulletin/pdf', authenticateToken, requireRole('admin', 'secretaire', 'enseignant'), NoteController.bulletinPdf);
router.get('/notes/:id', authenticateToken, NoteController.get);
router.post('/notes', authenticateToken, requireRole('admin', 'secretaire', 'enseignant'), NoteController.create);
router.put('/notes/:id', authenticateToken, requireRole('admin', 'secretaire', 'enseignant'), NoteController.update);
router.delete('/notes/:id', authenticateToken, requireRole('admin', 'enseignant'), NoteController.delete);

// Communications
router.get('/communications', authenticateToken, CommunicationController.list);
router.get('/communications/:id', authenticateToken, CommunicationController.get);
router.post('/communications', authenticateToken, requireRole('admin', 'secretaire'), CommunicationController.create);
router.delete('/communications/:id', authenticateToken, requireRole('admin', 'secretaire'), CommunicationController.delete);
router.get('/communications/eleve/:eleveId', authenticateToken, CommunicationController.byEleve);

module.exports = router;
