const http = require('http');
const { spawn } = require('child_process');

// CONFIG
const PORT = 3007;
const ADMIN_SECRET = 'my_super_secret_admin_code';
const WRONG_SECRET = 'invalid_code';

// Helper for requests
function makeRequest(path, method, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch (e) { }
                resolve({ statusCode: res.statusCode, body: parsed });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('--- Auth Flow Verification ---');

    // 1. Try to create wallet WITHOUT Key (Should Fail)
    console.log('\n1. Test: Create Wallet WITHOUT Session Key');
    const noKeyRes = await makeRequest('/wallets/create', 'POST', { label: 'Fail' });
    if (noKeyRes.statusCode !== 401) throw new Error(`Expected 401, got ${noKeyRes.statusCode}`);
    console.log('✅ Blocked correctly (401)');

    // 2. Try to get key with WRONG secret
    console.log('\n2. Test: Get Session Key with INVALID Secret');
    const wrongRes = await makeRequest('/get-session-key', 'POST', { admin_secret: WRONG_SECRET });
    if (wrongRes.statusCode !== 403) throw new Error(`Expected 403, got ${wrongRes.statusCode}`);
    console.log('✅ Blocked correctly (403)');

    // 3. Get Session Key with CORRECT secret
    console.log('\n3. Test: Get Session Key with VALID Secret');
    const keyRes = await makeRequest('/get-session-key', 'POST', { admin_secret: ADMIN_SECRET });
    if (keyRes.statusCode !== 200 || !keyRes.body.session_key) throw new Error('Failed to get session key');
    const sessionKey = keyRes.body.session_key;
    console.log('✅ Got Session Key:', sessionKey.substring(0, 20) + '...');

    // 4. Create Wallet WITH Session Key
    console.log('\n4. Test: Create Wallet WITH Session Key');
    const createRes = await makeRequest('/wallets/create', 'POST', {
        label: 'Auth Success Wallet',
        blockchain: 'solana'
    }, { 'x-session-key': sessionKey });

    if (createRes.statusCode !== 201 || !createRes.body.wallet_id) {
        console.log('Body:', createRes.body);
        throw new Error(`Create Failed with status ${createRes.statusCode}`);
    }
    const walletId = createRes.body.wallet_id;
    console.log('✅ Wallet Created Successfully. ID:', walletId);

    // 5. Fetch Wallet WITH Session Key
    console.log('\n5. Test: Get Wallet WITH Session Key');
    const getRes = await makeRequest(`/wallets/${walletId}`, 'GET', null, { 'x-session-key': sessionKey });
    if (getRes.statusCode !== 200 || getRes.body.id !== walletId) throw new Error('Failed to fetch wallet');
    console.log('✅ Wallet Fetched Successfully.');

    console.log('\n--- ALL AUTH TESTS PASSED ---');
}

// Spawn Server
async function main() {
    const serverProcess = spawn('node', ['server.js'], {
        env: {
            ...process.env,
            PORT: PORT,
            DB_MOCK: 'true',
            ADMIN_SECRET: ADMIN_SECRET,
            JWT_SECRET: 'test_jwt_secret'
        },
        stdio: 'inherit'
    });

    await new Promise(r => setTimeout(r, 2000)); // Wait start

    try {
        await runTests();
    } catch (err) {
        console.error('❌ FAILED:', err.message);
        process.exitCode = 1;
    } finally {
        serverProcess.kill();
    }
}

main();
