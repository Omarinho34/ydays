const db = require('../config/database');

class Cours {
    static findAll(filters = {}) {
        let query = `
            SELECT c.*, e.nom as enseignant_nom, e.prenom as enseignant_prenom
            FROM cours c
            LEFT JOIN enseignants e ON c.enseignant_id = e.id
            WHERE c.actif = 1
        `;
        const params = [];
        
        if (filters.enseignant_id) {
            query += ' AND c.enseignant_id = ?';
            params.push(filters.enseignant_id);
        }
        if (filters.matiere) {
            query += ' AND c.matiere = ?';
            params.push(filters.matiere);
        }
        if (filters.jour_semaine !== undefined) {
            query += ' AND c.jour_semaine = ?';
            params.push(filters.jour_semaine);
        }
        
        query += ' ORDER BY c.jour_semaine, c.heure_debut';
        return db.prepare(query).all(...params);
    }

    static findById(id) {
        const cours = db.prepare(`
            SELECT c.*, e.nom as enseignant_nom, e.prenom as enseignant_prenom
            FROM cours c
            LEFT JOIN enseignants e ON c.enseignant_id = e.id
            WHERE c.id = ?
        `).get(id);

        if (!cours) return null;

        cours.groupes = db.prepare(`
            SELECT g.* FROM groupes g
            INNER JOIN cours_groupe cg ON g.id = cg.groupe_id
            WHERE cg.cours_id = ?
        `).all(id);

        // Élèves assignés individuellement au cours
        const elevesIndividuels = db.prepare(`
            SELECT e.* FROM eleves e
            INNER JOIN cours_eleve ce ON e.id = ce.eleve_id
            WHERE ce.cours_id = ? AND e.statut = 'actif'
        `).all(id);

        // Élèves des groupes liés au cours
        const elevesDesGroupes = db.prepare(`
            SELECT DISTINCT e.* FROM eleves e
            INNER JOIN eleve_groupe eg ON e.id = eg.eleve_id
            INNER JOIN cours_groupe cg ON eg.groupe_id = cg.groupe_id
            WHERE cg.cours_id = ? AND e.statut = 'actif'
            ORDER BY e.nom, e.prenom
        `).all(id);

        // Fusion + déduplication
        const eleveMap = new Map();
        [...elevesIndividuels, ...elevesDesGroupes].forEach(e => {
            if (!eleveMap.has(e.id)) eleveMap.set(e.id, e);
        });
        cours.eleves = Array.from(eleveMap.values());

        return cours;
    }

    static create(data) {
        const result = db.prepare(`
            INSERT INTO cours (matiere, titre, description, enseignant_id, salle, date_debut, date_fin, heure_debut, heure_fin, jour_semaine, recurrence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.matiere, data.titre || null, data.description || null,
            data.enseignant_id || null, data.salle || null,
            data.date_debut || null, data.date_fin || null,
            data.heure_debut || null, data.heure_fin || null,
            data.jour_semaine || null, data.recurrence || 'ponctuel'
        );
        
        const coursId = result.lastInsertRowid;
        
        // Associer les groupes
        if (data.groupe_ids && Array.isArray(data.groupe_ids)) {
            const stmt = db.prepare('INSERT INTO cours_groupe (cours_id, groupe_id) VALUES (?, ?)');
            data.groupe_ids.forEach(gid => {
                try { stmt.run(coursId, gid); } catch (e) {}
            });
        }
        
        // Associer les élèves individuels
        if (data.eleve_ids && Array.isArray(data.eleve_ids)) {
            const stmt = db.prepare('INSERT INTO cours_eleve (cours_id, eleve_id) VALUES (?, ?)');
            data.eleve_ids.forEach(eid => {
                try { stmt.run(coursId, eid); } catch (e) {}
            });
        }
        
        return this.findById(coursId);
    }

    static update(id, data) {
        const fields = [];
        const values = [];
        
        ['matiere', 'titre', 'description', 'enseignant_id', 'salle', 'date_debut', 'date_fin',
         'heure_debut', 'heure_fin', 'jour_semaine', 'recurrence', 'actif'].forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        });
        
        if (fields.length > 0) {
            values.push(id);
            db.prepare(`UPDATE cours SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        }
        
        // Mettre à jour les associations de groupes
        if (data.groupe_ids !== undefined) {
            db.prepare('DELETE FROM cours_groupe WHERE cours_id = ?').run(id);
            if (Array.isArray(data.groupe_ids)) {
                const stmt = db.prepare('INSERT INTO cours_groupe (cours_id, groupe_id) VALUES (?, ?)');
                data.groupe_ids.forEach(gid => {
                    try { stmt.run(id, gid); } catch (e) {}
                });
            }
        }
        
        // Mettre à jour les associations d'élèves
        if (data.eleve_ids !== undefined) {
            db.prepare('DELETE FROM cours_eleve WHERE cours_id = ?').run(id);
            if (Array.isArray(data.eleve_ids)) {
                const stmt = db.prepare('INSERT INTO cours_eleve (cours_id, eleve_id) VALUES (?, ?)');
                data.eleve_ids.forEach(eid => {
                    try { stmt.run(id, eid); } catch (e) {}
                });
            }
        }
        
        return this.findById(id);
    }

    static delete(id) {
        const result = db.prepare('UPDATE cours SET actif = 0 WHERE id = ?').run(id);
        return result.changes > 0;
    }

    static isEleveInscrit(coursId, eleveId) {
        const individuel = db.prepare(`
            SELECT 1 FROM cours_eleve
            WHERE cours_id = ? AND eleve_id = ?
        `).get(coursId, eleveId);
        if (individuel) return true;

        const groupe = db.prepare(`
            SELECT 1 FROM eleve_groupe eg
            INNER JOIN cours_groupe cg ON eg.groupe_id = cg.groupe_id
            WHERE cg.cours_id = ? AND eg.eleve_id = ?
        `).get(coursId, eleveId);
        return !!groupe;
    }

    static getPlanning(semaineDebut, semaineFin, filters = {}) {
        let query = `
            SELECT c.*, e.nom as enseignant_nom, e.prenom as enseignant_prenom
            FROM cours c
            LEFT JOIN enseignants e ON c.enseignant_id = e.id
            WHERE c.actif = 1
            AND ((c.date_debut IS NULL OR c.date_debut <= ?) AND (c.date_fin IS NULL OR c.date_fin >= ?))
        `;
        const params = [semaineFin, semaineDebut];
        
        if (filters.enseignant_id) {
            query += ' AND c.enseignant_id = ?';
            params.push(filters.enseignant_id);
        }
        
        query += ' ORDER BY c.jour_semaine, c.heure_debut';
        return db.prepare(query).all(...params);
    }
}

module.exports = Cours;
