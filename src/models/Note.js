const db = require('../config/database');

class Note {
    static findByEleve(eleveId, filters = {}) {
        let query = `
            SELECT n.*, c.matiere, c.titre as cours_titre
            FROM notes n
            INNER JOIN cours c ON n.cours_id = c.id
            WHERE n.eleve_id = ?
        `;
        const params = [eleveId];
        
        if (filters.annee_scolaire) {
            query += ' AND n.annee_scolaire = ?';
            params.push(filters.annee_scolaire);
        }
        if (filters.trimestre) {
            query += ' AND n.trimestre = ?';
            params.push(filters.trimestre);
        }
        if (filters.cours_id) {
            query += ' AND n.cours_id = ?';
            params.push(filters.cours_id);
        }
        
        query += ' ORDER BY n.date_evaluation DESC';
        return db.prepare(query).all(...params);
    }

    static findById(id) {
        return db.prepare(`
            SELECT n.*, e.nom as eleve_nom, e.prenom as eleve_prenom, c.matiere
            FROM notes n
            INNER JOIN eleves e ON n.eleve_id = e.id
            INNER JOIN cours c ON n.cours_id = c.id
            WHERE n.id = ?
        `).get(id);
    }

    static create(data) {
        const result = db.prepare(`
            INSERT INTO notes (eleve_id, cours_id, valeur, appreciation, trimestre, annee_scolaire, date_evaluation, saisi_par)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.eleve_id, data.cours_id, data.valeur !== undefined ? data.valeur : null,
            data.appreciation !== undefined ? data.appreciation : null, data.trimestre || null,
            data.annee_scolaire || null, data.date_evaluation || new Date().toISOString().split('T')[0],
            data.saisi_par || null
        );
        return this.findById(result.lastInsertRowid);
    }

    static update(id, data) {
        const fields = [];
        const values = [];
        
        ['eleve_id', 'cours_id', 'valeur', 'appreciation', 'trimestre', 'annee_scolaire', 'date_evaluation'].forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        });
        
        if (fields.length === 0) return this.findById(id);
        
        values.push(id);
        db.prepare(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        return this.findById(id);
    }

    static delete(id) {
        const result = db.prepare('DELETE FROM notes WHERE id = ?').run(id);
        return result.changes > 0;
    }

    static getBulletin(eleveId, anneeScolaire, trimestre) {
        const eleve = db.prepare('SELECT * FROM eleves WHERE id = ?').get(eleveId);
        if (!eleve) return null;
        
        const notes = db.prepare(`
            SELECT n.*, c.matiere, c.titre as cours_titre
            FROM notes n
            INNER JOIN cours c ON n.cours_id = c.id
            WHERE n.eleve_id = ? AND n.annee_scolaire = ? AND n.trimestre = ?
            ORDER BY c.matiere
        `).all(eleveId, anneeScolaire, trimestre);
        
        const notesAvecValeur = notes.filter(n => n.valeur !== null && n.valeur !== undefined);
        const moyenne = notesAvecValeur.length > 0
            ? (notesAvecValeur.reduce((sum, n) => sum + n.valeur, 0) / notesAvecValeur.length).toFixed(2)
            : null;
        
        return { eleve, annee_scolaire: anneeScolaire, trimestre, notes, moyenne };
    }

    static getEvolution(eleveId) {
        const eleve = db.prepare('SELECT id FROM eleves WHERE id = ?').get(eleveId);
        if (!eleve) return null;
        return db.prepare(`
            SELECT 
                annee_scolaire,
                trimestre,
                AVG(valeur) as moyenne
            FROM notes
            WHERE eleve_id = ? AND valeur IS NOT NULL
            GROUP BY annee_scolaire, trimestre
            ORDER BY annee_scolaire, trimestre
        `).all(eleveId);
    }
}

module.exports = Note;
