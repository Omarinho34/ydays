# Application de Gestion - Association Mini-École

## Présentation

Application web complète de gestion pour une association gérant une mini-école. Elle permet de gérer les élèves, groupes, cours, enseignants, présences, finances, suivi pédagogique et la communication.

## Architecture

```
mini-ecole/
├── src/
│   ├── app.js                 # Point d'entrée Express
│   ├── config/
│   │   └── database.js        # Configuration SQLite
│   ├── models/                # Modèles de données
│   ├── controllers/           # Logique métier
│   ├── routes/                # Routes API
│   ├── middleware/            # Middleware (auth, validation...)
│   ├── services/              # Services métier
│   └── utils/                 # Utilitaires
├── public/                    # Frontend statique
│   ├── css/
│   ├── js/
│   └── pages/
├── database/                  # Fichier SQLite
├── tests/                     # Tests
├── scripts/                   # Scripts utilitaires
└── docs/                      # Documentation
```

## Installation

```bash
# Cloner et entrer dans le projet
cd mini-ecole

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Modifier .env avec vos paramètres

# Initialiser la base de données
npm run db:init

# Lancer l'application
npm run dev
```

## Accès

- URL : http://localhost:3000
- Compte admin par défaut : admin@mini-ecole.fr / admin123

## Modules

- **Gestion des élèves** : Fiches, historique, recherche
- **Gestion des groupes** : Organisation par niveau/matière
- **Gestion des cours** : Planification, récurrences
- **Gestion des enseignants** : Profils, plannings
- **Suivi des présences** : Saisie, statistiques, alertes
- **Gestion financière** : Cotisations, impayés, reçus
- **Suivi pédagogique** : Notes, bulletins PDF
- **Communication** : Emails, SMS, notifications

## Rôles utilisateurs

- **Admin** : Accès complet
- **Secrétaire** : Inscriptions, paiements, planning
- **Enseignant** : Présences, notes, consultation
- **Parent/Élève** : Consultation uniquement

## Technologies

- **Backend** : Node.js, Express, SQLite (better-sqlite3)
- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **Sécurité** : JWT, bcrypt, helmet, rate-limiting
- **Exports** : Puppeteer (PDF), CSV natif

## Licence

MIT - Association Mini-École
