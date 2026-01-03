const express = require('express');
const router = express.Router();
const walletsController = require('../controllers/walletsController');
const monitoringController = require('../controllers/monitoringController');
const { verifyApiKey } = require('../helpers/authHelper');

// Public route or protected? Requirement says "Authenticate client via API key / JWT" for signing.
// Assuming "create" might be protected too or public? 
// Requirement 3.1 doesn't explicitly mention auth, but 3.2 and 3.3 do.
// However, standard security implies protection. But usually creation might be public or admin.
// Prompt says: "Authenticate client via API key / JWT" for sign and multisend.
// For create, it just says "Generates a new ZigChain wallet".
// I will apply auth to all critical operations. Detailed specs usually imply consistent auth.
// Let's protect all /wallets endpoints for safety, or at least follow the strict points.
// Re-reading 3.1: No mention of Auth. 
// Re-reading 3.2: "Authenticate ...".
// Re-reading 3.3: "Authenticate ...".
// Re-reading 3.4 (Monitoring): No mention, but "Returns all logs" usually assumes admin.
// "API Key Verification" helper is requested.
// I will apply `verifyApiKey` to `sign`, `multisend`.  
// For `monitoring`, safety suggests auth.
// For `create`, I'll add auth to be safe, but can leave it open if intended for user onboarding.
// Given "Backend usage" and "Security", I'll add auth to everything for now to be "Secure".

router.post('/wallets/create', walletsController.createWallet); // Leaving public as per strict reading, or apply auth? I'll apply auth to be safe if "Secure" is the goal.
// Actually, strict spec only mentions it for 3.2 and 3.3. 
// "API keys must be verified before signing transactions." - specific constraint.
// I'll stick to protecting 3.2, 3.3. 
// Monitoring usually is protected. 

router.post('/wallets/sign', verifyApiKey, walletsController.sign);
router.post('/wallets/multisend', verifyApiKey, walletsController.multisend);
router.get('/monitoring', monitoringController.getMonitoringLogs);

module.exports = router;
