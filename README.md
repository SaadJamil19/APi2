# Secure Blockchain Wallet Backend

This is a secure Node.js + Express backend for managing blockchain wallets and signing transactions.

## API Endpoints List

Here is your quick reference for all available endpoints:

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/wallets/create` | Create a new wallet | No |
| **POST** | `/api/wallets/sign` | Sign a transaction | **Yes** (x-api-key) |
| **POST** | `/api/wallets/multisend` | Sign multiple transactions | **Yes** (x-api-key) |
| **GET** | `/api/monitoring` | View request logs | No |

### Request Body Examples

**1. Create Wallet (`POST /api/wallets/create`)**
```json
{
  "label": "My Wallet",
  "blockchain": "ethereum"
}
```

**2. Sign Transaction (`POST /api/wallets/sign`)**
```json
{
  "wallet_id": "example-uuid-here",
  "transaction": "transfer data string"
}
```

**3. Multisend (`POST /api/wallets/multisend`)**
```json
{
  "wallet_id": "example-uuid-here",
  "transactions": ["tx_data_1", "tx_data_2"]
}
```

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    - Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    - Update `.env` with your database credentials and secrets.

## Testing

An end-to-end test script is provided to verify the backend functionality using a mock database.

```bash
# Run the E2E test
node tests/e2e.js
```
This script spawns the server (with `DB_MOCK=true`) and performs:
1.  Wallet Creation
2.  Transaction Signing
3.  Multisend Operations
4.  Monitoring Verification
