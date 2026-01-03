# Step-by-Step Testing Guide

Follow these steps to run and test the project from scratch in Visual Studio Code.

## 1. Install Dependencies
Open your terminal in Visual Studio Code (Terminal -> New Terminal) and run:
```powershell
npm install
```
This downloads all the required libraries (Express, Postgres, Crypto, etc.) into a `node_modules` folder.

## 2. Configure Environment
1.  Check if you have a file named `.env`.
2.  If not, look for `.env.example` and copy it to `.env`:
    ```powershell
    copy .env.example .env
    ```
    *(Or just create a new file named `.env` and paste the contents of `.env.example` into it).*

## 3. Option A: Run Automated Tests (Easiest)
We have prepared a script that setups a **Modify Database** automatically and runs all tests.
Run this command:
```powershell
node tests/e2e.js
```
**What this does:**
- It starts the server using a Mock Database (no real Postgres needed).
- It creates a wallet, signs a transaction, and checks the logs.
- You will see "✅ Passed" messages in the terminal.

## 4. Option B: Manual "Live" Testing with Mock DB
If you want to run the server yourself and test it with a tool like Postman or simple commands:

**Step 1: Start the Server in Mock Mode**
Run this command in your terminal:
```powershell
# Windows PowerShell
$env:DB_MOCK="true"; node server.js
```
*If that syntax doesn't work in your specific shell, try:* `Set-Item -Path Env:DB_MOCK -Value "true"; node server.js`
*Or simply edit your `.env` file and add `DB_MOCK=true` to the bottom, then run `node server.js`.*

**Step 2: Test Endpoints**
Open a **new** terminal tab (keep the server running in the first one) and use these commands (or use Postman):

**Create a Wallet:**
```powershell
curl -X POST http://localhost:3000/api/wallets/create -H "Content-Type: application/json" -d "{\"label\": \"My Test\", \"blockchain\": \"solana\"}"
```
*Copy the `wallet_id` from the output.*

**Sign a Transaction:**
Replace `<YOUR_WALLET_ID>` with the ID you just got.
```powershell
curl -X POST http://localhost:3000/api/wallets/sign -H "Content-Type: application/json" -H "x-api-key: mywins" -d "{\"wallet_id\": \"<YOUR_WALLET_ID>\", \"transaction\": \"pay 100\"}"
```

**Check Monitoring Logs:**
```powershell
curl http://localhost:3000/api/monitoring
```

## 5. How the Mock DB Works
- The Mock DB is a simple in-memory storage (a JavaScript object).
- It is enabled when `DB_MOCK` is set to `true`.
- **Note:** Every time you restart the server, the Mock DB is wiped clean.

## 6. Real Database (PostgreSQL)
If you want to use a real database:
1.  Install PostgreSQL.
2.  Create a database named `wallet_db`.
3.  Run the SQL command found in `README.md` to create the table.
4.  Remove `DB_MOCK=true` from your `.env` (or set it to `false`).
5.  Update `DB_USER` and `DB_PASSWORD` in `.env` to match your Postgres setup.
6.  Run `node server.js`.
