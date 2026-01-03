const { spawn } = require('child_process');
const http = require('http');

const PORT = 3005; // Use a distinct port for testing
const API_KEY = 'my_test_api_key'; // Match what we inject in env

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
    console.log('--- Starting E2E Tests ---');

    console.log('1. Spawning Server with DB_MOCK=true...');
    const serverProcess = spawn('node', ['server.js'], {
        cwd: 'C:\\Users\\SAR\\Desktop\\API',
        env: {
            ...process.env,
            DB_MOCK: 'true',
            PORT: PORT,
            API_KEY: API_KEY,
            SECRET_KEY: '0000000000000000000000000000000000000000000000000000000000000000' // 32 bytes hex
        },
        stdio: 'pipe' // Pipe output so we can see server logs
    });

    serverProcess.stdout.on('data', (data) => console.log(`[SERVER]: ${data.toString().trim()}`));
    serverProcess.stderr.on('data', (data) => console.error(`[SERVER ERROR]: ${data.toString().trim()}`));

    // Wait for server to start
    await new Promise(r => setTimeout(r, 3000));

    let walletId = '';

    try {
        console.log('\n2. Testing POST /api/wallets/create');
        const createRes = await makeRequest('/wallets/create', 'POST', {
            label: 'E2E Test Wallet',
            blockchain: 'solana'
        });
        console.log('Response:', createRes.body);
        if (createRes.statusCode !== 201) throw new Error(`Create failed with status ${createRes.statusCode}`);
        if (!createRes.body.wallet_id) throw new Error('No wallet_id returned');

        walletId = createRes.body.wallet_id;
        console.log('✅ Create Wallet Passed. ID:', walletId);

        console.log('\n3. Testing POST /api/wallets/sign');
        const signRes = await makeRequest('/wallets/sign', 'POST', {
            wallet_id: walletId,
            transaction: 'my_transaction_payload'
        }, { 'x-api-key': API_KEY });
        console.log('Response:', signRes.body);
        if (signRes.statusCode !== 200) throw new Error(`Sign failed with status ${signRes.statusCode}`);
        if (!signRes.body.signed_transaction) throw new Error('No signed_transaction returned');
        console.log('✅ Sign Transaction Passed.');

        console.log('\n4. Testing POST /api/wallets/multisend');
        const multiRes = await makeRequest('/wallets/multisend', 'POST', {
            wallet_id: walletId,
            transactions: ['tx1', 'tx2', 'tx3']
        }, { 'x-api-key': API_KEY });
        console.log('Response:', multiRes.body);
        if (multiRes.statusCode !== 200) throw new Error(`Multisend failed with status ${multiRes.statusCode}`);
        if (!Array.isArray(multiRes.body.signed_transactions) || multiRes.body.signed_transactions.length !== 3) {
            throw new Error('Invalid multisend response');
        }
        console.log('✅ Multisend Passed.');

        console.log('\n5. Testing GET /api/monitoring');
        const monRes = await makeRequest('/monitoring', 'GET');
        console.log('Response (First 2 logs):', Array.isArray(monRes.body) ? monRes.body.slice(0, 2) : monRes.body);
        if (monRes.statusCode !== 200) throw new Error(`Monitoring failed with status ${monRes.statusCode}`);
        if (!Array.isArray(monRes.body) || monRes.body.length < 3) {
            // We did at least 3 requests (Create, Sign, Multisend). create might not log if auth fails? 
            // Wait, create is public logging logic is global middleware.
            throw new Error('Monitoring logs incomplete');
        }
        console.log('✅ Monitoring Passed.');

    } catch (err) {
        console.error('❌ TEST FAILED:', err.message);
        process.exitCode = 1;
    } finally {
        console.log('\nStopping Server...');
        serverProcess.kill();
    }
}

runTests();
