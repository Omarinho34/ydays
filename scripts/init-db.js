require('dotenv').config();

const db = require('../src/config/database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

function initDatabase() {
    console.log('Initialisation de la base de données...');
    
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Exécuter le schéma
    db.exec(schema);
    console.log('Schéma créé avec succès.');
    
    // Créer l'utilisateur admin par défaut
    const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@mini-ecole.fr');
    
    if (!adminExists) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = bcrypt.hashSync('admin123', saltRounds);
        
        const insertUser = db.prepare(`
            INSERT INTO users (email, password_hash, role, nom, prenom, telephone)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        insertUser.run('admin@mini-ecole.fr', hashedPassword, 'admin', 'Admin', 'Système', '0123456789');
        console.log('Utilisateur admin créé : admin@mini-ecole.fr / admin123');
    } else {
        console.log('L\'utilisateur admin existe déjà.');
    }
    
    console.log('Base de données initialisée avec succès !');
}

if (require.main === module) {
    initDatabase();
}

module.exports = initDatabase;
