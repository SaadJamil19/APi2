const http = require('http');

// CONFIG
const PORT = 3006;
const API_KEY = 'mywins';
const MASTER_KEY = 'super_master_key'; // We will set this in ENV for the test

// Helper
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
    console.log('--- Testing Secure Fetch Endpoint ---');

    // 1. Create a Wallet (Public)
    console.log('\n1. Creating dummy wallet...');
    const createRes = await makeRequest('/wallets/create', 'POST', {
        label: 'Test Fetch Wallet',
        blockchain: 'solana'
    });

    if (createRes.statusCode !== 201) throw new Error('Failed to create wallet');
    const walletId = createRes.body.wallet_id;
    console.log('✅ Created Wallet ID:', walletId);

    // 2. Try Fetching WITHOUT Master Key (Should Fail)
    console.log('\n2. Attempting fetch WITHOUT Master Key...');
    const failRes = await makeRequest(`/wallets/${walletId}`, 'GET');
    console.log('Response Status:', failRes.statusCode);

    if (failRes.statusCode !== 401) {
        console.error('FAIL: Expected 401, got', failRes.statusCode);
        process.exit(1);
    }
    console.log('✅ Correctly blocked (401 Unauthorized)');

    // 3. Try Fetching WITH Master Key (Should Pass)
    console.log('\n3. Attempting fetch WITH Master Key...');
    const passRes = await makeRequest(`/wallets/${walletId}`, 'GET', null, {
        'x-master-key': process.env.MASTER_KEY || MASTER_KEY // Use env or default
    });
    console.log('Response Status:', passRes.statusCode);
    console.log('Body:', passRes.body);

    if (passRes.statusCode !== 200) {
        throw new Error('Failed to fetch wallet with master key');
    }
    if (passRes.body.id !== walletId) {
        throw new Error('Fetched wallet ID mismatch');
    }
    if (passRes.body.encrypted_private_key) {
        console.warn('WARNING: Private key was returned! Use caution.');
    } else {
        console.log('✅ Private key NOT exposed (Good).');
    }

    console.log('✅ Fetch Successful.');
    console.log('\n--- ALL TESTS PASSED ---');
}

// We rely on the server being ALREADY RUNNING for this script, 
// OR we can export `runTests` and call it from a runner that spawns the server.
// For simplicity, let's assume the user (or previous step) runs the server.
// BUT, to set the MASTER_KEY env var for the server, we might need to restart it.
// Since we can't easily restart the user's main server terminal, 
// let's try to verify against the running server if the user updated .env,
// OR spawn a child process server with the key just for this test.

// Spawning child server for self-contained test
const { spawn } = require('child_process');

async function main() {
    console.log('Spawning isolated server instance for testing...');
    const serverProcess = spawn('node', ['server.js'], {
        env: {
            ...process.env,
            PORT: 3006,
            DB_MOCK: 'true', // Use Mock DB for speed/safety
            MASTER_KEY: MASTER_KEY // Inject our test key
        },
        stdio: 'inherit' // Let it log to console
    });

    // Wait for startup
    await new Promise(r => setTimeout(r, 2000));

    try {
        await runTests();
    } catch (err) {
        console.error('❌ Test Failed:', err.message);
    } finally {
        serverProcess.kill();
    }
}

main();
