const db = require('../db');
const { encrypt, decrypt } = require('../helpers/cryptoHelper');
const { signTransaction } = require('../helpers/zigChainSdk');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const createWallet = async (req, res) => {
    try {
        const { label = 'My Wallet', blockchain = 'ZigChain' } = req.body;

        // Generate mock wallet details
        const walletAddress = `0x${crypto.randomBytes(20).toString('hex')}`;
        const privateKey = crypto.randomBytes(32).toString('hex'); // Generate a random private key

        // Encrypt private key
        // encrypt returns { encryptedResult, ivResult } (base64 and hex strings)
        const { encryptedResult, ivResult } = encrypt(privateKey);

        const walletId = uuidv4();

        const query = `
            INSERT INTO wallets (id, label, blockchain, wallet_address, encrypted_private_key, encryption_iv)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, wallet_address
        `;

        const values = [walletId, label, blockchain, walletAddress, encryptedResult, ivResult];
        const result = await db.query(query, values);

        res.status(201).json({
            wallet_id: result.rows[0].id,
            wallet_address: result.rows[0].wallet_address
        });

    } catch (error) {
        console.error('Error creating wallet:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const sign = async (req, res) => {
    try {
        const { wallet_id, transaction } = req.body;

        if (!wallet_id || !transaction) {
            return res.status(400).json({ error: 'Missing wallet_id or transaction' });
        }

        // Fetch wallet
        const query = 'SELECT * FROM wallets WHERE id = $1 AND is_active = true';
        const result = await db.query(query, [wallet_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Wallet not found or inactive' });
        }

        const wallet = result.rows[0];

        // Decrypt private key
        const privateKey = decrypt(wallet.encrypted_private_key, wallet.encryption_iv);

        // Sign transaction
        const signedTx = signTransaction(privateKey, transaction);

        // Update last_accessed
        await db.query('UPDATE wallets SET last_accessed = NOW() WHERE id = $1', [wallet_id]);

        res.json({ signed_transaction: signedTx });

    } catch (error) {
        console.error('Error signing transaction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const multisend = async (req, res) => {
    try {
        const { wallet_id, transactions } = req.body;

        if (!wallet_id || !Array.isArray(transactions)) {
            return res.status(400).json({ error: 'Missing wallet_id or transactions array' });
        }

        // Fetch wallet (Decrypt ONCE)
        const query = 'SELECT * FROM wallets WHERE id = $1 AND is_active = true';
        const result = await db.query(query, [wallet_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Wallet not found or inactive' });
        }

        const wallet = result.rows[0];
        const privateKey = decrypt(wallet.encrypted_private_key, wallet.encryption_iv);

        const signedTransactions = [];

        // Loop and sign
        for (const tx of transactions) {
            const signed = signTransaction(privateKey, tx);
            signedTransactions.push(signed);
        }

        // Update last_accessed
        await db.query('UPDATE wallets SET last_accessed = NOW() WHERE id = $1', [wallet_id]);

        res.json({ signed_transactions: signedTransactions });

    } catch (error) {
        console.error('Error in multisend:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// crypto moved to top

module.exports = {
    createWallet,
    sign,
    multisend
};
