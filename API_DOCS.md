# Backend API Documentation

**Base URL**: `http://localhost:3000`

## 1. Authentication & Registration

### registerUser
Creates a new user account.
- **Endpoint**: `POST /api/register`
- **Body**:
  ```json
  {
    "username": "jdoe",
    "email": "jdoe@example.com"
  }
  ```
- **Response**: User object.

### generateApiKey
Generates a persistent API Key.
- **Prerequisite**: Email must be authorized in backend `.env`.
- **Endpoint**: `POST /api/generate-api-key`
- **Body**:
  ```json
  {
    "email": "jdoe@example.com",
    "admin_secret": "your_super_admin_secret",
    "duration": 86400 
  }
  ```
  *(Duration is in seconds. Default: 3600)*
- **Response**:
  ```json
  {
    "api_key": "sk_live_...",
    "expires_at": "2024-..."
  }
  ```
  **Save this key.** You will need it for all wallet operations.

---

## 2. Wallet Operations
**Auth Header Required**: `x-api-key: sk_live_...`

### createWallet
Securely imports/creates a wallet.
- **Endpoint**: `POST /api/wallets/create`
- **Body**:
  ```json
  {
    "label": "My Wallet",
    "blockchain": "ethereum",
    "wallet_address": "0x123...",
    "private_key": "your_private_key"
  }
  ```
- **Response**: `{ "wallet_id": "uuid..." }`

### signTransaction
Signs a transaction using the stored encrypted key.
- **Endpoint**: `POST /api/wallets/sign`
- **Body**:
  ```json
  {
    "wallet_id": "uuid...",
    "transaction": "pay 100..."
  }
  ```
- **Response**: `{ "signed_transaction": "0x..." }`

### multisend
Signs multiple transactions.
- **Endpoint**: `POST /api/wallets/multisend`
- **Body**:
  ```json
  {
    "wallet_id": "uuid...",
    "transactions": ["tx1", "tx2"]
  }
  ```

### getWallet
Fetch public details.
- **Endpoint**: `GET /api/wallets/:id`

---

## 3. Monitoring
### getMonitoringLogs
View recent request logs.
- **Auth**: Required (`x-api-key`)
- **Endpoint**: `GET /api/monitoring`
