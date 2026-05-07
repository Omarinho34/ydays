const bcrypt = require('bcryptjs');
const db = require('../config/database');

class User {
    static findAll() {
        return db.prepare('SELECT id, email, role, nom, prenom, telephone, actif, created_at FROM users').all();
    }

    static findById(id) {
        return db.prepare('SELECT id, email, role, nom, prenom, telephone, actif, created_at FROM users WHERE id = ?').get(id);
    }

    static findByEmail(email) {
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }

    static create({ email, password, role, nom, prenom, telephone }) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = bcrypt.hashSync(password, saltRounds);
        
        const result = db.prepare(`
            INSERT INTO users (email, password_hash, role, nom, prenom, telephone)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(email, passwordHash, role, nom, prenom, telephone || null);
        
        return this.findById(result.lastInsertRowid);
    }

    static update(id, data) {
        const fields = [];
        const values = [];
        
        if (data.email) { fields.push('email = ?'); values.push(data.email); }
        if (data.role) { fields.push('role = ?'); values.push(data.role); }
        if (data.nom) { fields.push('nom = ?'); values.push(data.nom); }
        if (data.prenom) { fields.push('prenom = ?'); values.push(data.prenom); }
        if (data.telephone !== undefined) { fields.push('telephone = ?'); values.push(data.telephone); }
        if (data.actif !== undefined) { fields.push('actif = ?'); values.push(data.actif); }
        if (data.password) {
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            fields.push('password_hash = ?');
            values.push(bcrypt.hashSync(data.password, saltRounds));
        }
        
        if (fields.length === 0) return null;
        
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        
        db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        return this.findById(id);
    }

    static delete(id) {
        const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
        return result.changes > 0;
    }

    static verifyPassword(user, password) {
        return bcrypt.compareSync(password, user.password_hash);
    }
}

module.exports = User;
