const http = require('http');
require('dotenv').config({ path: '../.env' }); // Adjust path if running from scripts/

// Fallback to local .env if direct path fails
if (!process.env.ADMIN_SECRET) {
    require('dotenv').config();
}

const adminSecret = process.env.ADMIN_SECRET;
const authorizedEmails = (process.env.AUTHORIZED_EMAILS || '').split(',');
const targetEmail = authorizedEmails[0]; // Pick the first authorized email

if (!adminSecret || !targetEmail) {
    console.error('❌ Error: ADMIN_SECRET or AUTHORIZED_EMAILS not found in .env');
    process.exit(1);
}

const data = JSON.stringify({
    email: targetEmail,
    admin_secret: adminSecret,
    duration: 86400 // 1 Day
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/generate-api-key',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        const responseProxy = JSON.parse(body);
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('\n✅ API Key Generated Successfully!');
            console.log('------------------------------------------------');
            console.log(`User:  ${targetEmail}`);
            console.log(`Key:   ${responseProxy.api_key}`);
            console.log('------------------------------------------------');
            console.log('Copy this key for your wallet operations.');
        } else {
            console.error('\n❌ Failed to generate key:');
            console.error(responseProxy);
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

console.log(`Requesting API Key for: ${targetEmail}...`);
req.write(data);
req.end();
