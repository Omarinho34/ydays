/**
 * Service d'export PDF
 * Utilise Puppeteer pour générer les documents
 */

const puppeteer = require('puppeteer');

let __browser = null;

async function getBrowser() {
    if (!__browser) {
        __browser = await puppeteer.launch({ headless: 'new' });
    }
    return __browser;
}

function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

class PDFService {
    static async generateBulletin(data) {
        const browser = await getBrowser();
        const page = await browser.newPage();
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 2cm; }
                h1 { text-align: center; color: #2563eb; }
                .header { text-align: center; margin-bottom: 2rem; }
                .info { margin-bottom: 1.5rem; }
                .info p { margin: 0.25rem 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                th, td { border: 1px solid #ccc; padding: 0.75rem; text-align: left; }
                th { background: #f0f0f0; }
                .moyenne { font-size: 1.25rem; font-weight: bold; text-align: right; margin-top: 1rem; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Bulletin de Suivi</h1>
                <p>Association Mini-École</p>
            </div>
            <div class="info">
                <p><strong>Élève :</strong> ${escapeHtml(data.eleve.prenom)} ${escapeHtml(data.eleve.nom)}</p>
                <p><strong>Niveau :</strong> ${escapeHtml(data.eleve.niveau_scolaire) || '-'}</p>
                <p><strong>Année scolaire :</strong> ${escapeHtml(data.annee_scolaire)}</p>
                <p><strong>Trimestre :</strong> ${escapeHtml(data.trimestre)}</p>
            </div>
            <table>
                <thead>
                    <tr><th>Matière</th><th>Note</th><th>Appréciation</th></tr>
                </thead>
                <tbody>
                    ${data.notes.map(n => `
                        <tr>
                            <td>${escapeHtml(n.matiere)}</td>
                            <td>${n.valeur !== null && n.valeur !== undefined ? escapeHtml(n.valeur) + '/20' : '-'}</td>
                            <td>${escapeHtml(n.appreciation) || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${data.moyenne ? `<p class="moyenne">Moyenne générale : ${escapeHtml(data.moyenne)}/20</p>` : ''}
        </body>
        </html>`;
        
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        await page.close();
        return pdf;
    }

    static async generateRecu(paiement) {
        const browser = await getBrowser();
        const page = await browser.newPage();
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 2cm; }
                .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 1rem; margin-bottom: 2rem; }
                h1 { color: #2563eb; margin: 0; }
                .recu-info { margin: 2rem 0; }
                .recu-info p { margin: 0.5rem 0; font-size: 1.1rem; }
                .montant { font-size: 1.5rem; font-weight: bold; color: #2563eb; text-align: center; margin: 2rem 0; }
                .footer { margin-top: 3rem; font-size: 0.875rem; color: #666; text-align: center; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Reçu de Paiement</h1>
                <p>Association Mini-École</p>
            </div>
            <div class="recu-info">
                <p><strong>N° de reçu :</strong> ${escapeHtml(paiement.recu_numero) || '-'}</p>
                <p><strong>Date :</strong> ${new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}</p>
                <p><strong>Élève :</strong> ${escapeHtml(paiement.eleve_prenom)} ${escapeHtml(paiement.eleve_nom)}</p>
                <p><strong>Mode de paiement :</strong> ${escapeHtml(paiement.mode_paiement) || '-'}</p>
                <p><strong>Formule :</strong> ${escapeHtml(paiement.formule) || '-'}</p>
                ${paiement.periode_debut ? `<p><strong>Période :</strong> ${new Date(paiement.periode_debut).toLocaleDateString('fr-FR')} - ${new Date(paiement.periode_fin).toLocaleDateString('fr-FR')}</p>` : ''}
            </div>
            <div class="montant">
                Montant : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(paiement.montant)}
            </div>
            <div class="footer">
                <p>Association Mini-École - Document généré automatiquement</p>
            </div>
        </body>
        </html>`;
        
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        await page.close();
        return pdf;
    }
}

module.exports = PDFService;
