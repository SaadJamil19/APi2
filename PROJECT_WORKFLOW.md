# Secure Wallet System - Workflow & Architecture

This document explains **how the system works** logically, covering authentication, data flow, and security mechanisms.

## 1. Security Architecture
The system relies on a tiered security model to protect wallet private keys.

### A. Admin Secret (Root Access)
- **What**: A static password stored in `.env` (`ADMIN_SECRET`).
- **Use**: Only used once to generate a temporary **Session Key**.
- **Security**: Never shared with end-users. Only known by the administrator/script.

### B. Session Key (Temporary Access)
- **What**: A JWT (JSON Web Token) that expires in 1 hour.
- **Use**: Required in the header (`x-session-key`) for **ALL** operational API calls (Create, Sign, Fetch).
- **Benefit**: If a session key is stolen, it expires quickly. It limits the exposure of the Admin Secret.

### C. Database Encryption (At Rest)
- **What**: Private keys are **never** stored in plain text.
- **Algorithm**: AES-256-GCM.
- **Storage**: The DB stores the `encrypted_private_key` and the `encryption_iv` (Initialization Vector).
- **Master Key**: The `MASTER_KEY` (in `.env`) acts as the salt/passphrase for encryption/decryption.

---

## 2. Workflows

### Workflow A: Authentication
Before doing anything, a client (or script) must authenticate.

1.  **Client** sends `POST /api/get-session-key` with `{ "admin_secret": "..." }`.
2.  **Server** validates the secret.
3.  **Server** generates a signed JWT (valid for 1 hour).
4.  **Server** returns `{ "session_key": "eyJ..." }`.
5.  **Client** saves this key to use in future requests.

### Workflow B: Creating a Wallet
This system supports user-provided keys for security (we don't generate them blindly).

**Manual Creation (Single):**
1.  **Client** sends `POST /api/wallets/create` with:
    - Headers: `x-session-key`: (The token from Workflow A)
    - Body: Label, Blockchain, Address, **Private Key**.
2.  **Server** verifies the Session Key.
3.  **Server** encrypts the Private Key using `cryptoHelper` + `MASTER_KEY`.
4.  **Server** saves the *Encrypted* Key + IV to the Database.
5.  **Server** returns the Wallet ID (The plain text private key is discarded immediately from memory).

**Bulk Import (CSV):**
1.  **User** populates `wallets.csv` with multiple wallets.
2.  **User** runs `node scripts/bulk_import.js`.
3.  **Script** automatically performs **Workflow A** to get a key.
4.  **Script** reads the CSV line-by-line.
5.  **Script** performs **Workflow B (Manual)** for each line automatically.

### Workflow C: Signing a Transaction
This is the core utility—using the stored keys to sign blockchain transactions.

1.  **Client** sends `POST /api/wallets/sign` with:
    - Headers: `x-session-key`.
    - Body: `wallet_id`, `transaction_payload`, `gas_params`.
2.  **Server** verifies the Session Key.
3.  **Server** fetches the encrypted record from DB using `wallet_id`.
4.  **Server** decrypts the private key using `MASTER_KEY` + stored IV.
5.  **Server** passes the decrypted key to `zigChainSdk` (simulated blockchain SDK).
6.  **SDK** signs the transaction.
7.  **Server** returns the signed transaction string.
8.  **Server** updates `last_accessed` timestamp in DB.

---

## 3. Directory Logic
- **`server.js`**: Entry point. Starts Express.
- **`routes/`**: specific URL paths (`/api/wallets/...`).
- **`controllers/`**: The brain. Handles the request, validates input, calls helpers.
- **`helpers/`**: The tools.
    - `authHelper`: Checks JWTs.
    - `cryptoHelper`: Encrypts/Decrypts data.
    - `db`:Talks to PostgreSQL.
- **`scripts/`**: Automation tools (like Bulk Import) that run outside the server.

## 4. Key Configuration Files
- **`.env`**: Holds the secrets. **CRITICAL**.
- **`wallets.csv`**: Data source for bulk imports.
