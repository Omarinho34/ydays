const db = require('../config/database');

class Communication {
    static findAll(filters = {}) {
        let query = `
            SELECT c.*, u.nom as envoyeur_nom, u.prenom as envoyeur_prenom
            FROM communications c
            LEFT JOIN users u ON c.envoye_par = u.id
            WHERE 1=1
        `;
        const params = [];
        
        if (filters.type) {
            query += ' AND c.type = ?';
            params.push(filters.type);
        }
        if (filters.envoye_par) {
            query += ' AND c.envoye_par = ?';
            params.push(filters.envoye_par);
        }
        
        query += ' ORDER BY c.date_envoi DESC';
        return db.prepare(query).all(...params);
    }

    static findById(id) {
        const comm = db.prepare(`
            SELECT c.*, u.nom as envoyeur_nom, u.prenom as envoyeur_prenom
            FROM communications c
            LEFT JOIN users u ON c.envoye_par = u.id
            WHERE c.id = ?
        `).get(id);
        
        if (!comm) return null;
        
        comm.destinataires = db.prepare(`
            SELECT e.* FROM eleves e
            INNER JOIN communication_eleve ce ON e.id = ce.eleve_id
            WHERE ce.communication_id = ?
        `).all(id);
        
        return comm;
    }

    static create(data) {
        const result = db.prepare(`
            INSERT INTO communications (type, destinataire_id, groupe_destinataire, sujet, contenu, envoye_par, statut)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.type, data.destinataire_id || null, data.groupe_destinataire || null,
            data.sujet || null, data.contenu, data.envoye_par || null,
            data.statut || 'envoye'
        );
        
        const commId = result.lastInsertRowid;
        
        // Associer les élèves destinataires
        if (data.eleve_ids && Array.isArray(data.eleve_ids)) {
            const stmt = db.prepare('INSERT INTO communication_eleve (communication_id, eleve_id) VALUES (?, ?)');
            data.eleve_ids.forEach(eid => {
                try { stmt.run(commId, eid); } catch (e) {}
            });
        }
        
        return this.findById(commId);
    }

    static update(id, data) {
        const fields = [];
        const values = [];
        
        ['type', 'destinataire_id', 'groupe_destinataire', 'sujet', 'contenu', 'statut'].forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        });
        
        if (fields.length === 0) return this.findById(id);
        
        values.push(id);
        db.prepare(`UPDATE communications SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        return this.findById(id);
    }

    static delete(id) {
        const result = db.prepare('DELETE FROM communications WHERE id = ?').run(id);
        return result.changes > 0;
    }

    static getByEleve(eleveId) {
        return db.prepare(`
            SELECT c.* FROM communications c
            INNER JOIN communication_eleve ce ON c.id = ce.communication_id
            WHERE ce.eleve_id = ?
            ORDER BY c.date_envoi DESC
        `).all(eleveId);
    }

    static marquerLu(communicationId, eleveId) {
        db.prepare(`
            UPDATE communication_eleve SET lu = 1 WHERE communication_id = ? AND eleve_id = ?
        `).run(communicationId, eleveId);
        return true;
    }
}

module.exports = Communication;
