/**
 * Utilitaires divers
 */

function generateRecuNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `REC-${year}-${random}`;
}

function formatMontant(montant) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
}

function getCurrentSchoolYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    if (month >= 8) {
        return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
}

function getCurrentTrimestre() {
    const month = new Date().getMonth();
    if (month >= 8 && month <= 10) return 1;
    if (month >= 11 && month <= 1) return 2;
    return 3;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeString(str) {
    if (!str) return '';
    return str.replace(/[<>]/g, '').trim();
}

module.exports = {
    generateRecuNumber,
    formatMontant,
    getCurrentSchoolYear,
    getCurrentTrimestre,
    validateEmail,
    sanitizeString
};
