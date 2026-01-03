const db = require('../db');

const getDebugDB = (req, res) => {
    if (db.getMockData) {
        res.json(db.getMockData());
    } else {
        res.status(400).json({ error: 'Debug mode not available or not mock DB' });
    }
};

module.exports = {
    getDebugDB
};
