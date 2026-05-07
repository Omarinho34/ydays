const db = require('../config/database');

class Eleve {
    static findAll(filters = {}) {
        let query = 'SELECT * FROM eleves WHERE 1=1';
        const params = [];
        
        if (filters.statut) {
            query += ' AND statut = ?';
            params.push(filters.statut);
        }
        if (filters.niveau) {
            query += ' AND niveau_scolaire = ?';
            params.push(filters.niveau);
        }
        if (filters.search) {
            query += ' AND (nom LIKE ? OR prenom LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        
        query += ' ORDER BY nom, prenom';
        return db.prepare(query).all(...params);
    }

    static findById(id) {
        return db.prepare('SELECT * FROM eleves WHERE id = ?').get(id);
    }

    static findByGroupe(groupeId) {
        return db.prepare(`
            SELECT e.* FROM eleves e
            INNER JOIN eleve_groupe eg ON e.id = eg.eleve_id
            WHERE eg.groupe_id = ? AND e.statut = 'actif'
            ORDER BY e.nom, e.prenom
        `).all(groupeId);
    }

    static create(data) {
        const result = db.prepare(`
            INSERT INTO eleves (nom, prenom, date_naissance, niveau_scolaire, adresse, code_postal, ville,
                contact_parent_nom, contact_parent_email, contact_parent_telephone,
                contact_parent2_nom, contact_parent2_email, contact_parent2_telephone,
                notes, statut)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.nom, data.prenom, data.date_naissance || null, data.niveau_scolaire || null,
            data.adresse || null, data.code_postal || null, data.ville || null,
            data.contact_parent_nom || null, data.contact_parent_email || null, data.contact_parent_telephone || null,
            data.contact_parent2_nom || null, data.contact_parent2_email || null, data.contact_parent2_telephone || null,
            data.notes || null, data.statut || 'actif'
        );
        return this.findById(result.lastInsertRowid);
    }

    static update(id, data) {
        const current = this.findById(id);
        if (!current) return null;
        
        const fields = [];
        const values = [];
        
        ['nom', 'prenom', 'date_naissance', 'niveau_scolaire', 'adresse', 'code_postal', 'ville',
         'contact_parent_nom', 'contact_parent_email', 'contact_parent_telephone',
         'contact_parent2_nom', 'contact_parent2_email', 'contact_parent2_telephone',
         'notes', 'statut'].forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        });
        
        if (fields.length === 0) return current;
        
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        
        db.prepare(`UPDATE eleves SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        return this.findById(id);
    }

    static delete(id) {
        // Archiver plutôt que supprimer
        const result = db.prepare("UPDATE eleves SET statut = 'archive' WHERE id = ?").run(id);
        return result.changes > 0;
    }

    static getStats(id) {
        const eleve = this.findById(id);
        if (!eleve) return null;
        
        const presences = db.prepare(`
            SELECT statut, COUNT(*) as count FROM presences WHERE eleve_id = ? GROUP BY statut
        `).all(id);
        
        const paiements = db.prepare(`
            SELECT SUM(montant) as total FROM paiements WHERE eleve_id = ?
        `).get(id);
        
        return { eleve, presences, paiements };
    }
}

module.exports = Eleve;
