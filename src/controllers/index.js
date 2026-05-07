const { User, Eleve, Groupe, Cours, Enseignant, Presence, Paiement, Note, Communication } = require('../models');
const { generateToken } = require('../middleware/auth');
const PDFService = require('../services/pdfService');

const AuthController = {
    login(req, res) {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis.' });
        }
        
        const user = User.findByEmail(email);
        if (!user || !User.verifyPassword(user, password)) {
            return res.status(401).json({ error: 'Identifiants invalides.' });
        }
        
        if (!user.actif) {
            return res.status(403).json({ error: 'Compte désactivé.' });
        }
        
        const token = generateToken(user);
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                nom: user.nom,
                prenom: user.prenom,
                role: user.role
            }
        });
    },

    me(req, res) {
        const user = User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }
        res.json(user);
    }
};

const EleveController = {
    list(req, res) {
        const eleves = Eleve.findAll(req.query);
        res.json(eleves);
    },

    get(req, res) {
        const eleve = Eleve.findById(req.params.id);
        if (!eleve) return res.status(404).json({ error: 'Élève non trouvé.' });
        res.json(eleve);
    },

    create(req, res) {
        try {
            const eleve = Eleve.create(req.body);
            res.status(201).json(eleve);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    update(req, res) {
        const eleve = Eleve.update(req.params.id, req.body);
        if (!eleve) return res.status(404).json({ error: 'Élève non trouvé.' });
        res.json(eleve);
    },

    delete(req, res) {
        const ok = Eleve.delete(req.params.id);
        if (!ok) return res.status(404).json({ error: 'Élève non trouvé.' });
        res.json({ message: 'Élève archivé avec succès.' });
    },

    stats(req, res) {
        const stats = Eleve.getStats(req.params.id);
        if (!stats) return res.status(404).json({ error: 'Élève non trouvé.' });
        res.json(stats);
    },

    cours(req, res) {
        const eleve = Eleve.findById(req.params.id);
        if (!eleve) return res.status(404).json({ error: 'Élève non trouvé.' });
        const { Cours } = require('../models');
        const allCours = Cours.findAll();
        const coursEleve = allCours.filter(c => Cours.isEleveInscrit(c.id, req.params.id));
        res.json(coursEleve);
    }
};

const GroupeController = {
    list(req, res) {
        res.json(Groupe.findAll());
    },

    get(req, res) {
        const groupe = Groupe.findByIdWithEleves(req.params.id);
        if (!groupe) return res.status(404).json({ error: 'Groupe non trouvé.' });
        res.json(groupe);
    },

    create(req, res) {
        try {
            const groupe = Groupe.create(req.body);
            res.status(201).json(groupe);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    update(req, res) {
        const groupe = Groupe.update(req.params.id, req.body);
        if (!groupe) return res.status(404).json({ error: 'Groupe non trouvé.' });
        res.json(groupe);
    },

    delete(req, res) {
        const ok = Groupe.delete(req.params.id);
        if (!ok) return res.status(404).json({ error: 'Groupe non trouvé.' });
        res.json({ message: 'Groupe supprimé avec succès.' });
    },

    addEleve(req, res) {
        const ok = Groupe.addEleve(req.params.id, req.body.eleve_id);
        if (!ok) return res.status(400).json({ error: 'Impossible d\'ajouter l\'élève au groupe.' });
        res.json({ message: 'Élève ajouté au groupe.' });
    },

    removeEleve(req, res) {
        const ok = Groupe.removeEleve(req.params.id, req.params.eleveId);
        if (!ok) return res.status(404).json({ error: 'Élève non trouvé dans ce groupe.' });
        res.json({ message: 'Élève retiré du groupe.' });
    },

    stats(req, res) {
        const stats = Groupe.getStats(req.params.id);
        if (!stats) return res.status(404).json({ error: 'Groupe non trouvé.' });
        res.json(stats);
    }
};

const CoursController = {
    list(req, res) {
        res.json(Cours.findAll(req.query));
    },

    get(req, res) {
        const cours = Cours.findById(req.params.id);
        if (!cours) return res.status(404).json({ error: 'Cours non trouvé.' });
        res.json(cours);
    },

    create(req, res) {
        try {
            const cours = Cours.create(req.body);
            res.status(201).json(cours);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    update(req, res) {
        const cours = Cours.update(req.params.id, req.body);
        if (!cours) return res.status(404).json({ error: 'Cours non trouvé.' });
        res.json(cours);
    },

    delete(req, res) {
        const ok = Cours.delete(req.params.id);
        if (!ok) return res.status(404).json({ error: 'Cours non trouvé.' });
        res.json({ message: 'Cours supprimé avec succès.' });
    },

    planning(req, res) {
        const { debut, fin } = req.query;
        if (!debut || !fin) {
            return res.status(400).json({ error: 'Dates début et fin requises.' });
        }
        res.json(Cours.getPlanning(debut, fin, req.query));
    }
};

const EnseignantController = {
    list(req, res) {
        res.json(Enseignant.findAll());
    },

    get(req, res) {
        const ens = Enseignant.findById(req.params.id);
        if (!ens) return res.status(404).json({ error: 'Enseignant non trouvé.' });
        res.json(ens);
    },

    create(req, res) {
        try {
            const ens = Enseignant.create(req.body);
            res.status(201).json(ens);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    update(req, res) {
        const ens = Enseignant.update(req.params.id, req.body);
        if (!ens) return res.status(404).json({ error: 'Enseignant non trouvé.' });
        res.json(ens);
    },

    delete(req, res) {
        const ok = Enseignant.delete(req.params.id);
        if (!ok) return res.status(404).json({ error: 'Enseignant non trouvé.' });
        res.json({ message: 'Enseignant supprimé avec succès.' });
    },

    planning(req, res) {
        const { debut, fin } = req.query;
        res.json(Enseignant.getPlanning(req.params.id, debut || '1900-01-01', fin || '2100-12-31'));
    },

    absences(req, res) {
        res.json(Enseignant.getAbsences(req.params.id));
    },

    addAbsence(req, res) {
        const absence = Enseignant.addAbsence(req.params.id, req.body);
        res.status(201).json(absence);
    }
};

const PresenceController = {
    list(req, res) {
        const { cours_id, date_seance, eleve_id } = req.query;
        if (cours_id && date_seance) {
            res.json(Presence.findByCoursAndDate(cours_id, date_seance));
        } else if (eleve_id) {
            res.json(Presence.findByEleve(eleve_id));
        } else {
            res.status(400).json({ error: 'Paramètres requis : (cours_id + date_seance) ou eleve_id' });
        }
    },

    create(req, res) {
        try {
            const presence = Presence.createOrUpdate(req.body);
            res.status(201).json(presence);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    bulkCreate(req, res) {
        try {
            const count = Presence.bulkCreate(req.body.presences);
            res.json({ message: `${count} présences enregistrées.` });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    stats(req, res) {
        const { eleve_id, groupe_id } = req.query;
        if (eleve_id) {
            res.json(Presence.getStatsByEleve(eleve_id));
        } else if (groupe_id) {
            res.json(Presence.getStatsByGroupe(groupe_id));
        } else {
            res.status(400).json({ error: 'eleve_id ou groupe_id requis' });
        }
    },

    alertes(req, res) {
        const seuil = parseInt(req.query.seuil) || 3;
        res.json(Presence.getAlertesAbsences(seuil));
    }
};

const PaiementController = {
    list(req, res) {
        res.json(Paiement.findAll(req.query));
    },

    get(req, res) {
        const p = Paiement.findById(req.params.id);
        if (!p) return res.status(404).json({ error: 'Paiement non trouvé.' });
        res.json(p);
    },

    create(req, res) {
        try {
            const p = Paiement.create(req.body);
            res.status(201).json(p);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    update(req, res) {
        const p = Paiement.update(req.params.id, req.body);
        if (!p) return res.status(404).json({ error: 'Paiement non trouvé.' });
        res.json(p);
    },

    delete(req, res) {
        const ok = Paiement.delete(req.params.id);
        if (!ok) return res.status(404).json({ error: 'Paiement non trouvé.' });
        res.json({ message: 'Paiement supprimé.' });
    },

    stats(req, res) {
        const { debut, fin } = req.query;
        res.json(Paiement.getStatsGlobales(debut || '1900-01-01', fin || '2100-12-31'));
    },

    impayes(req, res) {
        res.json(Paiement.getImpayes());
    },

    async recu(req, res) {
        const p = Paiement.findById(req.params.id);
        if (!p) return res.status(404).json({ error: 'Paiement non trouvé.' });
        try {
            const pdf = await PDFService.generateRecu(p);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="recu-${p.recu_numero || p.id}.pdf"`);
            res.send(pdf);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erreur lors de la génération du PDF.' });
        }
    }
};

const NoteController = {
    list(req, res) {
        const { eleve_id } = req.query;
        if (!eleve_id) return res.status(400).json({ error: 'eleve_id requis' });
        res.json(Note.findByEleve(eleve_id, req.query));
    },

    get(req, res) {
        const n = Note.findById(req.params.id);
        if (!n) return res.status(404).json({ error: 'Note non trouvée.' });
        res.json(n);
    },

    create(req, res) {
        try {
            const { Eleve, Cours } = require('../models');
            const data = { ...req.body, saisi_par: req.user.id };
            if (!Eleve.findById(data.eleve_id)) return res.status(400).json({ error: 'Élève non trouvé.' });
            if (!Cours.findById(data.cours_id)) return res.status(400).json({ error: 'Cours non trouvé.' });
            if (!Cours.isEleveInscrit(data.cours_id, data.eleve_id)) return res.status(400).json({ error: 'L\'élève n\'est pas inscrit à ce cours.' });
            if (data.trimestre !== undefined && data.trimestre !== null) {
                const t = parseInt(data.trimestre);
                if (isNaN(t) || t < 1 || t > 3) return res.status(400).json({ error: 'Trimestre invalide (1-3).' });
                data.trimestre = t;
            }
            const n = Note.create(data);
            res.status(201).json(n);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    update(req, res) {
        try {
            const { Eleve, Cours } = require('../models');
            const data = { ...req.body, saisi_par: req.user.id };
            if (data.eleve_id !== undefined && !Eleve.findById(data.eleve_id)) return res.status(400).json({ error: 'Élève non trouvé.' });
            if (data.cours_id !== undefined && !Cours.findById(data.cours_id)) return res.status(400).json({ error: 'Cours non trouvé.' });
            if (data.eleve_id !== undefined && data.cours_id !== undefined && !Cours.isEleveInscrit(data.cours_id, data.eleve_id)) return res.status(400).json({ error: 'L\'élève n\'est pas inscrit à ce cours.' });
            if (data.trimestre !== undefined && data.trimestre !== null) {
                const t = parseInt(data.trimestre);
                if (isNaN(t) || t < 1 || t > 3) return res.status(400).json({ error: 'Trimestre invalide (1-3).' });
                data.trimestre = t;
            }
            const n = Note.update(req.params.id, data);
            if (!n) return res.status(404).json({ error: 'Note non trouvée.' });
            res.json(n);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    delete(req, res) {
        const ok = Note.delete(req.params.id);
        if (!ok) return res.status(404).json({ error: 'Note non trouvée.' });
        res.json({ message: 'Note supprimée.' });
    },

    bulletin(req, res) {
        const { eleve_id, annee_scolaire, trimestre } = req.query;
        if (!eleve_id || !annee_scolaire || !trimestre) {
            return res.status(400).json({ error: 'eleve_id, annee_scolaire et trimestre requis' });
        }
        const t = parseInt(trimestre);
        if (isNaN(t) || t < 1 || t > 3) return res.status(400).json({ error: 'Trimestre invalide (1-3).' });
        const bulletin = Note.getBulletin(eleve_id, annee_scolaire, t);
        if (!bulletin) return res.status(404).json({ error: 'Élève non trouvé.' });
        res.json(bulletin);
    },

    evolution(req, res) {
        const { eleve_id } = req.query;
        if (!eleve_id) return res.status(400).json({ error: 'eleve_id requis' });
        const evo = Note.getEvolution(eleve_id);
        if (evo === null) return res.status(404).json({ error: 'Élève non trouvé.' });
        res.json(evo);
    },

    async bulletinPdf(req, res) {
        const { eleve_id, annee_scolaire, trimestre } = req.query;
        if (!eleve_id || !annee_scolaire || !trimestre) {
            return res.status(400).json({ error: 'eleve_id, annee_scolaire et trimestre requis' });
        }
        const t = parseInt(trimestre);
        if (isNaN(t) || t < 1 || t > 3) return res.status(400).json({ error: 'Trimestre invalide (1-3).' });
        const bulletin = Note.getBulletin(eleve_id, annee_scolaire, t);
        if (!bulletin) return res.status(404).json({ error: 'Élève non trouvé.' });
        try {
            const pdf = await PDFService.generateBulletin(bulletin);
            res.setHeader('Content-Type', 'application/pdf');
            const filename = encodeURIComponent(`bulletin-${bulletin.eleve.nom}-${annee_scolaire}-T${trimestre}.pdf`);
            res.setHeader('Content-Disposition', `inline; filename="${filename}"; filename*=UTF-8''${filename}`);
            res.send(pdf);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erreur lors de la génération du PDF.' });
        }
    }
};

const CommunicationController = {
    list(req, res) {
        res.json(Communication.findAll(req.query));
    },

    get(req, res) {
        const c = Communication.findById(req.params.id);
        if (!c) return res.status(404).json({ error: 'Communication non trouvée.' });
        res.json(c);
    },

    create(req, res) {
        try {
            const c = Communication.create({ ...req.body, envoye_par: req.user.id });
            res.status(201).json(c);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    delete(req, res) {
        const ok = Communication.delete(req.params.id);
        if (!ok) return res.status(404).json({ error: 'Communication non trouvée.' });
        res.json({ message: 'Communication supprimée.' });
    },

    byEleve(req, res) {
        res.json(Communication.getByEleve(req.params.eleveId));
    }
};

const DashboardController = {
    stats(req, res) {
        const db = require('../config/database');
        
        const nbEleves = db.prepare("SELECT COUNT(*) as count FROM eleves WHERE statut = 'actif'").get();
        const nbGroupes = db.prepare("SELECT COUNT(*) as count FROM groupes WHERE actif = 1").get();
        const nbEnseignants = db.prepare("SELECT COUNT(*) as count FROM enseignants WHERE actif = 1").get();
        const nbCours = db.prepare("SELECT COUNT(*) as count FROM cours WHERE actif = 1").get();
        
        const totalPaiementsMois = db.prepare(`
            SELECT COALESCE(SUM(montant), 0) as total FROM paiements 
            WHERE strftime('%Y-%m', date_paiement) = strftime('%Y-%m', 'now')
        `).get();
        
        const alertesAbsences = Presence.getAlertesAbsences(3);
        
        res.json({
            nbEleves: nbEleves.count,
            nbGroupes: nbGroupes.count,
            nbEnseignants: nbEnseignants.count,
            nbCours: nbCours.count,
            totalPaiementsMois: totalPaiementsMois.total,
            alertesAbsences: alertesAbsences.length,
            alertesAbsencesDetails: alertesAbsences
        });
    }
};

module.exports = {
    AuthController,
    EleveController,
    GroupeController,
    CoursController,
    EnseignantController,
    PresenceController,
    PaiementController,
    NoteController,
    CommunicationController,
    DashboardController
};
