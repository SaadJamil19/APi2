const { Pool } = require('pg');
require('dotenv').config();

let db;

if (process.env.DB_MOCK === 'true') {
    console.log('Using Mock Database');
    const mockData = {
        wallets: []
    };
    db = {
        query: async (text, params) => {
            console.log('Mock DB Query:', text, params);
            // Simple mock logic for specific queries
            if (text.includes('INSERT INTO wallets')) {
                const id = params[0];
                const wallet = {
                    id: params[0],
                    label: params[1],
                    blockchain: params[2],
                    wallet_address: params[3],
                    encrypted_private_key: params[4],
                    encryption_iv: params[5],
                    is_active: true
                };
                mockData.wallets.push(wallet);
                return { rows: [wallet] };
            }
            if (text.includes('SELECT * FROM wallets')) {
                const id = params[0];
                const wallet = mockData.wallets.find(w => w.id === id);
                return { rows: wallet ? [wallet] : [] };
            }
            if (text.includes('UPDATE wallets')) {
                return { rowCount: 1 };
            }
            return { rows: [] };
        }
    };
} else {
    // Real DB Connection
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });
    db = {
        query: (text, params) => pool.query(text, params),
    };
}

// Export mock data getter for debugging
db.getMockData = () => {
    if (process.env.DB_MOCK === 'true') return mockData;
    return { error: 'Not in mock mode' };
};

module.exports = db;
