const { getLogs } = require('../helpers/logger');

const getMonitoringLogs = (req, res) => {
    const logs = getLogs();
    res.json(logs);
};

module.exports = {
    getMonitoringLogs
};
