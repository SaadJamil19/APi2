const request = require('http');

// Set env var for mock DB
process.env.DB_MOCK = 'true';
process.env.PORT = '3001'; // Use different port just in case

const app = require('./server'); // This might start the server if server.js calls app.listen... 
// Wait, my server.js calls app.listen() at the bottom!
// Requiring it will start the server. That's fine for this test.

// Helper to disable console logs during test output if desired, but I want to see them.

function makeRequest(path, method, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = request.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: JSON.parse(data || '{}') });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('Wait for server startup...');
    await new Promise(r => setTimeout(r, 2000));

    console.log('\n--- Test 1: Create Wallet ---');
    const createRes = await makeRequest('/wallets/create', 'POST', {
        label: 'Test Wallet',
        blockchain: 'solana'
    });
    console.log('Create Response:', createRes);
    if (createRes.statusCode !== 201 || !createRes.body.wallet_id) throw new Error('Create Failed');

    const walletId = createRes.body.wallet_id;
    console.log('Got Wallet ID:', walletId);

    console.log('\n--- Test 2: Sign Transaction ---');
    const signRes = await makeRequest('/wallets/sign', 'POST', {
        wallet_id: walletId,
        transaction: 'tx_data_123'
    }, { 'x-api-key': 'mywins' }); // matches .env
    console.log('Sign Response:', signRes);
    if (signRes.statusCode !== 200 || !signRes.body.signed_transaction) throw new Error('Sign Failed');

    console.log('\n--- Test 3: Multisend ---');
    const multiRes = await makeRequest('/wallets/multisend', 'POST', {
        wallet_id: walletId,
        transactions: ['tx_1', 'tx_2']
    }, { 'x-api-key': 'mywins' });
    console.log('Multisend Response:', multiRes);
    if (multiRes.statusCode !== 200 || multiRes.body.signed_transactions.length !== 2) throw new Error('Multisend Failed');

    console.log('\n--- Test 4: Monitoring ---');
    const monRes = await makeRequest('/monitoring', 'GET', null);
    console.log('Monitoring Response:', monRes);
    if (monRes.statusCode !== 200 || !Array.isArray(monRes.body)) throw new Error('Monitoring Failed');

    console.log('\nALL TESTS PASSED');
    process.exit(0);
}

runTests().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
