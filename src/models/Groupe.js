const db = require('../config/database');

class Groupe {
    static findAll() {
        return db.prepare('SELECT * FROM groupes WHERE actif = 1 ORDER BY nom').all();
    }

    static findById(id) {
        return db.prepare('SELECT * FROM groupes WHERE id = ?').get(id);
    }

    static findByIdWithEleves(id) {
        const groupe = this.findById(id);
        if (!groupe) return null;
        
        const eleves = db.prepare(`
            SELECT e.* FROM eleves e
            INNER JOIN eleve_groupe eg ON e.id = eg.eleve_id
            WHERE eg.groupe_id = ? AND e.statut = 'actif'
            ORDER BY e.nom, e.prenom
        `).all(id);
        
        const cours = db.prepare(`
            SELECT c.* FROM cours c
            INNER JOIN cours_groupe cg ON c.id = cg.cours_id
            WHERE cg.groupe_id = ? AND c.actif = 1
        `).all(id);
        
        return { ...groupe, eleves, cours };
    }

    static create(data) {
        const result = db.prepare(`
            INSERT INTO groupes (nom, niveau, description, type)
            VALUES (?, ?, ?, ?)
        `).run(data.nom, data.niveau || null, data.description || null, data.type || 'niveau');
        return this.findById(result.lastInsertRowid);
    }

    static update(id, data) {
        const fields = [];
        const values = [];
        
        ['nom', 'niveau', 'description', 'type', 'actif'].forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        });
        
        if (fields.length === 0) return this.findById(id);
        
        values.push(id);
        db.prepare(`UPDATE groupes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        return this.findById(id);
    }

    static delete(id) {
        const result = db.prepare('UPDATE groupes SET actif = 0 WHERE id = ?').run(id);
        return result.changes > 0;
    }

    static addEleve(groupeId, eleveId) {
        try {
            db.prepare(`
                INSERT INTO eleve_groupe (eleve_id, groupe_id) VALUES (?, ?)
            `).run(eleveId, groupeId);
            return true;
        } catch (e) {
            return false;
        }
    }

    static removeEleve(groupeId, eleveId) {
        const result = db.prepare(`
            DELETE FROM eleve_groupe WHERE eleve_id = ? AND groupe_id = ?
        `).run(eleveId, groupeId);
        return result.changes > 0;
    }

    static getStats(id) {
        const groupe = this.findById(id);
        if (!groupe) return null;
        
        const nbEleves = db.prepare(`
            SELECT COUNT(*) as count FROM eleve_groupe WHERE groupe_id = ?
        `).get(id);
        
        const tauxPresence = db.prepare(`
            SELECT 
                COUNT(CASE WHEN statut = 'present' THEN 1 END) * 100.0 / COUNT(*) as taux
            FROM presences p
            INNER JOIN cours_groupe cg ON p.cours_id = cg.cours_id
            WHERE cg.groupe_id = ?
        `).get(id);
        
        return { ...groupe, nbEleves: nbEleves.count, tauxPresence: tauxPresence?.taux || 0 };
    }
}

module.exports = Groupe;
