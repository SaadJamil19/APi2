const db = require('../db');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const registerUser = async (req, res) => {
    try {
        const { username, email } = req.body;
        if (!username || !email) {
            return res.status(400).json({ error: 'Username and Email are required' });
        }

        // Just a dummy hash for now as per requirements (password logic wasn't fully specified, but field is needed)
        const passwordHash = crypto.createHash('sha256').update('dummy_password').digest('hex');

        const userId = uuidv4();
        const query = `
            INSERT INTO users (id, username, email, password_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email
        `;
        const result = await db.query(query, [userId, username, email, passwordHash]);

        res.status(201).json({
            message: 'User registered successfully',
            user: result.rows[0]
        });
    } catch (err) {
        console.error('Registration Error:', err);
        if (err.constraint === 'users_email_key') return res.status(409).json({ error: 'Email already exists' });
        if (err.constraint === 'users_username_key') return res.status(409).json({ error: 'Username already exists' });
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

const generateApiKey = async (req, res) => {
    try {
        const { email, admin_secret } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // 1. Verify Admin Secret (Security Layer)
        if (admin_secret !== process.env.ADMIN_SECRET) {
            return res.status(403).json({ error: 'Forbidden: Invalid Admin Secret' });
        }

        // 2. Check if Email is Authorized
        const authorizedEmails = (process.env.AUTHORIZED_EMAILS || '').split(',');
        if (!authorizedEmails.includes(email)) {
            return res.status(403).json({ error: 'Unauthorized: This email is not allowed to generate keys' });
        }

        // Find user
        const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found. Register first.' });
        }
        const userId = userRes.rows[0].id;

        // Generate Key
        const prefix = 'sk_live_';
        const randomPart = crypto.randomBytes(24).toString('hex');
        const plainApiKey = prefix + randomPart;

        // Hash Key for Storage
        const apiKeyHash = crypto.createHash('sha256').update(plainApiKey).digest('hex');

        // Allow user to specify duration (in seconds), default to env or 1 hour
        let expirationSeconds = parseInt(req.body.duration) || parseInt(process.env.API_KEY_DURATION) || 3600;

        // Optional: Cap it at some logical max if you want (e.g., 30 days = 2592000)
        // expirationSeconds = Math.min(expirationSeconds, 2592000); 

        const expiresAt = new Date(Date.now() + expirationSeconds * 1000);

        const insertQuery = `
            INSERT INTO api_keys (id, user_id, key_name, api_key_hash, api_key_prefix, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, expires_at
        `;

        await db.query(insertQuery, [uuidv4(), userId, 'Default Key', apiKeyHash, prefix, expiresAt]);

        res.status(201).json({
            message: 'API Key Generated',
            api_key: plainApiKey,
            expires_at: expiresAt,
            note: 'Save this key! It will not be shown again.'
        });

    } catch (err) {
        console.error('Key Gen Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { registerUser, generateApiKey };
