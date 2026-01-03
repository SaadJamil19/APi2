const express = require('express');
const router = express.Router();
const walletsController = require('../controllers/walletsController');
const monitoringController = require('../controllers/monitoringController');
const userController = require('../controllers/userController');
const { verifyApiKey } = require('../helpers/authHelper');

// 1. PUBLIC Endpoints (Registration & Auth)
router.post('/register', userController.registerUser);
router.post('/generate-api-key', userController.generateApiKey);

// 2. PROTECTED Endpoints: All require x-api-key (Stored in DB)
router.post('/wallets/create', verifyApiKey, walletsController.createWallet);
router.post('/wallets/sign', verifyApiKey, walletsController.sign);
router.post('/wallets/multisend', verifyApiKey, walletsController.multisend);
router.get('/wallets/:id', verifyApiKey, walletsController.getWallet);
router.get('/monitoring', verifyApiKey, monitoringController.getMonitoringLogs);

module.exports = router;
