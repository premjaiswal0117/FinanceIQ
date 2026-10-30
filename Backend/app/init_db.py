
"""
Database Schema Initialization for FinanceIQ.

Creates users and goals tables safely.
Optionally seeds development accounts using environment variables.
Never modifies or truncates the transactions table.
"""

import os

from sqlalchemy import text
from .database import engine
from .auth import hash_password


def init_database():
    print("Connecting to PostgreSQL to initialize FinanceIQ tables...")

    with engine.begin() as connection:

        # 1. Create users table
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                salt VARCHAR(64) NOT NULL,
                full_name VARCHAR(100),
                currency VARCHAR(10) DEFAULT 'INR',
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))

        connection.execute(text("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
        """))

        print("Users table verified/created.")

        # 2. Create goals table
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS goals (
                id SERIAL PRIMARY KEY,
                goal_id VARCHAR(50) UNIQUE NOT NULL,
                user_id VARCHAR(50) NOT NULL,
                name VARCHAR(150) NOT NULL,
                target_amount NUMERIC(12, 2) NOT NULL,
                current_saved NUMERIC(12, 2) DEFAULT 0.0,
                target_date DATE NOT NULL,
                initial_monthly_target NUMERIC(12, 2),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))

        print("Goals table verified/created.")

        # 3. Load optional accounts from environment variables
        account_configs = [
            {
                "user_id": "ADMIN01",
                "email_key": "FINANCEIQ_ADMIN_EMAIL",
                "password_key": "FINANCEIQ_ADMIN_PASSWORD",
                "full_name": "System Administrator",
                "role": "admin"
            },
            {
                "user_id": "U036",
                "email_key": "FINANCEIQ_DEMO_EMAIL",
                "password_key": "FINANCEIQ_DEMO_PASSWORD",
                "full_name": "Alex Turner",
                "role": "user"
            },
            {
                "user_id": "U077",
                "email_key": "FINANCEIQ_ALEX_EMAIL",
                "password_key": "FINANCEIQ_ALEX_PASSWORD",
                "full_name": "Sarah Jenkins",
                "role": "user"
            },
            {
                "user_id": "U001",
                "email_key": "FINANCEIQ_JORDAN_EMAIL",
                "password_key": "FINANCEIQ_JORDAN_PASSWORD",
                "full_name": "Jordan Lee",
                "role": "user"
            }
        ]

        for config in account_configs:
            email = os.getenv(config["email_key"], "").strip()
            password = os.getenv(config["password_key"], "")

            # Skip accounts that have not been configured
            if not email and not password:
                continue

            # Do not create partially configured accounts
            if not email or not password:
                print(
                    f"Skipping account: configure both "
                    f"{config['email_key']} and {config['password_key']}."
                )
                continue

            existing = connection.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": email}
            ).fetchone()

            if existing:
                print(f"Account {email} already exists. No changes made.")
                continue

            pwd_hash, salt = hash_password(password)

            connection.execute(
                text("""
                    INSERT INTO users (
                        user_id, email, hashed_password,
                        salt, full_name, role
                    )
                    VALUES (
                        :user_id, :email, :hashed_password,
                        :salt, :full_name, :role
                    )
                    ON CONFLICT (email) DO NOTHING;
                """),
                {
                    "user_id": config["user_id"],
                    "email": email,
                    "hashed_password": pwd_hash,
                    "salt": salt,
                    "full_name": config["full_name"],
                    "role": config["role"],
                }
            )

            print(f"Configured account created: {email}")

        # 4. Verify transactions table without modifying it
        count_res = connection.execute(
            text("SELECT COUNT(*) FROM transactions")
        )
        total_txns = count_res.scalar()

        print(
            f"Verified: transactions table remains intact "
            f"with {total_txns} records."
        )


if __name__ == "__main__":
    init_database()
