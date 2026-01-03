const jwt = require('jsonwebtoken');
require('dotenv').config();

const getSessionKey = (req, res) => {
    const { admin_secret } = req.body;

    if (!admin_secret) {
        return res.status(400).json({ error: 'Missing admin_secret' });
    }

    if (admin_secret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ error: 'Forbidden: Invalid Admin Secret' });
    }

    // Generate Session Key (JWT)
    // Expires in 1 hour
    const token = jwt.sign(
        { role: 'session_user', timestamp: Date.now() },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({
        message: 'Session Key Generated',
        session_key: token,
        expires_in: '1h'
    });
};

module.exports = {
    getSessionKey
};
