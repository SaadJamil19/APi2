const fs = require('fs');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// CONFIG
const CSV_FILE = path.join(__dirname, '../wallets.csv');
const PORT = process.env.PORT || 3000;

// HELPER: HTTP Request
function makeRequest(endpoint, method, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/api' + endpoint,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject({ statusCode: res.statusCode, error: parsed });
                    }
                } catch (e) {
                    reject({ statusCode: res.statusCode, error: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runBulkImport() {
    console.log('--- Bulk Wallet Import ---');

    console.log('1. Reading CSV File...');
    if (!fs.existsSync(CSV_FILE)) {
        console.error('❌ Error: wallets.csv not found in root directory.');
        process.exit(1);
    }
    const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = csvContent.split('\n').filter(l => l.trim() !== '');

    // Parse CSV (Skip Header)
    const walletsToCreate = [];
    // Assuming Header: label,blockchain,wallet_address,private_key
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim());
        // Simple CSV parse (fails on commas in values, but okay for this use case)
        if (parts.length >= 4) {
            const [label, blockchain, wallet_address, private_key] = parts;
            walletsToCreate.push({ label, blockchain, wallet_address, private_key });
        }
    }
    console.log(`✅ Found ${walletsToCreate.length} wallets to create.`);

    console.log('\n2. Authentication...');
    // Expect API Key as first argument
    const apiKey = process.argv[2];
    if (!apiKey) {
        console.error('❌ Error: Please provide your API Key as an argument.');
        console.error('   Usage: node scripts/bulk_import.js <YOUR_API_KEY>');
        process.exit(1);
    }
    console.log('✅ Using provided API Key.');

    console.log('\n3. Creating Wallets...');
    let successCount = 0;

    for (const w of walletsToCreate) {
        try {
            const result = await makeRequest('/wallets/create', 'POST', w, {
                'x-api-key': apiKey
            });
            console.log(`   [SUCCESS] Created "${w.label}": ${result.wallet_id}`);
            successCount++;
        } catch (err) {
            console.error(`   [FAILED]  "${w.label}":`, err.error || err);
        }
    }

    console.log(`\n--- Finished: ${successCount}/${walletsToCreate.length} created ---`);
}

runBulkImport();
