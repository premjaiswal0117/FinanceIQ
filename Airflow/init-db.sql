-- Automatically create financeiq database on initial Postgres container initialization
SELECT 'CREATE DATABASE financeiq'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'financeiq')\gexec

GRANT ALL PRIVILEGES ON DATABASE financeiq TO airflow;

