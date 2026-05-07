/**
 * Mini-École - Application Frontend
 * SPA simple vanilla JS
 */

const API_URL = '';
let currentUser = null;
let currentPage = 'dashboard';

// ===== UTILITAIRES =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function api(url, opts = {}) {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}/api${url}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        ...opts,
        body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || `Erreur ${r.status}`);
        return data;
    });
}

function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-FR');
}

function showError(msg) {
    $('#login-error').textContent = msg;
}

function clearError() {
    $('#login-error').textContent = '';
}

// ===== AUTH =====
async function login(e) {
    e.preventDefault();
    clearError();
    const email = $('#email').value;
    const password = $('#password').value;
    
    try {
        const data = await api('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
        localStorage.setItem('token', data.token);
        currentUser = data.user;
        initApp();
    } catch (err) {
        showError(err.message);
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    location.reload();
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
        currentUser = await api('/auth/me');
        return true;
    } catch {
        localStorage.removeItem('token');
        return false;
    }
}

// ===== NAVIGATION =====
function navigate(page) {
    currentPage = page;
    $$('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));
    $('#page-title').textContent = page.charAt(0).toUpperCase() + page.slice(1);
    loadPage(page);
}

function loadPage(page) {
    const container = $('#page-content');
    container.innerHTML = '<p>Chargement...</p>';
    
    switch (page) {
        case 'dashboard': renderDashboard(container); break;
        case 'eleves': renderEleves(container); break;
        case 'groupes': renderGroupes(container); break;
        case 'cours': renderCours(container); break;
        case 'enseignants': renderEnseignants(container); break;
        case 'presences': renderPresences(container); break;
        case 'paiements': renderPaiements(container); break;
        case 'notes': renderNotes(container); break;
        case 'communications': renderCommunications(container); break;
        default: container.innerHTML = '<p>Page en construction.</p>';
    }
}

// ===== RENDERS =====
async function renderDashboard(container) {
    try {
        const data = await api('/dashboard');
        container.innerHTML = `
            <div class="grid mb-3">
                <div class="card">
                    <div class="card-header"><span class="card-title">Élèves actifs</span><span class="card-icon">👨‍🎓</span></div>
                    <div class="card-value">${data.nbEleves}</div>
                </div>
                <div class="card">
                    <div class="card-header"><span class="card-title">Groupes</span><span class="card-icon">👥</span></div>
                    <div class="card-value">${data.nbGroupes}</div>
                </div>
                <div class="card">
                    <div class="card-header"><span class="card-title">Enseignants</span><span class="card-icon">👩‍🏫</span></div>
                    <div class="card-value">${data.nbEnseignants}</div>
                </div>
                <div class="card">
                    <div class="card-header"><span class="card-title">Cours actifs</span><span class="card-icon">📚</span></div>
                    <div class="card-value">${data.nbCours}</div>
                </div>
            </div>
            <div class="grid">
                <div class="card">
                    <div class="card-header"><span class="card-title">Recettes du mois</span><span class="card-icon">💶</span></div>
                    <div class="card-value">${data.totalPaiementsMois.toFixed(2)} €</div>
                </div>
                <div class="card">
                    <div class="card-header"><span class="card-title">Alertes absences</span><span class="card-icon">⚠️</span></div>
                    <div class="card-value ${data.alertesAbsences > 0 ? 'text-danger' : ''}">${data.alertesAbsences}</div>
                </div>
            </div>
            ${data.alertesAbsencesDetails.length ? `
            <div class="table-container mt-2">
                <h3 class="mb-2">Absences récentes</h3>
                <table class="table">
                    <thead><tr><th>Élève</th><th>Nb absences (30j)</th></tr></thead>
                    <tbody>
                        ${data.alertesAbsencesDetails.map(a => `<tr><td>${a.prenom} ${a.nom}</td><td class="text-danger">${a.nb_absences}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>` : ''}
        `;
    } catch (err) {
        container.innerHTML = `<div class="alert alert-danger">Erreur : ${err.message}</div>`;
    }
}

async function renderEleves(container) {
    container.innerHTML = `
        <div class="toolbar">
            <input type="text" id="search-eleves" placeholder="Rechercher un élève...">
            <select id="filter-niveau"><option value="">Tous les niveaux</option></select>
            <button class="btn btn-success" onclick="openModal('eleve')">+ Ajouter un élève</button>
        </div>
        <div id="eleves-list" class="table-container"><p>Chargement...</p></div>
    `;
    
    try {
        const eleves = await api('/eleves');
        const list = $('#eleves-list');
        if (!eleves.length) {
            list.innerHTML = '<p class="p-2">Aucun élève trouvé.</p>';
            return;
        }
        list.innerHTML = `
            <table class="table">
                <thead>
                    <tr><th>Nom</th><th>Prénom</th><th>Niveau</th><th>Statut</th><th>Contact parent</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${eleves.map(e => `
                        <tr>
                            <td>${e.nom}</td>
                            <td>${e.prenom}</td>
                            <td>${e.niveau_scolaire || '-'}</td>
                            <td><span class="badge ${e.statut === 'actif' ? '' : 'btn-secondary'}">${e.statut}</span></td>
                            <td>${e.contact_parent_telephone || '-'}</td>
                            <td class="actions">
                                <button class="btn-icon" title="Voir">👁️</button>
                                <button class="btn-icon" title="Modifier">✏️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        container.innerHTML = `<div class="alert alert-danger">Erreur : ${err.message}</div>`;
    }
}

function renderGroupes(container) {
    container.innerHTML = '<div class="alert alert-info">Module Groupes - En construction. Utilisez l\'API directement.</div>';
}

function renderCours(container) {
    container.innerHTML = '<div class="alert alert-info">Module Cours - En construction. Utilisez l\'API directement.</div>';
}

function renderEnseignants(container) {
    container.innerHTML = '<div class="alert alert-info">Module Enseignants - En construction. Utilisez l\'API directement.</div>';
}

function renderPresences(container) {
    container.innerHTML = '<div class="alert alert-info">Module Présences - En construction. Utilisez l\'API directement.</div>';
}

function renderPaiements(container) {
    container.innerHTML = '<div class="alert alert-info">Module Finances - En construction. Utilisez l\'API directement.</div>';
}

function renderNotes(container) {
    container.innerHTML = '<div class="alert alert-info">Module Pédagogie - En construction. Utilisez l\'API directement.</div>';
}

function renderCommunications(container) {
    container.innerHTML = '<div class="alert alert-info">Module Communication - En construction. Utilisez l\'API directement.</div>';
}

function openModal(type) {
    alert(`Modal ${type} - En construction`);
}

// ===== INITIALISATION =====
async function initApp() {
    const isAuth = await checkAuth();
    
    if (!isAuth) {
        $('#auth-screen').classList.remove('hidden');
        $('#main-app').classList.add('hidden');
        return;
    }
    
    $('#auth-screen').classList.add('hidden');
    $('#main-app').classList.remove('hidden');
    
    $('#user-name').textContent = `${currentUser.prenom} ${currentUser.nom}`;
    $('#user-role').textContent = currentUser.role;
    
    // Masquer certaines routes selon le rôle
    if (currentUser.role === 'enseignant') {
        $$('[data-page="eleves"], [data-page="groupes"], [data-page="paiements"]').forEach(el => el.style.display = 'none');
    } else if (currentUser.role === 'parent') {
        $$('.sidebar-nav a').forEach(el => {
            if (!['dashboard','eleves','notes','communications'].includes(el.dataset.page)) {
                el.style.display = 'none';
            }
        });
    }
    
    // Navigation
    $$('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(link.dataset.page);
        });
    });
    
    $('#logout-btn').addEventListener('click', logout);
    
    // Route initiale
    const hash = location.hash.replace('#', '') || 'dashboard';
    navigate(hash);
}

// Démarrage
document.addEventListener('DOMContentLoaded', () => {
    $('#login-form').addEventListener('submit', login);
    initApp();
});
