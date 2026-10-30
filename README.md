# FinanceIQ – Personal Financial Intelligence Platform

FinanceIQ is an end-to-end personal finance analytics platform designed to help users manage transactions, understand spending patterns, monitor financial goals, and gain insights into their financial activities.

The project combines data engineering, distributed processing, machine learning, workflow orchestration, and an interactive web dashboard.

## Architecture Overview

```mermaid
flowchart TD
    A[Raw Transaction Dataset] --> B[Data Quality Validation]
    B --> C[Data Cleaning and Transformation]
    C --> D[PySpark ETL Pipeline]
    D --> E[(PostgreSQL Database)]
    F[Apache Airflow] --> D
    E --> G[FastAPI Backend]
    G --> H[Machine Learning]
    G --> I[AI Financial Copilot]
    G --> J[React Frontend]
    J --> K[Financial Dashboard]
    J --> L[Smart Goal Tracker]
    J --> M[Admin Dashboard]
```

### Main Components

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React 18, Vite | Interactive finance dashboard |
| Backend | Python, FastAPI | APIs and business logic |
| Database | PostgreSQL | Financial and user data storage |
| Data Processing | Python, Pandas, PySpark | Data cleaning and transformation |
| Orchestration | Apache Airflow | ETL workflow scheduling |
| Machine Learning | Scikit-learn | Expense prediction and anomaly detection |
| AI Assistant | OpenAI API (optional) | Natural-language financial assistance |
| Visualization | Three.js, Charts | Interactive financial visualizations |

## Key Features

- **Transaction Management:** Organize and monitor income and expenses.
- **Financial Dashboard:** View income, expenses, balance, and spending summaries.
- **Data Engineering Pipeline:** Validate, clean, transform, and load transaction data.
- **Machine Learning:** Expense forecasting and anomaly detection.
- **AI Financial Copilot:** Multilingual financial assistance with a local analytics fallback.
- **Smart Goal Tracker:** Monitor savings goals and monthly targets.
- **Needs vs. Wants Analysis:** Analyze spending using the 50/30/20 budgeting approach.
- **Admin Dashboard:** Monitor platform-level information and system status.

## Technology Stack

**Programming:** Python, JavaScript, SQL

**Frontend:** React 18, Vite, CSS, Three.js

**Backend:** FastAPI, SQLAlchemy

**Data Engineering:** Pandas, NumPy, PySpark, Apache Airflow

**Database:** PostgreSQL

**Machine Learning:** Scikit-learn, Random Forest, Isolation Forest

**Development Tools:** Git, GitHub, VS Code, Docker

## Project Structure

```text
FinanceIQ/
│
├── Airflow/
│   ├── Dags/
│   │   └── financeiq_pipeline.py
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── init-db.sql
│
├── Analytics/
│   ├── ML/
│   │   └── expense_prediction.py
│   ├── ML/
│   │   └── expense_prediction_model.pkl
│   └── analytics.sql
│
├── Backend/
│   ├── app/
│   │   ├── ai_copilot.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── init_db.py
│   │   ├── main.py
│   │   └── models.py
│   └── test scripts
│
├── Data/
│   ├── Raw/
│   └── Processed/
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
├── Ingestion/
│   └── 01_Data_ingestion.py
│
├── Pipeline/
│   ├── 02_Data_quality.py
│   ├── 03_Data_cleaning.py
│   └── 04_PySpark_to_PostgreSQL.py
│
├── .env.example
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following tools:

- Python 3.12 or compatible version
- Node.js 18 or later
- npm
- Docker Desktop
- PostgreSQL (through Docker)
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/premjaiswal0117/FinanceIQ.git
cd FinanceIQ
```

### Step 2: Configure Environment Variables

Create your local environment file from the example:

**Git Bash:**

```bash
cp .env.example .env
```

Open `.env` and configure your local PostgreSQL connection, database credentials, and a randomly generated JWT signing secret.

The `.env` file contains private local settings and must never be committed to GitHub.

### Step 3: Start PostgreSQL and Airflow

```bash
cd Airflow
docker compose up -d
```

Services:

- PostgreSQL: `localhost:5433`
- Airflow Webserver: `http://localhost:8080`

Use your locally configured development credentials for Airflow.

The `financeiq` database is initialized using the provided SQL initialization script.

### Step 4: Prepare Transaction Data

Place your source transaction CSV file in:

```text
Data/Raw/
```

Run the data processing scripts from the project root:

```bash
python Pipeline/02_Data_quality.py
```

```bash
python Pipeline/03_Data_cleaning.py
```

```bash
python Pipeline/04_PySpark_to_PostgreSQL.py
```

These scripts perform data quality checks, cleaning, transformation, and loading into PostgreSQL.

The ETL workflow can also be orchestrated through the Apache Airflow DAG.

### Step 5: Train the Machine Learning Model

Run:

```bash
python Analytics/ML/expense_prediction.py
```

The script trains a Random Forest regression model using time-based transaction features and saves the trained model as:

```text
Analytics/ML/expense_prediction_model.pkl
```

### Step 6: Launch the FastAPI Backend

Run from the project root:

```bash
python -m uvicorn Backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend endpoints:

- API Documentation: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`
- Database Diagnostic: `http://127.0.0.1:8000/database-test`

### Step 7: Launch the React Frontend

Open another terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The Vite development server proxies `/api` requests to the FastAPI backend.

## Demo Accounts

FinanceIQ includes predefined sample accounts for local development and testing.

Their initialization is handled by:

```text
Backend/app/init_db.py
```

These accounts are intended for development only. Configure secure credentials before deploying the application publicly. Never reuse development passwords in production.

## Automated Test Suites

FinanceIQ includes the following test scripts in the `Backend/` directory.

### 1. Multilingual Language Evaluation

```bash
python Backend/test_languages.py
```

Evaluates queries across English, Hinglish, Hindi, and Marathi.

### 2. AI Copilot Test

```bash
python Backend/test_ai.py
```

Tests AI Copilot functionality. Requires the backend to be running.

### 3. Chat Reproducibility Test

```bash
python Backend/test_reproduce.py
```

Tests new-user initialization and chat reproducibility.

### 4. Database Schema Verification

```bash
python Backend/scratch_check.py
```

Checks database schema and goal-related functionality.

## Environment Configuration

The `.env.example` file provides the required configuration template.

Important variables include:

```ini
# PostgreSQL - Backend
DATABASE_URL=postgresql+psycopg2://your_user:your_password@localhost:5433/financeiq

# Airflow Metadata Database
AIRFLOW_DATABASE_URL=postgresql+psycopg2://your_user:your_password@localhost:5433/airflow

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=financeiq
DB_USER=your_user
DB_PASSWORD=your_password

# ETL Configuration
RELOAD_TRUNCATE=false

# JWT Authentication
FINANCEIQ_SECRET_KEY=replace_with_a_random_secret

# Optional AI Integration
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Replace the placeholders with your own local configuration. Never publish actual passwords, API keys, or signing secrets.

## Data Privacy

The raw and processed transaction datasets are excluded from this public repository.

To run the data pipeline, place your own compatible CSV files in the appropriate local folders:

```text
Data/Raw/
Data/Processed/
```

Do not upload real personal financial records, confidential information, or sensitive customer data.

## Future Enhancements

- Cloud-based data storage and processing.
- Automated financial data ingestion.
- Advanced forecasting and anomaly detection.
- Improved model monitoring and evaluation.
- Production deployment and scalability improvements.

## Contributors

- Prem Jaiswal
- Atharva Nemane
- Krishna Lalsare

## Project Information

**Project:** FinanceIQ – Personal Financial Intelligence Platform

**Domain:** Data Engineering and Data Science

**Repository:** [https://github.com/premjaiswal0117/FinanceIQ](https://github.com/premjaiswal0117/FinanceIQ)

---

*Developed as a final-year B.Tech project.*