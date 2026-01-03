# Remote Database Setup Guide

Follow these steps to set up PostgreSQL on your remote Linux server and connect it to your application.

## 1. Connect to Server
Run this command in your local terminal:
```bash
ssh -i /root/.ssh/primary root@209.38.214.215
```

## 2. Install PostgreSQL (If not installed)
Once logged in to the server, run:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 3. Connect to Database (Using Existing Credentials)
Since you already have credentials (`DB_USER`, `DB_PASSWORD`, `DB_NAME`):

1.  **Connect via psql:**
    ```bash
    psql -h localhost -U YOUR_DB_USER -d YOUR_DB_NAME
    ```
    *(Enter your password when prompted)*

    *If `psql` is not installed, install it first: `sudo apt install postgresql-client`*

## 4. Setup Tables (Run Schema)
Once connected to the database console (`wallet_db=>` or similar):

1.  **Paste your Schema:**
    Copy and paste the SQL tables below to create them.
    ```sql
    CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    );

    CREATE TABLE api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key_name VARCHAR(100) NOT NULL,
        api_key_hash TEXT NOT NULL,
        api_key_prefix VARCHAR(10) NOT NULL,
        permissions JSONB DEFAULT '["read"]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        last_used TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(api_key_hash)
    );
    
    CREATE TABLE wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        label VARCHAR(255),
        blockchain VARCHAR(50),
        wallet_address VARCHAR(255),
        encrypted_private_key TEXT,
        encryption_iv VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        last_accessed TIMESTAMP
    );
    ```

## 5. Enable Remote Access (Optional)
If your Node.js app is on the **SAME** server, skip this.
If your app is on your computer and you want to connect to the remote DB:

1.  **Edit postgresql.conf**:
    ```bash
    nano /etc/postgresql/14/main/postgresql.conf
    # Change listen_addresses = 'localhost' -> listen_addresses = '*'
    ```
2.  **Edit pg_hba.conf**:
    ```bash
    nano /etc/postgresql/14/main/pg_hba.conf
    # Add this line at the end:
    host    all             all             0.0.0.0/0               md5
    ```
3.  **Restart Postgres**:
    ```bash
    sudo systemctl restart postgresql
    ```

## 7. Connecting Local App via SSH Tunnel (Secure Access)
Since your database is on a VPS blocking public access (which is good security), you must use an **SSH Tunnel** to connect your local app to the remote database.

**1. Open a Terminal and run this SSH command:**
This creates a bridge between your computer (port 5432) and the server (port 5432).
```bash
ssh -i /root/.ssh/primary -L 5433:127.0.0.1:5432 root@209.38.214.215 -N
```
- `-L 5433:127.0.0.1:5432`: Forwards your local port `5433` to the remote server's localhost port `5432`.
- `-N`: Tells SSH just to forward ports, don't open a shell.
- *Note: I used port 5433 locally just in case you have a local Postgres running on 5432. If not, you can use 5432:127.0.0.1:5432.*

**2. Update your local `.env`:**
Now pointing to your "Tunnel" instead of direct IP.
```env
DB_HOST=127.0.0.1
DB_PORT=5433         # Matches the first port in your SSH command
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=YOUR_DB_NAME
```

**3. Keep the Terminal Open:**
While the SSH command is running in that terminal window, the bridge is open. If you close it, the database connection will drop.
