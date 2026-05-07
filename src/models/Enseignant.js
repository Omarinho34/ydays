const db = require('../config/database');

class Enseignant {
    static findAll() {
        return db.prepare(`
            SELECT e.*, u.email as user_email
            FROM enseignants e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.actif = 1
            ORDER BY e.nom, e.prenom
        `).all();
    }

    static findById(id) {
        return db.prepare(`
            SELECT e.*, u.email as user_email
            FROM enseignants e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.id = ?
        `).get(id);
    }

    static create(data) {
        const result = db.prepare(`
            INSERT INTO enseignants (nom, prenom, email, telephone, matieres, disponibilites, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.nom, data.prenom, data.email || null, data.telephone || null,
            data.matieres ? JSON.stringify(data.matieres) : null,
            data.disponibilites ? JSON.stringify(data.disponibilites) : null,
            data.user_id || null
        );
        return this.findById(result.lastInsertRowid);
    }

    static update(id, data) {
        const fields = [];
        const values = [];
        
        ['nom', 'prenom', 'email', 'telephone', 'user_id', 'actif'].forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        });
        
        if (data.matieres !== undefined) {
            fields.push('matieres = ?');
            values.push(JSON.stringify(data.matieres));
        }
        if (data.disponibilites !== undefined) {
            fields.push('disponibilites = ?');
            values.push(JSON.stringify(data.disponibilites));
        }
        
        if (fields.length === 0) return this.findById(id);
        
        values.push(id);
        db.prepare(`UPDATE enseignants SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        return this.findById(id);
    }

    static delete(id) {
        const result = db.prepare('UPDATE enseignants SET actif = 0 WHERE id = ?').run(id);
        return result.changes > 0;
    }

    static getPlanning(id, dateDebut, dateFin) {
        return db.prepare(`
            SELECT * FROM cours
            WHERE enseignant_id = ? AND actif = 1
            AND ((date_debut IS NULL OR date_debut <= ?) AND (date_fin IS NULL OR date_fin >= ?))
            ORDER BY jour_semaine, heure_debut
        `).all(id, dateFin, dateDebut);
    }

    static getAbsences(id) {
        return db.prepare(`
            SELECT * FROM absences_enseignant
            WHERE enseignant_id = ?
            ORDER BY date_debut DESC
        `).all(id);
    }

    static addAbsence(enseignantId, data) {
        const result = db.prepare(`
            INSERT INTO absences_enseignant (enseignant_id, date_debut, date_fin, motif)
            VALUES (?, ?, ?, ?)
        `).run(enseignantId, data.date_debut, data.date_fin || null, data.motif || null);
        
        return db.prepare('SELECT * FROM absences_enseignant WHERE id = ?').get(result.lastInsertRowid);
    }
}

module.exports = Enseignant;
