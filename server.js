const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const walletsRoutes = require('./routes/walletsRoutes');
const { logRequest } = require('./helpers/logger');

const app = express();
const port = process.env.PORT || 3000;
const { spawn } = require('child_process');

// Middleware
app.use(cors());
app.use(bodyParser.json());
// app.use(logger.logRequest);

// Routes
app.use('/api', walletsRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Function to start SSH Tunnel
const startTunnel = () => {
    return new Promise((resolve, reject) => {
        // Only run if SSH env vars are set
        if (!process.env.SSH_SERVER_IP) {
            console.log('ℹ️  No SSH configuration found. Skipping tunnel.');
            return resolve(null);
        }

        console.log('🔄 Starting SSH Tunnel...');
        const sshArgs = [
            '-i', process.env.SSH_PRIVATE_KEY_PATH,
            '-L', `${process.env.DB_PORT}:127.0.0.1:5432`,
            '-N', // No remote command
            '-o', 'StrictHostKeyChecking=no', // Avoid yes/no prompt
            `${process.env.SSH_SERVER_USER}@${process.env.SSH_SERVER_IP}`
        ];

        console.log(`Debug Command: ssh ${sshArgs.join(' ')}`);

        const tunnel = spawn('ssh', sshArgs);

        tunnel.on('error', (err) => {
            console.error('❌ Failed to start SSH tunnel:', err);
            reject(err);
        });

        tunnel.stderr.on('data', (data) => {
            console.error(`SSH Error: ${data}`);
        });

        tunnel.on('close', (code) => {
            if (code !== 0) {
                console.error(`SSH Tunnel exited with code ${code}`);
                reject(new Error(`SSH Tunnel failed to start (code ${code})`));
            }
        });

        // Give it a moment to connect
        setTimeout(() => {
            console.log('✅ SSH Tunnel likely established (Waiting 2s...)');
            resolve(tunnel);
        }, 2000);

        // Clean up on exit
        process.on('exit', () => tunnel.kill());
        process.on('SIGINT', () => { tunnel.kill(); process.exit(); });
    });
};

// Start Server
startTunnel().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
        console.log(`DB Connected via: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    });
}).catch(err => {
    console.error('Failed to start server due to tunnel error.');
});
