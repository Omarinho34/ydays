const db = require('../config/database');

class Presence {
    static findByCoursAndDate(coursId, dateSeance) {
        return db.prepare(`
            SELECT p.*, e.nom as eleve_nom, e.prenom as eleve_prenom
            FROM presences p
            INNER JOIN eleves e ON p.eleve_id = e.id
            WHERE p.cours_id = ? AND p.date_seance = ?
            ORDER BY e.nom, e.prenom
        `).all(coursId, dateSeance);
    }

    static findByEleve(eleveId, limit = 100) {
        return db.prepare(`
            SELECT p.*, c.matiere, c.titre
            FROM presences p
            INNER JOIN cours c ON p.cours_id = c.id
            WHERE p.eleve_id = ?
            ORDER BY p.date_seance DESC
            LIMIT ?
        `).all(eleveId, limit);
    }

    static getStatsByEleve(eleveId) {
        return db.prepare(`
            SELECT 
                statut,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
            FROM presences
            WHERE eleve_id = ?
            GROUP BY statut
        `).all(eleveId);
    }

    static getStatsByGroupe(groupeId) {
        return db.prepare(`
            SELECT 
                p.statut,
                COUNT(*) as count
            FROM presences p
            INNER JOIN eleve_groupe eg ON p.eleve_id = eg.eleve_id
            WHERE eg.groupe_id = ?
            GROUP BY p.statut
        `).all(groupeId);
    }

    static createOrUpdate(data) {
        const existing = db.prepare(`
            SELECT id FROM presences WHERE cours_id = ? AND eleve_id = ? AND date_seance = ?
        `).get(data.cours_id, data.eleve_id, data.date_seance);
        
        if (existing) {
            db.prepare(`
                UPDATE presences 
                SET statut = ?, commentaire = ?, saisi_par = ?
                WHERE id = ?
            `).run(data.statut, data.commentaire || null, data.saisi_par || null, existing.id);
            return this.findById(existing.id);
        } else {
            const result = db.prepare(`
                INSERT INTO presences (cours_id, eleve_id, date_seance, statut, commentaire, saisi_par)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(data.cours_id, data.eleve_id, data.date_seance, data.statut, data.commentaire || null, data.saisi_par || null);
            return this.findById(result.lastInsertRowid);
        }
    }

    static findById(id) {
        return db.prepare(`
            SELECT p.*, e.nom as eleve_nom, e.prenom as eleve_prenom, c.matiere
            FROM presences p
            INNER JOIN eleves e ON p.eleve_id = e.id
            INNER JOIN cours c ON p.cours_id = c.id
            WHERE p.id = ?
        `).get(id);
    }

    static bulkCreate(dataArray) {
        const insert = db.prepare(`
            INSERT OR REPLACE INTO presences (cours_id, eleve_id, date_seance, statut, commentaire, saisi_par)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const transaction = db.transaction((rows) => {
            rows.forEach(row => {
                insert.run(row.cours_id, row.eleve_id, row.date_seance, row.statut, row.commentaire || null, row.saisi_par || null);
            });
        });
        
        transaction(dataArray);
        return dataArray.length;
    }

    static getAlertesAbsences(seuil = 3) {
        return db.prepare(`
            SELECT 
                e.id as eleve_id,
                e.nom,
                e.prenom,
                COUNT(*) as nb_absences
            FROM presences p
            INNER JOIN eleves e ON p.eleve_id = e.id
            WHERE p.statut IN ('absent', 'absent_justifie')
            AND p.date_seance >= date('now', '-30 days')
            GROUP BY e.id
            HAVING nb_absences >= ?
            ORDER BY nb_absences DESC
        `).all(seuil);
    }
}

module.exports = Presence;
