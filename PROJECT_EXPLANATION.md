# Project Explanation: Secure Blockchain Wallet Backend

This document provides a detailed explanation of every file in the project, describing its purpose, functionality, and how it contributes to the overall application.

## 📂 Root Directory

### `server.js`
- **Purpose**: The main entry point of the application.
- **Functionality**:
  - Initializes the Express app.
  - Configures middleware:
    - `cors()`: Enables Cross-Origin Resource Sharing.
    - `body-parser.json()`: Parses incoming JSON request bodies.
    - `logRequest`: Custom middleware from `helpers/logger.js` to log every request.
  - Registers routes: Mounts `walletsRoutes` under the `/api` path.
  - Error Handling: Global middleware to catch and log errors.
  - Server Start: Listens on the port defined in `.env` (default 3000).

### `db.js`
- **Purpose**: Manages the database connection.
- **Functionality**:
  - **Dual Mode**: Operates in either "Mock Mode" or "Real Mode" based on the `DB_MOCK` environment variable.
  - **Mock Mode**: Uses an in-memory JavaScript object (`mockData`) to simulate database operations (INSERT, SELECT, UPDATE) without a running PostgreSQL instance. This is useful for testing and verifying the app standalone.
  - **Real Mode**: Uses `pg.Pool` to connect to a real PostgreSQL database using credentials from `.env`.
  - **Export**: Exports a `query` function used by controllers to execute SQL commands transparently, regardless of the mode.

### `package.json` & `package-lock.json`
- **Purpose**: Defines project metadata and dependencies.
- **Functionality**:
  - Lists strict dependencies like `express` (web server), `pg` (database), `bcryptjs`, `jsonwebtoken` (auth), `uuid` (unique IDs), and `dotenv` (env vars).
  - Scripts: Defines a placeholder `test` script.

### `.env` & `.env.example`
- **Purpose**: Configuration storage for sensitive secrets and environment settings.
- **Functionality**:
  - **Note**: `.env` is ignored by git (usually), while `.env.example` provides a template for other developers.
  - **New in Update**: Added `ADMIN_SECRET` for generating session keys.

### `server_minimal.js`
- **Purpose**: A diagnostic script to verify environment integrity.
- **Functionality**:
  - Attempts to `require` all major dependencies and routes individually.
  - Logs success or failure messages to the console.
  - Used to quickly debug if a specific package is missing or if there is a syntax error in a required file.

### `verify_standalone.js`
- **Purpose**: A standalone local test script.
- **Functionality**:
  - Sets `DB_MOCK=true` programmatically.
  - Starts the server (by requiring `server.js`).
  - Executes a sequence of HTTP requests against the running server:
    1.  Create Wallet
    2.  Sign Transaction
    3.  Multisend
    4.  Get Monitoring Logs
  - Verifies responses and prints pass/fail results to the console.

### `test_import.js` & `test_controller.js`
- **Purpose**: Granular smoke tests for file imports.
- **Functionality**:
  - `test_import.js`: Checks if `walletsRoutes` and `server.js` can be imported without crashing.
  - `test_controller.js`: Checks if individual controllers and helpers can be loaded.
  - These scripts help pinpoint exactly which file might have a syntax error or missing dependency.

### `README.md`, `API_DOCS.md`, `TESTING_GUIDE.md`
- **Purpose**: Human-readable documentation.
- **Functionality**:
  - `README.md`: General project overview, setup info, and endpoint summary.
  - `API_DOCS.md`: Detailed API reference with request/response examples for each endpoint.
  - `TESTING_GUIDE.md`: Step-by-step instructions on how to install, configure, and test the project using various methods (E2E script, manual curl/PowerShell).

---

## 📂 Directories

### `controllers/`
Contains the business logic for handling HTTP requests.

- **`walletsController.js`**:
  - **Core Logic**:
    - `createWallet`: Generates a new random private key/wallet address, encrypts the private key using `cryptoHelper`, and stores it in the DB.
    - `sign`: Fetches a wallet, decrypts the private key, checks the **Session Key** (via middleware), and uses `zigChainSdk` to sign a single transaction. Updates `last_accessed`.
    - `multisend`: Similar to `sign`, but handles an array of transaction payloads efficiently by decrypting the key once and signing all of them in a loop.
    - `getWallet`: Securely fetches wallet metadata (excluding private key) by ID. Requires `x-session-key`.
  - **Dependencies**: Uses `db` for storage, `crypto` & `cryptoHelper` for security, and `zigChainSdk` for blockchain simulation.

- **`authController.js`**:
  - **Purpose**: Handles dynamic session key generation.
  - **Functionality**:
    - `getSessionKey`: Validates the `admin_secret` from the request body against the `.env` variable. If valid, signs and returns a JWT "Session Key" valid for 1 hour.

- **`monitoringController.js`**:
  - **Functionality**: Returns the log data collected by the logging middleware.
  - **Endpoint**: Maps to `GET /monitoring`.

- **`debugController.js`**:
  - **Functionality**: Helper to view the raw state of the Mock Database when testing. Returns error if not in mock mode.

### `helpers/`
Contains utility functions and middleware.

- **`authHelper.js`**:
  - **Middleware**: 
    - `verifySessionKey`: Validates the `x-session-key` header (JWT). It ensures the token is signed by the server and hasn't expired.
  - **Protection**: Used to secure **ALL** operational endpoints (`create`, `sign`, `multisend`, `getWallet`, `monitoring`).

- **`cryptoHelper.js`**:
  - **Encryption Standard**: logic for AES-256-GCM.
  - **`encrypt`**: Takes text (private key), generates a random IV, encrypts the data, and returns the ciphertext combined with the auth tag (packaged) and the IV.
  - **`decrypt`**: Splits the ciphertext and auth tag, uses the IV, and authenticates + decrypts the data.
  - **Security**: Ensures private keys are never stored in plaintext.

- **`logger.js`**:
  - **Middleware**: `logRequest` captures details (IP, Endpoint, Timestamp, API Key) for every incoming request and pushes them to an in-memory array (`requestLogs`).
  - **Export**: Provides `getLogs` for the monitoring controller.

- **`zigChainSdk.js`**:
  - **Simulation**: A mock SDK simulating a specific blockchain library.
  - **Functionality**: The `signTransaction` function returns a dummy signed string (`tx_signed_...`) to simulate the signing process without real blockchain connectivity.

### `routes/`
Defines the URL structure of the API.

- **`walletsRoutes.js`**:
  - **Mapping**: Links URL paths to controller functions.
  - **Endpoints**:
    - `create` -> `walletsController.createWallet` (Protected by `verifySessionKey`)
    - `sign` -> `walletsController.sign` (Protected by `verifySessionKey`)
    - `multisend` -> `walletsController.multisend` (Protected by `verifySessionKey`)
    - `getWallet` -> `walletsController.getWallet` (Protected by `verifySessionKey`)
    - `monitoring` -> `monitoringController.getMonitoringLogs` (Protected by `verifySessionKey`)
    - `get-session-key` -> `authController.getSessionKey` (Public)

### `tests/`
Contains automated test scripts.

- **`e2e.js`**:
  - **End-to-End Testing**: A robust script that creates a child process to run the server in a controlled test environment.
  - **Workflow**:
    1. Spawns server with `DB_MOCK=true`.
    2. Performs a full user flow: Create Wallet -> Get ID -> Sign -> Multisend.
    3. Verifies that logs are generated.
  - **Automation**: Allows verification of the entire system structure with a single command (`node tests/e2e.js`).
