# Backend API Documentation

**Base URL**: `http://localhost:3000` (or your production URL)

## Authentication
Some endpoints require an API Key.
- **Header Name**: `x-api-key`
- **Value**: Ask backend team for the key (e.g., `mywins`).

---

## 1. Create Wallet
Generates a new secure wallet.

- **Endpoint**: `POST /api/wallets/create`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "label": "User's Main Wallet",
    "blockchain": "ethereum" 
  }
  ```
  *(Supported blockchains: ethereum, bitcoin, solana, etc.)*

- **Success Response (201)**:
  ```json
  {
    "wallet_id": "550e8400-e29b-41d4-a716-446655440000",
    "wallet_address": "0x123abc..."
  }
  ```

---

## 2. Sign Transaction
Signs a transaction payload using the wallet's private key.

- **Endpoint**: `POST /api/wallets/sign`
- **Auth**: Required (`x-api-key`)
- **Request Body**:
  ```json
  {
    "wallet_id": "550e8400-e29b-41d4-a716-446655440000",
    "transaction": "raw_transaction_string_or_obj"
  }
  ```

- **Success Response (200)**:
  ```json
  {
    "signed_transaction": "0xSIGNED_HASH..."
  }
  ```

---

## 3. Multisend (Batch Sign)
Signs multiple transactions at once (optimized).

- **Endpoint**: `POST /api/wallets/multisend`
- **Auth**: Required (`x-api-key`)
- **Request Body**:
  ```json
  {
    "wallet_id": "550e8400-e29b-41d4-a716-446655440000",
    "transactions": [
        "tx_payload_1",
        "tx_payload_2"
    ]
  }
  ```

- **Success Response (200)**:
  ```json
  {
    "signed_transactions": [
        "0xSIGNED_HASH_1",
        "0xSIGNED_HASH_2"
    ]
  }
  ```

---

## 4. Monitoring
Get a history of API usage.

- **Endpoint**: `GET /api/monitoring`
- **Auth**: None (Public)
- **Response**: Array of log objects.
