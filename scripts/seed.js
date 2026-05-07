/**
 * Script de seeding pour les tests
 * Crée des données de démonstration
 */

const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

function seed() {
    console.log('Seeding de la base de données...');
    
    const hashedPassword = bcrypt.hashSync('password123', 12);
    
    // Utilisateurs
    const users = [
        ['secretaire@mini-ecole.fr', hashedPassword, 'secretaire', 'Dupont', 'Marie', '0612345678'],
        ['enseignant@mini-ecole.fr', hashedPassword, 'enseignant', 'Martin', 'Jean', '0623456789'],
        ['parent@mini-ecole.fr', hashedPassword, 'parent', 'Bernard', 'Sophie', '0634567890']
    ];
    
    const insertUser = db.prepare('INSERT INTO users (email, password_hash, role, nom, prenom, telephone) VALUES (?, ?, ?, ?, ?, ?)');
    users.forEach(u => insertUser.run(...u));
    
    // Élèves
    const eleves = [
        ['Durand', 'Lucas', '2015-03-12', 'CP', '12 rue des Écoles', '75001', 'Paris', 'Mme Durand', 'durand@email.fr', '0611111111', null, null, null, 'actif', null],
        ['Petit', 'Emma', '2014-07-22', 'CE1', '25 avenue des Champs', '75008', 'Paris', 'M. Petit', 'petit@email.fr', '0622222222', null, null, null, 'actif', null],
        ['Robert', 'Hugo', '2016-01-05', 'Maternelle', '8 rue de la Paix', '75002', 'Paris', 'Mme Robert', 'robert@email.fr', '0633333333', null, null, null, 'actif', null],
        ['Richard', 'Léa', '2013-11-18', 'CE2', '45 boulevard Haussmann', '75009', 'Paris', 'M. Richard', 'richard@email.fr', '0644444444', null, null, null, 'actif', null],
        ['Moreau', 'Nathan', '2015-09-30', 'CP', '3 rue du Commerce', '75015', 'Paris', 'Mme Moreau', 'moreau@email.fr', '0655555555', null, null, null, 'actif', null]
    ];
    
    const insertEleve = db.prepare(`
        INSERT INTO eleves (nom, prenom, date_naissance, niveau_scolaire, adresse, code_postal, ville,
            contact_parent_nom, contact_parent_email, contact_parent_telephone,
            contact_parent2_nom, contact_parent2_email, contact_parent2_telephone,
            statut, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    eleves.forEach(e => insertEleve.run(...e));
    
    // Groupes
    const groupes = [
        ['Groupe CP Maths', 'CP', 'Groupe de mathématiques CP', 'niveau'],
        ['Groupe CP Français', 'CP', 'Groupe de français CP', 'niveau'],
        ['Groupe CE1 Mixte', 'CE1', 'Groupe mixte CE1', 'mixte'],
        ['Maternelle Petite Section', 'Maternelle', 'Petite section maternelle', 'niveau']
    ];
    
    const insertGroupe = db.prepare('INSERT INTO groupes (nom, niveau, description, type) VALUES (?, ?, ?, ?)');
    groupes.forEach(g => insertGroupe.run(...g));
    
    // Liaisons élèves-groupes
    const eleveGroupe = [[1,1],[1,2],[2,3],[3,4],[4,3],[5,1],[5,2]];
    const insertEG = db.prepare('INSERT INTO eleve_groupe (eleve_id, groupe_id) VALUES (?, ?)');
    eleveGroupe.forEach(eg => insertEG.run(...eg));
    
    // Enseignants
    const enseignants = [
        ['Martin', 'Jean', 'jean.martin@email.fr', '0623456789', '["Mathématiques", "Sciences"]', null, 3],
        ['Bernard', 'Claire', 'claire.bernard@email.fr', '0666666666', '["Français", "Histoire"]', null, null]
    ];
    
    const insertEns = db.prepare('INSERT INTO enseignants (nom, prenom, email, telephone, matieres, disponibilites, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    enseignants.forEach(e => insertEns.run(...e));
    
    // Cours
    const cours = [
        ['Mathématiques', 'Maths CP - Lundi', 'Cours de maths niveau CP', 1, 'Salle A', '2025-09-01', '2026-06-30', '09:00', '10:30', 1, 'hebdomadaire'],
        ['Français', 'Français CP - Mardi', 'Lecture et écriture CP', 2, 'Salle B', '2025-09-01', '2026-06-30', '10:45', '12:00', 2, 'hebdomadaire'],
        ['Mathématiques', 'Maths CE1 - Mercredi', 'Cours de maths CE1', 1, 'Salle A', '2025-09-01', '2026-06-30', '14:00', '15:30', 3, 'hebdomadaire']
    ];
    
    const insertCours = db.prepare(`
        INSERT INTO cours (matiere, titre, description, enseignant_id, salle, date_debut, date_fin, heure_debut, heure_fin, jour_semaine, recurrence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    cours.forEach(c => insertCours.run(...c));
    
    // Liaisons cours-groupes
    const coursGroupe = [[1,1],[2,2],[3,3]];
    const insertCG = db.prepare('INSERT INTO cours_groupe (cours_id, groupe_id) VALUES (?, ?)');
    coursGroupe.forEach(cg => insertCG.run(...cg));
    
    // Présences
    const presences = [
        [1, 1, '2026-05-01', 'present', null, 3],
        [1, 5, '2026-05-01', 'present', null, 3],
        [1, 1, '2026-04-24', 'present', null, 3],
        [1, 5, '2026-04-24', 'absent', 'Maladie', 3],
        [2, 1, '2026-04-29', 'present', null, 3],
        [2, 5, '2026-04-29', 'present', null, 3]
    ];
    
    const insertPres = db.prepare('INSERT INTO presences (cours_id, eleve_id, date_seance, statut, commentaire, saisi_par) VALUES (?, ?, ?, ?, ?, ?)');
    presences.forEach(p => insertPres.run(...p));
    
    // Paiements
    const paiements = [
        [1, 150.00, '2026-04-01', 'virement', 'mensuel', '2026-04-01', '2026-04-30', 0, null, null, 2],
        [2, 150.00, '2026-04-05', 'cheque', 'mensuel', '2026-04-01', '2026-04-30', 1, 'REC-2026-001', null, 2],
        [3, 450.00, '2026-04-02', 'virement', 'trimestriel', '2026-04-01', '2026-06-30', 0, null, null, 2]
    ];
    
    const insertPaiement = db.prepare(`
        INSERT INTO paiements (eleve_id, montant, date_paiement, mode_paiement, formule, periode_debut, periode_fin, recu_genere, recu_numero, notes, saisi_par)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    paiements.forEach(p => insertPaiement.run(...p));
    
    // Notes
    const notes = [
        [1, 1, 15, 'Bon progrès', 2, '2025-2026', '2026-04-15', 3],
        [1, 2, 14, 'Lecture fluide', 2, '2025-2026', '2026-04-20', 2],
        [2, 3, 16, 'Excellent', 2, '2025-2026', '2026-04-18', 3]
    ];
    
    const insertNote = db.prepare(`
        INSERT INTO notes (eleve_id, cours_id, valeur, appreciation, trimestre, annee_scolaire, date_evaluation, saisi_par)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    notes.forEach(n => insertNote.run(...n));
    
    console.log('Données de démonstration créées avec succès !');
    console.log('Comptes de test :');
    console.log('  admin@mini-ecole.fr / admin123');
    console.log('  secretaire@mini-ecole.fr / password123');
    console.log('  enseignant@mini-ecole.fr / password123');
    console.log('  parent@mini-ecole.fr / password123');
}

if (require.main === module) {
    seed();
}

module.exports = seed;
