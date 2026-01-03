// In-memory log storage
const requestLogs = [];

const logRequest = (req, res, next) => {
    const logEntry = {
        apiKey: req.headers['x-api-key'] || 'N/A',
        ip: req.ip,
        endpoint: req.originalUrl,
        timestamp: new Date().toISOString()
    };

    requestLogs.push(logEntry);
    next();
};

const getLogs = () => {
    return requestLogs;
};

module.exports = {
    logRequest,
    getLogs
};
