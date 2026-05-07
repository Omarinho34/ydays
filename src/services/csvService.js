/**
 * Service d'import/export CSV
 */

const fs = require('fs');
const csv = require('fast-csv');
const { Eleve } = require('../models');

class CSVService {
    static async importEleves(filePath) {
        const results = [];
        const errors = [];
        
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv.parse({ headers: true, trim: true }))
                .on('error', reject)
                .on('data', (row) => {
                    try {
                        const eleve = Eleve.create({
                            nom: row.nom,
                            prenom: row.prenom,
                            date_naissance: row.date_naissance,
                            niveau_scolaire: row.niveau_scolaire,
                            adresse: row.adresse,
                            code_postal: row.code_postal,
                            ville: row.ville,
                            contact_parent_nom: row.contact_parent_nom,
                            contact_parent_email: row.contact_parent_email,
                            contact_parent_telephone: row.contact_parent_telephone,
                            statut: row.statut || 'actif'
                        });
                        results.push(eleve);
                    } catch (err) {
                        errors.push({ row, error: err.message });
                    }
                })
                .on('end', () => resolve({ imported: results.length, errors }));
        });
    }

    static exportEleves(outputPath, filters = {}) {
        const eleves = Eleve.findAll(filters);
        const ws = fs.createWriteStream(outputPath);
        
        const csvStream = csv.format({ headers: true });
        csvStream.pipe(ws);
        
        eleves.forEach(e => {
            csvStream.write({
                id: e.id,
                nom: e.nom,
                prenom: e.prenom,
                date_naissance: e.date_naissance,
                niveau_scolaire: e.niveau_scolaire,
                adresse: e.adresse,
                code_postal: e.code_postal,
                ville: e.ville,
                contact_parent_nom: e.contact_parent_nom,
                contact_parent_email: e.contact_parent_email,
                contact_parent_telephone: e.contact_parent_telephone,
                statut: e.statut
            });
        });
        
        csvStream.end();
        return outputPath;
    }
}

module.exports = CSVService;
