/**
 * Tests de base pour l'API Mini-École
 */

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

describe('API Mini-École', () => {
    let token;
    const generatedTeacherEmails = [];

    afterAll(() => {
        generatedTeacherEmails.forEach(email => {
            db.prepare('DELETE FROM enseignants WHERE email = ?').run(email);
            db.prepare('DELETE FROM users WHERE email = ?').run(email);
        });
    });

    test('Health check', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    test('Login admin', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@mini-ecole.fr', password: 'admin123' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.role).toBe('admin');
        token = res.body.token;
    });

    test('Login échoue avec mauvais password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@mini-ecole.fr', password: 'wrong' });
        expect(res.status).toBe(401);
    });

    test('Dashboard protégé', async () => {
        const resNoAuth = await request(app).get('/api/dashboard');
        expect(resNoAuth.status).toBe(401);

        const res = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.nbEleves).toBeGreaterThanOrEqual(0);
    });

    test('Liste des élèves', async () => {
        const res = await request(app)
            .get('/api/eleves')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('Liste des groupes', async () => {
        const res = await request(app)
            .get('/api/groupes')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('Création enseignant génère un compte de connexion', async () => {
        const email = `enseignant.test.${Date.now()}@mini-ecole.fr`;
        generatedTeacherEmails.push(email);
        const res = await request(app)
            .post('/api/enseignants')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nom: 'Compte',
                prenom: 'Test',
                email,
                telephone: '0600000000',
                matieres: ['Mathématiques']
            });

        expect(res.status).toBe(201);
        expect(res.body.user_id).toBeDefined();
        expect(res.body.generatedAccount).toBeDefined();
        expect(res.body.generatedAccount.email).toBe(email);
        expect(res.body.generatedAccount.role).toBe('enseignant');
        expect(res.body.generatedAccount.password).toHaveLength(12);

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email, password: res.body.generatedAccount.password });
        expect(login.status).toBe(200);
        expect(login.body.user.role).toBe('enseignant');
    });
});
