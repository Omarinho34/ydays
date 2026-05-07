-- Schéma de base de données - Association Mini-École
-- SQLite

-- Table des utilisateurs (authentification)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'secretaire', 'enseignant', 'parent')),
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    telephone TEXT,
    actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des élèves
CREATE TABLE IF NOT EXISTS eleves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    date_naissance DATE,
    niveau_scolaire TEXT,
    adresse TEXT,
    code_postal TEXT,
    ville TEXT,
    contact_parent_nom TEXT,
    contact_parent_email TEXT,
    contact_parent_telephone TEXT,
    contact_parent2_nom TEXT,
    contact_parent2_email TEXT,
    contact_parent2_telephone TEXT,
    statut TEXT DEFAULT 'actif' CHECK(statut IN ('actif', 'inactif', 'archive')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des groupes
CREATE TABLE IF NOT EXISTS groupes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    niveau TEXT,
    description TEXT,
    type TEXT DEFAULT 'niveau' CHECK(type IN ('niveau', 'mixte', 'special')),
    actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison élèves-groupes
CREATE TABLE IF NOT EXISTS eleve_groupe (
    eleve_id INTEGER NOT NULL,
    groupe_id INTEGER NOT NULL,
    date_debut DATE DEFAULT CURRENT_DATE,
    date_fin DATE,
    PRIMARY KEY (eleve_id, groupe_id),
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE
);

-- Table des enseignants
CREATE TABLE IF NOT EXISTS enseignants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    matieres TEXT, -- JSON array
    disponibilites TEXT, -- JSON object
    user_id INTEGER,
    actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des cours
CREATE TABLE IF NOT EXISTS cours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matiere TEXT NOT NULL,
    titre TEXT,
    description TEXT,
    enseignant_id INTEGER,
    salle TEXT,
    date_debut DATE,
    date_fin DATE,
    heure_debut TIME,
    heure_fin TIME,
    jour_semaine INTEGER, -- 0=dimanche, 1=lundi...
    recurrence TEXT DEFAULT 'ponctuel' CHECK(recurrence IN ('ponctuel', 'hebdomadaire', 'bimensuel', 'mensuel')),
    actif INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE SET NULL
);

-- Table de liaison cours-groupes
CREATE TABLE IF NOT EXISTS cours_groupe (
    cours_id INTEGER NOT NULL,
    groupe_id INTEGER NOT NULL,
    PRIMARY KEY (cours_id, groupe_id),
    FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
    FOREIGN KEY (groupe_id) REFERENCES groupes(id) ON DELETE CASCADE
);

-- Table de liaison cours-élèves (élèves individuels assignés)
CREATE TABLE IF NOT EXISTS cours_eleve (
    cours_id INTEGER NOT NULL,
    eleve_id INTEGER NOT NULL,
    PRIMARY KEY (cours_id, eleve_id),
    FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE
);

-- Table des présences
CREATE TABLE IF NOT EXISTS presences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cours_id INTEGER NOT NULL,
    eleve_id INTEGER NOT NULL,
    date_seance DATE NOT NULL,
    statut TEXT NOT NULL CHECK(statut IN ('present', 'absent', 'absent_justifie', 'retard')),
    commentaire TEXT,
    saisi_par INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (saisi_par) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS paiements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eleve_id INTEGER NOT NULL,
    montant REAL NOT NULL,
    date_paiement DATE NOT NULL,
    mode_paiement TEXT CHECK(mode_paiement IN ('especes', 'cheque', 'virement', 'carte', 'autre')),
    formule TEXT CHECK(formule IN ('mensuel', 'trimestriel', 'annuel', 'ponctuel')),
    periode_debut DATE,
    periode_fin DATE,
    recu_genere INTEGER DEFAULT 0,
    recu_numero TEXT,
    notes TEXT,
    saisi_par INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (saisi_par) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des notes et appréciations
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eleve_id INTEGER NOT NULL,
    cours_id INTEGER NOT NULL,
    valeur REAL,
    appreciation TEXT,
    trimestre INTEGER,
    annee_scolaire TEXT,
    date_evaluation DATE,
    saisi_par INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (cours_id) REFERENCES cours(id) ON DELETE CASCADE,
    FOREIGN KEY (saisi_par) REFERENCES users(id) ON DELETE SET NULL
);

-- Table des communications
CREATE TABLE IF NOT EXISTS communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('email', 'sms', 'notification')),
    destinataire_id INTEGER,
    groupe_destinataire TEXT,
    sujet TEXT,
    contenu TEXT NOT NULL,
    envoye_par INTEGER,
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    statut TEXT DEFAULT 'envoye' CHECK(statut IN ('brouillon', 'envoye', 'erreur')),
    FOREIGN KEY (envoye_par) REFERENCES users(id) ON DELETE SET NULL
);

-- Table de liaison communications-élèves (pour les messages groupés)
CREATE TABLE IF NOT EXISTS communication_eleve (
    communication_id INTEGER NOT NULL,
    eleve_id INTEGER NOT NULL,
    lu INTEGER DEFAULT 0,
    PRIMARY KEY (communication_id, eleve_id),
    FOREIGN KEY (communication_id) REFERENCES communications(id) ON DELETE CASCADE,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE
);

-- Table des absences enseignants
CREATE TABLE IF NOT EXISTS absences_enseignant (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enseignant_id INTEGER NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE,
    motif TEXT,
    notifie INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE CASCADE
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_eleves_nom ON eleves(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_eleves_niveau ON eleves(niveau_scolaire);
CREATE INDEX IF NOT EXISTS idx_eleves_statut ON eleves(statut);
CREATE INDEX IF NOT EXISTS idx_presences_eleve ON presences(eleve_id, date_seance);
CREATE INDEX IF NOT EXISTS idx_presences_cours ON presences(cours_id, date_seance);
CREATE INDEX IF NOT EXISTS idx_paiements_eleve ON paiements(eleve_id, date_paiement);
CREATE INDEX IF NOT EXISTS idx_notes_eleve ON notes(eleve_id, annee_scolaire);
CREATE INDEX IF NOT EXISTS idx_cours_enseignant ON cours(enseignant_id);
CREATE INDEX IF NOT EXISTS idx_cours_date ON cours(jour_semaine, heure_debut);
