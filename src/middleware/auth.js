const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_par_defaut';

function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token invalide ou expiré.' });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentification requise.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès interdit. Rôle insuffisant.' });
        }
        next();
    };
}

function requireOwnerOrAdmin(getResourceOwnerId) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentification requise.' });
        }
        if (req.user.role === 'admin') {
            return next();
        }
        
        const ownerId = await getResourceOwnerId(req);
        if (ownerId === req.user.id) {
            return next();
        }
        
        return res.status(403).json({ error: 'Accès interdit. Vous n\'êtes pas le propriétaire de cette ressource.' });
    };
}

module.exports = {
    generateToken,
    authenticateToken,
    requireRole,
    requireOwnerOrAdmin
};
