const db = require('../config/database');

class Paiement {
    static findAll(filters = {}) {
        let query = `
            SELECT p.*, e.nom as eleve_nom, e.prenom as eleve_prenom
            FROM paiements p
            INNER JOIN eleves e ON p.eleve_id = e.id
            WHERE 1=1
        `;
        const params = [];
        
        if (filters.eleve_id) {
            query += ' AND p.eleve_id = ?';
            params.push(filters.eleve_id);
        }
        if (filters.date_debut) {
            query += ' AND p.date_paiement >= ?';
            params.push(filters.date_debut);
        }
        if (filters.date_fin) {
            query += ' AND p.date_paiement <= ?';
            params.push(filters.date_fin);
        }
        if (filters.impaye) {
            // Logique métier à définir selon les formules
        }
        
        query += ' ORDER BY p.date_paiement DESC';
        return db.prepare(query).all(...params);
    }

    static findById(id) {
        return db.prepare(`
            SELECT p.*, e.nom as eleve_nom, e.prenom as eleve_prenom
            FROM paiements p
            INNER JOIN eleves e ON p.eleve_id = e.id
            WHERE p.id = ?
        `).get(id);
    }

    static create(data) {
        const result = db.prepare(`
            INSERT INTO paiements (eleve_id, montant, date_paiement, mode_paiement, formule, periode_debut, periode_fin, notes, saisi_par)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.eleve_id, data.montant, data.date_paiement,
            data.mode_paiement || null, data.formule || null,
            data.periode_debut || null, data.periode_fin || null,
            data.notes || null, data.saisi_par || null
        );
        return this.findById(result.lastInsertRowid);
    }

    static update(id, data) {
        const fields = [];
        const values = [];
        
        ['eleve_id', 'montant', 'date_paiement', 'mode_paiement', 'formule',
         'periode_debut', 'periode_fin', 'notes', 'recu_genere', 'recu_numero'].forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        });
        
        if (fields.length === 0) return this.findById(id);
        
        values.push(id);
        db.prepare(`UPDATE paiements SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        return this.findById(id);
    }

    static delete(id) {
        const result = db.prepare('DELETE FROM paiements WHERE id = ?').run(id);
        return result.changes > 0;
    }

    static getStatsGlobales(dateDebut, dateFin) {
        return db.prepare(`
            SELECT 
                COUNT(*) as nb_paiements,
                SUM(montant) as total_recettes,
                mode_paiement,
                COUNT(*) as count_par_mode
            FROM paiements
            WHERE date_paiement BETWEEN ? AND ?
            GROUP BY mode_paiement
        `).all(dateDebut, dateFin);
    }

    static getImpayes() {
        return db.prepare(`
            SELECT e.*,
                (SELECT MAX(date_paiement) FROM paiements WHERE eleve_id = e.id AND formule != 'ponctuel') as dernier_paiement,
                (SELECT SUM(montant) FROM paiements WHERE eleve_id = e.id AND formule != 'ponctuel') as total_paye
            FROM eleves e
            WHERE e.statut = 'actif'
            AND (
                (SELECT MAX(date_paiement) FROM paiements WHERE eleve_id = e.id AND formule != 'ponctuel') IS NULL
                OR (SELECT MAX(date_paiement) FROM paiements WHERE eleve_id = e.id AND formule != 'ponctuel') < date('now', 'start of month')
            )
            ORDER BY e.nom, e.prenom
        `).all();
    }
}

module.exports = Paiement;
