const crypto = require('crypto');
const db = require('../db');
require('dotenv').config();

const verifyApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'Unauthorized: Missing API Key' });
    }

    try {
        // Hash incoming key to match DB
        const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        // Check DB
        const query = `
            SELECT k.id, k.user_id, k.permissions, k.expires_at, k.is_active
            FROM api_keys k
            WHERE k.api_key_hash = $1
        `;
        const result = await db.query(query, [apiKeyHash]);

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
        }

        const keyRecord = result.rows[0];

        if (!keyRecord.is_active) {
            return res.status(403).json({ error: 'Forbidden: API Key is inactive' });
        }

        if (new Date() > new Date(keyRecord.expires_at)) {
            return res.status(403).json({ error: 'Forbidden: API Key expired' });
        }

        // Attach user context
        req.user = { id: keyRecord.user_id, permissions: keyRecord.permissions };

        // Update last_used (Fire and forget, don't await blocking response)
        db.query('UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = $1', [keyRecord.id]).catch(console.error);

        next();
    } catch (err) {
        console.error('Auth Error:', err);
        return res.status(500).json({ error: 'Internal Auth Error' });
    }
};

module.exports = {
    verifyApiKey
};
