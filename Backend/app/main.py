
import uuid
import datetime
from pathlib import Path
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest
from fastapi import FastAPI, Depends, HTTPException, status, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, create_engine
from sqlalchemy.orm import Session
from typing import Optional, List

from .database import get_db
from .models import (
    UserSignup,
    UserLogin,
    UserResponse,
    TokenResponse,
    TransactionCreate,
    MonthSummaryResponse,
    ForgotPasswordRequest,
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    BulkTransactionRequest,
    BulkTransactionResponse,
    ChatMessageRequest,
    ChatResponse
)
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional,
    require_admin,
)
from .init_db import init_database
from .ai_copilot import get_ai_status, handle_ai_chat

PROJECT_ROOT = Path(__file__).resolve().parents[2]

app = FastAPI(
    title="FinanceIQ API",
    description="Backend API for FinanceIQ personal financial analytics platform",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    try:
        init_database()
    except Exception as exc:
        print(f"Notice: Database initialization deferred (PostgreSQL check): {exc}")


@app.get("/")
def home():
    return {
        "message": "FinanceIQ Personal Financial Intelligence API is running",
        "status": "success",
        "version": "2.1.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/database-test")
def database_test(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT COUNT(*) FROM transactions"))
    count = result.scalar()

    user_count_res = db.execute(text("SELECT COUNT(*) FROM users"))
    user_count = user_count_res.scalar()

    return {
        "database": "connected",
        "transaction_count": count,
        "registered_users": user_count
    }


# ==================================================
# AUTHENTICATION ENDPOINTS
# ==================================================

@app.post("/auth/signup", response_model=TokenResponse)
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    """
    Registers a new individual user. Every new user starts with
    a unique user_id (e.g. U151+) with â‚¹0 balance and 0 transactions.
    """
    email_clean = payload.email.strip().lower()

    # Check if email exists
    existing = db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": email_clean}
    ).fetchone()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Generate next unique user_id (e.g. U151, U152...)
    max_id_res = db.execute(text("""
        SELECT COALESCE(MAX(CAST(SUBSTRING(user_id FROM 2) AS INTEGER)), 150)
        FROM (
            SELECT user_id FROM transactions WHERE user_id ~ '^U[0-9]+$'
            UNION
            SELECT user_id FROM users WHERE user_id ~ '^U[0-9]+$'
        ) u;
    """)).scalar()
    next_num = (max_id_res or 150) + 1
    assigned_user_id = f"U{next_num:03d}"

    pwd_hash, salt = hash_password(payload.password)

    insert_res = db.execute(
        text("""
            INSERT INTO users (user_id, email, hashed_password, salt, full_name)
            VALUES (:user_id, :email, :hashed_password, :salt, :full_name)
            RETURNING id, user_id, email, full_name, created_at;
        """),
        {
            "user_id": assigned_user_id,
            "email": email_clean,
            "hashed_password": pwd_hash,
            "salt": salt,
            "full_name": payload.full_name.strip()
        }
    )
    db.commit()
    user_row = insert_res.fetchone()

    user_dict = {
        "id": user_row.id,
        "user_id": user_row.user_id,
        "email": user_row.email,
        "full_name": user_row.full_name,
        "created_at": str(user_row.created_at) if user_row.created_at else None
    }

    token = create_access_token(user_dict)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict
    }


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()

    result = db.execute(
        text("SELECT id, user_id, email, hashed_password, salt, full_name, COALESCE(role, 'user') AS role, created_at FROM users WHERE email = :email"),
        {"email": email_clean}
    )
    user_row = result.fetchone()

    if not user_row or not verify_password(payload.password, user_row.hashed_password, user_row.salt):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    user_dict = {
        "id": user_row.id,
        "user_id": user_row.user_id,
        "email": user_row.email,
        "full_name": user_row.full_name,
        "role": user_row.role or "user",
        "created_at": str(user_row.created_at) if user_row.created_at else None
    }

    token = create_access_token(user_dict)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict
    }


@app.post("/auth/demo-login", response_model=TokenResponse)
def demo_login(db: Session = Depends(get_db)):
    """
    Secure demo login: directly authenticates into dedicated demo profile (Alex Turner, U036)
    without disclosing or requiring passwords in the UI.
    """
    result = db.execute(
        text("SELECT id, user_id, email, full_name, COALESCE(role, 'user') AS role, created_at FROM users WHERE user_id = 'U036' LIMIT 1")
    )
    user_row = result.fetchone()

    if not user_row:
        # Re-initialize demo user if needed
        init_database()
        result = db.execute(
            text("SELECT id, user_id, email, full_name, COALESCE(role, 'user') AS role, created_at FROM users WHERE user_id = 'U036' LIMIT 1")
        )
        user_row = result.fetchone()

    user_dict = {
        "id": user_row.id,
        "user_id": user_row.user_id,
        "email": user_row.email,
        "full_name": user_row.full_name,
        "role": user_row.role or "user",
        "created_at": str(user_row.created_at) if user_row.created_at else None
    }

    token = create_access_token(user_dict)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict
    }


@app.post("/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    return {
        "status": "success",
        "message": "Password reset is not currently enabled. Contact the system administrator for assistance."
    }
    if email in demo_passwords:
        return {
            "status": "success",
            "message": f"Demo account: Password for {email} is '{demo_passwords[email]}'."
        }

    user_row = db.execute(
        text("SELECT id, user_id, email, full_name FROM users WHERE LOWER(email) = :email"),
        {"email": email}
    ).fetchone()

    if user_row:
        return {
            "status": "success",
            "message": f"Account located for {email}. Password recovery instructions have been dispatched."
        }

    return {
        "status": "success",
        "message": "If an account matches that email, password recovery instructions have been dispatched."
    }


@app.post("/auth/admin-demo-login", response_model=TokenResponse)
def admin_demo_login(db: Session = Depends(get_db)):
    """
    Direct demo login for System Administrator (admin@financeiq.com).
    """
    result = db.execute(
        text("SELECT id, user_id, email, full_name, COALESCE(role, 'admin') AS role, created_at FROM users WHERE email = 'admin@financeiq.com' LIMIT 1")
    )
    user_row = result.fetchone()

    if not user_row:
        init_database()
        result = db.execute(
            text("SELECT id, user_id, email, full_name, COALESCE(role, 'admin') AS role, created_at FROM users WHERE email = 'admin@financeiq.com' LIMIT 1")
        )
        user_row = result.fetchone()

    user_dict = {
        "id": user_row.id,
        "user_id": user_row.user_id,
        "email": user_row.email,
        "full_name": user_row.full_name,
        "role": "admin",
        "created_at": str(user_row.created_at) if user_row.created_at else None
    }

    token = create_access_token(user_dict)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_dict
    }


# ==================================================
# ADMIN DASHBOARD & SYSTEM METRICS ENDPOINTS
# ==================================================

@app.get("/admin/system-stats")
def get_admin_system_stats(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns platform-wide administrative metrics:
    - Registered user accounts and activity
    - Global transaction volumes and counts
    - PostgreSQL connection pool, size, and table inventory
    - Apache Airflow orchestration state, DAG runs, and pipeline stages
    Strictly protected: Accessible only by users with 'admin' role.
    """
    # 1. Total users
    total_users = db.execute(text("SELECT COUNT(*) FROM users")).scalar() or 0

    # 2. Total transactions
    total_txns = db.execute(text("SELECT COUNT(*) FROM transactions")).scalar() or 0

    # 3. Total volume
    total_volume = db.execute(text("SELECT COALESCE(SUM(amount), 0) FROM transactions")).scalar() or 0.0

    # 4. Income vs Expense breakdown
    inc_exp_res = db.execute(text("""
        SELECT transaction_type, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
        FROM transactions
        GROUP BY transaction_type
    """)).fetchall()
    type_breakdown = {r.transaction_type: {"count": r.count, "total": float(r.total)} for r in inc_exp_res}

    # 5. Database health & metrics
    db_version = "PostgreSQL"
    db_size = "N/A"
    db_connections = 0
    tables_breakdown = []
    try:
        ver_row = db.execute(text("SELECT version()")).scalar()
        if ver_row:
            db_version = ver_row.split(",")[0]
        db_size = db.execute(text("SELECT pg_size_pretty(pg_database_size('financeiq'))")).scalar() or "N/A"
        db_connections = db.execute(text("SELECT count(*) FROM pg_stat_activity WHERE datname = 'financeiq'")).scalar() or 0

        table_names = ['transactions', 'users', 'goals', 'monthly_summary', 'category_summary', 'overall_summary', 'income_expense_summary', 'user_summary']
        for tname in table_names:
            try:
                cnt = db.execute(text(f"SELECT COUNT(*) FROM {tname}")).scalar()
                tables_breakdown.append({"name": tname, "rows": cnt})
            except Exception:
                pass
    except Exception as e:
        print(f"Error querying database metrics: {e}")

    # 6. Airflow / ETL Status
    airflow_info = {
        "status": "operational",
        "connected": False,
        "dag_id": "financeiq_etl_pipeline",
        "engine": "Apache Airflow 2.10.x (Standalone Docker Container)",
        "total_runs": 0,
        "success_runs": 0,
        "failed_runs": 0,
        "last_run": None,
        "recent_runs": [],
        "pipeline_tasks": [
            {
                "step": 1,
                "task_id": "data_quality",
                "name": "Data Quality Inspection",
                "script": "Pipeline/02_Data_quality.py",
                "status": "completed",
                "description": "Verifies data schemas, null constraints, and value boundaries."
            },
            {
                "step": 2,
                "task_id": "data_cleaning",
                "name": "Data Cleaning & Schema Normalization",
                "script": "Pipeline/03_Data_cleaning.py",
                "status": "completed",
                "description": "Normalizes categories, trims anomalies, and formats timestamps."
            },
            {
                "step": 3,
                "task_id": "pyspark_to_postgresql",
                "name": "PySpark Distributed Ingestion into PostgreSQL",
                "script": "Pipeline/04_PySpark_to_PostgreSQL.py",
                "status": "completed",
                "description": "Executes PySpark distributed load to populate verified dimensional tables in PostgreSQL."
            }
        ]
    }

    try:
        import os
        airflow_db_url = os.getenv(
            "AIRFLOW_DATABASE_URL",
            "postgresql+psycopg2://airflow:airflow@localhost:5433/airflow"
        )
        airflow_engine = create_engine(
            airflow_db_url,
            connect_args={"connect_timeout": 3}
        )
        with airflow_engine.connect() as aconn:
            airflow_info["connected"] = True
            tot_runs = aconn.execute(text("SELECT COUNT(*) FROM dag_run WHERE dag_id = 'financeiq_etl_pipeline'")).scalar() or 0
            succ_runs = aconn.execute(text("SELECT COUNT(*) FROM dag_run WHERE dag_id = 'financeiq_etl_pipeline' AND state = 'success'")).scalar() or 0
            fail_runs = aconn.execute(text("SELECT COUNT(*) FROM dag_run WHERE dag_id = 'financeiq_etl_pipeline' AND state = 'failed'")).scalar() or 0
            airflow_info["total_runs"] = tot_runs
            airflow_info["success_runs"] = succ_runs
            airflow_info["failed_runs"] = fail_runs

            recent_runs_res = aconn.execute(text("""
                SELECT run_id, state, logical_date, start_date, end_date
                FROM dag_run
                WHERE dag_id = 'financeiq_etl_pipeline'
                ORDER BY id DESC
                LIMIT 6
            """)).fetchall()

            runs_list = []
            for r in recent_runs_res:
                duration = None
                if r.start_date and r.end_date:
                    duration = round((r.end_date - r.start_date).total_seconds(), 2)
                runs_list.append({
                    "run_id": r.run_id,
                    "state": r.state,
                    "logical_date": str(r.logical_date) if r.logical_date else None,
                    "start_date": str(r.start_date) if r.start_date else None,
                    "end_date": str(r.end_date) if r.end_date else None,
                    "duration_seconds": duration
                })
            airflow_info["recent_runs"] = runs_list
            if runs_list:
                airflow_info["last_run"] = runs_list[0]
    except Exception as e:
        print(f"Airflow database query notice: {e}")
        airflow_info["status"] = "standalone_container_active"

    # 7. Users list with transaction counts
    users_res = db.execute(text("""
        SELECT u.id, u.user_id, u.email, u.full_name, COALESCE(u.role, 'user') AS role, u.created_at,
               COUNT(t.transaction_id) as tx_count
        FROM users u
        LEFT JOIN transactions t ON u.user_id = t.user_id
        GROUP BY u.id, u.user_id, u.email, u.full_name, u.role, u.created_at
        ORDER BY u.id ASC
    """)).fetchall()
    users_list = [
        {
            "id": u.id,
            "user_id": u.user_id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "created_at": str(u.created_at) if u.created_at else None,
            "transaction_count": u.tx_count
        }
        for u in users_res
    ]

    # 8. Recent transactions cross-system audit
    recent_tx_res = db.execute(text("""
        SELECT transaction_id, user_id, date, transaction_type, category, amount, payment_mode, location, notes
        FROM transactions
        ORDER BY date DESC, transaction_id DESC
        LIMIT 10
    """)).fetchall()
    recent_tx_list = [
        {
            "transaction_id": r.transaction_id,
            "user_id": r.user_id,
            "date": str(r.date),
            "transaction_type": r.transaction_type,
            "category": r.category,
            "amount": float(r.amount),
            "payment_mode": r.payment_mode,
            "location": r.location,
            "notes": r.notes
        }
        for r in recent_tx_res
    ]

    return {
        "status": "success",
        "system_kpis": {
            "total_users": total_users,
            "total_transactions": total_txns,
            "total_volume": float(total_volume),
            "type_breakdown": type_breakdown
        },
        "database": {
            "status": "online",
            "engine": "PostgreSQL",
            "database_name": "financeiq",
            "version": db_version,
            "size": db_size,
            "active_connections": db_connections,
            "tables": tables_breakdown
        },
        "etl_airflow": airflow_info,
        "users": users_list,
        "recent_transactions": recent_tx_list
    }


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


# ==================================================
# TRANSACTIONS MANAGEMENT ENDPOINTS
# ==================================================

@app.post("/transactions")
def create_transaction(
    payload: TransactionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Records a new transaction for the authenticated user and persists it to PostgreSQL.
    """
    user_id = current_user["user_id"]
    new_txn_id = f"T_{uuid.uuid4().hex[:7].upper()}"

    db.execute(
        text("""
            INSERT INTO transactions (
                transaction_id,
                user_id,
                date,
                transaction_type,
                category,
                amount,
                payment_mode,
                location,
                notes
            )
            VALUES (
                :transaction_id,
                :user_id,
                :date,
                :transaction_type,
                :category,
                :amount,
                :payment_mode,
                :location,
                :notes
            );
        """),
        {
            "transaction_id": new_txn_id,
            "user_id": user_id,
            "date": payload.date,
            "transaction_type": payload.transaction_type,
            "category": payload.category,
            "amount": abs(payload.amount),
            "payment_mode": payload.payment_mode or "UPI",
            "location": payload.location or "Online",
            "notes": payload.notes or ""
        }
    )
    db.commit()

    return {
        "status": "success",
        "transaction": {
            "transaction_id": new_txn_id,
            "user_id": user_id,
            "date": payload.date,
            "transaction_type": payload.transaction_type,
            "category": payload.category,
            "amount": abs(payload.amount),
            "payment_mode": payload.payment_mode,
            "location": payload.location,
            "notes": payload.notes
        }
    }


@app.post("/transactions/bulk", response_model=BulkTransactionResponse)
def bulk_create_transactions(
    payload: BulkTransactionRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Performs atomic bulk ingestion of user transactions (e.g. from bank statement CSVs).
    Deduplicates against existing user transactions to avoid double imports.
    """
    user_id = current_user["user_id"]
    if not payload.transactions:
        return {
            "status": "success",
            "imported": 0,
            "skipped": 0,
            "failed": 0,
            "errors": ["No transactions provided in upload"]
        }

    # Fetch existing transaction signatures for this user to prevent accidental duplicates
    existing_res = db.execute(
        text("""
            SELECT date, transaction_type, amount, COALESCE(notes, '') as notes
            FROM transactions
            WHERE user_id = :user_id
        """),
        {"user_id": user_id}
    )
    existing_set = {
        (str(r.date), r.transaction_type, round(float(r.amount), 2), r.notes.strip().lower())
        for r in existing_res.fetchall()
    }

    imported = 0
    skipped = 0
    failed = 0
    errors = []
    insert_records = []

    for idx, item in enumerate(payload.transactions):
        try:
            amt = abs(float(item.amount))
            if amt <= 0:
                skipped += 1
                continue

            raw_type = (item.transaction_type or "").strip().capitalize()
            if raw_type not in ["Income", "Expense"]:
                skipped += 1
                continue

            d_str = str(item.date).strip()
            # Validate ISO date format YYYY-MM-DD
            datetime.date.fromisoformat(d_str)

            notes_clean = (item.notes or "").strip()
            sig = (d_str, raw_type, round(amt, 2), notes_clean.lower())

            if sig in existing_set:
                skipped += 1
                continue

            existing_set.add(sig)
            new_txn_id = f"T_{uuid.uuid4().hex[:7].upper()}"

            insert_records.append({
                "transaction_id": new_txn_id,
                "user_id": user_id,
                "date": d_str,
                "transaction_type": raw_type,
                "category": (item.category or "Other").strip(),
                "amount": amt,
                "payment_mode": item.payment_mode or "Bank",
                "location": item.location or "Unknown",
                "notes": notes_clean
            })
            imported += 1
        except Exception as e:
            failed += 1
            if len(errors) < 5:
                errors.append(f"Row {idx + 1}: {str(e)}")

    if insert_records:
        db.execute(
            text("""
                INSERT INTO transactions (
                    transaction_id, user_id, date, transaction_type,
                    category, amount, payment_mode, location, notes
                )
                VALUES (
                    :transaction_id, :user_id, :date, :transaction_type,
                    :category, :amount, :payment_mode, :location, :notes
                )
            """),
            insert_records
        )
        db.commit()

    return {
        "status": "success",
        "imported": imported,
        "skipped": skipped,
        "failed": failed,
        "errors": errors
    }


@app.get("/transactions/recent")
def recent_transactions(
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = current_user["user_id"]

    result = db.execute(
        text("""
            SELECT
                transaction_id,
                user_id,
                date,
                transaction_type,
                category,
                amount,
                payment_mode,
                location,
                notes
            FROM transactions
            WHERE user_id = :user_id
            ORDER BY date DESC, transaction_id DESC
            LIMIT :limit
        """),
        {"user_id": target_user_id, "limit": limit}
    )
    rows = result.fetchall()

    return [
        {
            "transaction_id": row.transaction_id,
            "user_id": row.user_id,
            "date": str(row.date),
            "transaction_type": row.transaction_type,
            "category": row.category,
            "amount": float(row.amount or 0),
            "payment_mode": row.payment_mode,
            "location": row.location,
            "notes": row.notes
        }
        for row in rows
    ]



# ==================================================
# USER-SCOPED ANALYTICS ENDPOINTS
# ==================================================

@app.get("/analytics/summary")
def analytics_summary(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = current_user["user_id"]

    result = db.execute(
        text("""
            SELECT
                COALESCE(SUM(CASE WHEN transaction_type = 'Income' THEN ABS(amount) ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN transaction_type = 'Expense' THEN ABS(amount) ELSE 0 END), 0) AS total_expense,
                COALESCE(SUM(CASE WHEN transaction_type = 'Income' THEN ABS(amount) WHEN transaction_type = 'Expense' THEN -ABS(amount) ELSE 0 END), 0) AS net_balance,
                COUNT(*) AS transaction_count
            FROM transactions
            WHERE user_id = :user_id
        """),
        {"user_id": target_user_id}
    )
    row = result.fetchone()

    total_income = float(row.total_income or 0)
    total_expense = float(row.total_expense or 0)
    net_bal = float(row.net_balance or 0)
    savings_rate = round(((total_income - total_expense) / total_income * 100), 1) if total_income > 0 else 0.0

    return {
        "user_id": target_user_id,
        "total_income": total_income,
        "total_expense": total_expense,
        "net_balance": net_bal,
        "net_savings": net_bal,
        "savings_rate": savings_rate,
        "transaction_count": int(row.transaction_count or 0)
    }


@app.get("/analytics/month-summary", response_model=MonthSummaryResponse)
def analytics_month_summary(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes income, expenses, balance, and savings rate for a specific month.
    If year/month not provided, checks the user's latest transaction month,
    or falls back to current calendar month.
    """
    target_user_id = current_user["user_id"]

    if not year or not month:
        # Determine latest month for this user
        latest_res = db.execute(
            text("""
                SELECT EXTRACT(YEAR FROM date)::INT AS yr, EXTRACT(MONTH FROM date)::INT AS mo
                FROM transactions
                WHERE user_id = :user_id AND date IS NOT NULL
                ORDER BY date DESC
                LIMIT 1
            """),
            {"user_id": target_user_id}
        ).fetchone()

        if latest_res:
            target_year = latest_res.yr
            target_month = latest_res.mo
        else:
            now = datetime.datetime.now()
            target_year = now.year
            target_month = now.month
    else:
        target_year = year
        target_month = month

    result = db.execute(
        text("""
            SELECT
                COALESCE(SUM(CASE WHEN transaction_type = 'Income' THEN ABS(amount) ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN transaction_type = 'Expense' THEN ABS(amount) ELSE 0 END), 0) AS expenses,
                COUNT(*) AS tx_count
            FROM transactions
            WHERE user_id = :user_id
              AND EXTRACT(YEAR FROM date) = :year
              AND EXTRACT(MONTH FROM date) = :month
        """),
        {"user_id": target_user_id, "year": target_year, "month": target_month}
    )
    row = result.fetchone()

    income = float(row.income or 0)
    expenses = float(row.expenses or 0)
    balance = income - expenses
    savings_rate = ((income - expenses) / income * 100) if income > 0 else 0.0

    return {
        "year": target_year,
        "month": target_month,
        "income": income,
        "expenses": expenses,
        "balance": balance,
        "savings_rate": round(savings_rate, 1),
        "transaction_count": int(row.tx_count or 0)
    }


@app.get("/analytics/available-months")
def analytics_available_months(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns list of distinct (year, month) pairs where the user has transactions.
    """
    target_user_id = current_user["user_id"]

    result = db.execute(
        text("""
            SELECT
                EXTRACT(YEAR FROM date)::INT AS year,
                EXTRACT(MONTH FROM date)::INT AS month,
                COUNT(*) as count
            FROM transactions
            WHERE user_id = :user_id AND date IS NOT NULL
            GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
            ORDER BY year DESC, month DESC
        """),
        {"user_id": target_user_id}
    )
    rows = result.fetchall()

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    if not rows:
        now = datetime.datetime.now()
        return [{
            "year": now.year,
            "month": now.month,
            "label": f"{month_names[now.month - 1]} {now.year}",
            "count": 0
        }]

    return [
        {
            "year": row.year,
            "month": row.month,
            "label": f"{month_names[row.month - 1]} {row.year}",
            "count": row.count
        }
        for row in rows
    ]


@app.get("/analytics/categories")
def analytics_categories(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = current_user["user_id"]

    result = db.execute(
        text("""
            SELECT
                category,
                SUM(ABS(amount)) AS total_spending,
                COUNT(*) AS transaction_count
            FROM transactions
            WHERE transaction_type = 'Expense' AND user_id = :user_id
            GROUP BY category
            ORDER BY total_spending DESC
        """),
        {"user_id": target_user_id}
    )
    rows = result.fetchall()

    return [
        {
            "category": row.category,
            "total_spending": float(row.total_spending or 0),
            "transaction_count": int(row.transaction_count or 0)
        }
        for row in rows
    ]


@app.get("/analytics/monthly")
def analytics_monthly(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user_id = current_user["user_id"]

    result = db.execute(
        text("""
            SELECT
                EXTRACT(YEAR FROM date)::INT AS year,
                EXTRACT(MONTH FROM date)::INT AS month,
                SUM(CASE WHEN transaction_type = 'Income' THEN ABS(amount) ELSE 0 END) AS total_income,
                SUM(CASE WHEN transaction_type = 'Expense' THEN ABS(amount) ELSE 0 END) AS total_expense
            FROM transactions
            WHERE user_id = :user_id AND date IS NOT NULL
            GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
            ORDER BY year, month
        """),
        {"user_id": target_user_id}
    )
    rows = result.fetchall()

    return [
        {
            "year": int(row.year),
            "month": int(row.month),
            "total_income": float(row.total_income or 0),
            "total_expense": float(row.total_expense or 0)
        }
        for row in rows
    ]
# ==================================================
# ML - NEXT MONTH EXPENSE PREDICTION
# ==================================================

@app.get("/analytics/expense-prediction")
def expense_prediction(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Predicts the user's next month's total expenses
    using the trained FinanceIQ Random Forest model.
    """

    # Always use the authenticated user's ID.
    # This prevents one user from requesting another user's prediction.
    target_user_id = current_user["user_id"]

    model_path = PROJECT_ROOT / "Analytics" / "ML" / "expense_prediction_model.pkl"

    if not model_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Expense prediction model has not been trained yet."
        )

    saved_model = joblib.load(model_path)

    model = saved_model["model"]
    features = saved_model["features"]

    result = db.execute(
        text("""
            SELECT
                date,
                amount
            FROM transactions
            WHERE user_id = :user_id
              AND transaction_type = 'Expense'
              AND amount > 0
              AND date IS NOT NULL
            ORDER BY date
        """),
        {"user_id": target_user_id}
    )

    rows = result.fetchall()

    if len(rows) < 6:
        return {
            "user_id": target_user_id,
            "status": "insufficient_data",
            "message": "At least 6 months of expense history is required for prediction."
        }

    expense_data = pd.DataFrame(
        [
            {
                "date": row.date,
                "amount": float(row.amount)
            }
            for row in rows
        ]
    )

    expense_data["date"] = pd.to_datetime(expense_data["date"])
    expense_data["month"] = expense_data["date"].dt.to_period("M")

    monthly = (
        expense_data
        .groupby("month")["amount"]
        .sum()
        .reset_index()
    )

    monthly["month"] = monthly["month"].dt.to_timestamp()
    monthly = monthly.sort_values("month").reset_index(drop=True)

    amounts = monthly["amount"]

    if len(monthly) < 7:
        return {
            "user_id": target_user_id,
            "status": "insufficient_data",
            "message": "At least 7 monthly expense records are required for prediction."
        }

    previous_month = amounts.iloc[-1]
    two_months_ago = amounts.iloc[-2]
    three_months_ago = amounts.iloc[-3]

    average_last_3_months = amounts.iloc[-3:].mean()
    average_last_6_months = amounts.iloc[-6:].mean()

    minimum_last_3_months = amounts.iloc[-3:].min()
    maximum_last_3_months = amounts.iloc[-3:].max()

    user_average_expense = amounts.mean()
    user_median_expense = amounts.median()
    user_max_expense = amounts.max()

    spending_change = previous_month - two_months_ago

    if two_months_ago != 0:
        spending_change_percent = (
            spending_change / two_months_ago
        ) * 100
    else:
        spending_change_percent = 0

    if user_average_expense != 0:
        recent_vs_user_average = (
            average_last_3_months / user_average_expense
        )
    else:
        recent_vs_user_average = 1

    next_month = monthly["month"].iloc[-1] + pd.DateOffset(months=1)

    input_data = pd.DataFrame(
        [{
            "previous_month": previous_month,
            "two_months_ago": two_months_ago,
            "three_months_ago": three_months_ago,
            "average_last_3_months": average_last_3_months,
            "average_last_6_months": average_last_6_months,
            "minimum_last_3_months": minimum_last_3_months,
            "maximum_last_3_months": maximum_last_3_months,
            "user_average_expense": user_average_expense,
            "user_median_expense": user_median_expense,
            "user_max_expense": user_max_expense,
            "spending_change": spending_change,
            "spending_change_percent": spending_change_percent,
            "recent_vs_user_average": recent_vs_user_average,
            "month_number": next_month.month,
            "quarter": next_month.quarter,
        }]
    )

    prediction = float(
        model.predict(input_data[features])[0]
    )

    prediction = max(0, prediction)

    return {
        "user_id": target_user_id,
        "status": "success",
        "predicted_next_month_expense": round(prediction, 2),
        "recent_average_3_months": round(
            float(average_last_3_months), 2
        ),
        "recent_average_6_months": round(
            float(average_last_6_months), 2
        ),
        "previous_month_expense": round(
            float(previous_month), 2
        ),
        "spending_change_percent": round(
            float(spending_change_percent), 2
        ),
        "prediction_month": next_month.strftime("%Y-%m")
    }

# ==================================================
# ML - UNUSUAL EXPENSE DETECTION
# ==================================================

@app.get("/analytics/unusual-expenses")
def unusual_expenses(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Detects unusually large personal expense transactions
    for the authenticated user using Isolation Forest.
    """

    target_user_id = current_user["user_id"]

    result = db.execute(
        text("""
            SELECT
                transaction_id,
                date,
                category,
                amount,
                payment_mode,
                location,
                notes
            FROM transactions
            WHERE user_id = :user_id
              AND transaction_type = 'Expense'
              AND amount > 0
              AND date IS NOT NULL
            ORDER BY date DESC
        """),
        {"user_id": target_user_id}
    )

    rows = result.mappings().all()

    if len(rows) < 10:
        return {
            "user_id": target_user_id,
            "status": "insufficient_data",
            "message": "Add more transactions to detect unusual spending patterns.",
            "unusual_expenses": []
        }

    data = pd.DataFrame(rows)
    data["amount"] = pd.to_numeric(data["amount"], errors="coerce")
    data = data.dropna(subset=["amount"])

    if len(data) < 10:
        return {
            "user_id": target_user_id,
            "status": "insufficient_data",
            "message": "Add more transactions to detect unusual spending patterns.",
            "unusual_expenses": []
        }

    # Log transformation reduces the effect of very large legitimate expenses.
    model_data = pd.DataFrame({
        "amount": __import__("numpy").log1p(data["amount"].values)
    })

    detector = IsolationForest(
        n_estimators=200,
        contamination="auto",
        random_state=42
    )

    labels = detector.fit_predict(model_data)
    scores = detector.decision_function(model_data)

    data["anomaly"] = labels == -1
    data["anomaly_score"] = scores

    anomalies = data[data["anomaly"]].copy()

    # Return the strongest unusual transactions first.
    anomalies = anomalies.sort_values(
        by="anomaly_score",
        ascending=True
    ).head(5)

    unusual_expenses = []

    median_expense = float(data["amount"].median())

    for _, row in anomalies.iterrows():
        amount = float(row["amount"])

        if amount >= median_expense * 3:
            severity = "high"
        elif amount >= median_expense * 2:
            severity = "medium"
        else:
            severity = "low"

        unusual_expenses.append({
            "transaction_id": row["transaction_id"],
            "date": pd.to_datetime(row["date"]).strftime("%Y-%m-%d"),
            "category": row["category"],
            "amount": round(amount, 2),
            "payment_mode": row["payment_mode"],
            "location": row["location"],
            "notes": row["notes"],
            "severity": severity,
            "anomaly_score": round(float(row["anomaly_score"]), 4)
        })

    if not unusual_expenses:
        return {
            "user_id": target_user_id,
            "status": "success",
            "message": "Your spending looks normal based on your recent transaction history.",
            "detected_count": 0,
            "unusual_expenses": []
        }

    return {
        "user_id": target_user_id,
        "status": "success",
        "message": f"Detected {len(unusual_expenses)} transaction{'s' if len(unusual_expenses) != 1 else ''} outside your normal spending pattern.",
        "detected_count": len(unusual_expenses),
        "unusual_expenses": unusual_expenses
    }


# ==================================================
# SMART DYNAMIC GOAL TRACKER ENDPOINTS
# ==================================================

@app.get("/goals", response_model=List[GoalResponse])
def get_user_goals(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns user goals with dynamic monthly requirement calculation.
    Automatically recalculates future required monthly saving based on actual progress.
    """
    user_id = current_user["user_id"]
    result = db.execute(
        text("""
            SELECT goal_id, user_id, name, target_amount, current_saved, target_date, initial_monthly_target, created_at
            FROM goals
            WHERE user_id = :user_id
            ORDER BY target_date ASC
        """),
        {"user_id": user_id}
    )
    rows = result.fetchall()

    today = datetime.date.today()
    goals_list = []

    for row in rows:
        target_amt = float(row.target_amount or 0.0)
        curr_saved = float(row.current_saved or 0.0)
        rem_amt = max(0.0, round(target_amt - curr_saved, 2))

        target_d = row.target_date
        if isinstance(target_d, str):
            target_d = datetime.date.fromisoformat(target_d)

        created_d = row.created_at.date() if row.created_at else today

        # Calculate months remaining until target date
        months_remaining = (target_d.year - today.year) * 12 + (target_d.month - today.month)
        if months_remaining < 1:
            months_remaining = 1

        total_months = (target_d.year - created_d.year) * 12 + (target_d.month - created_d.month)
        if total_months < 1:
            total_months = 1

        orig_monthly = float(row.initial_monthly_target or 0.0)
        if orig_monthly <= 0:
            orig_monthly = round(target_amt / total_months, 2)

        # Dynamic monthly saving calculation
        if rem_amt <= 0:
            req_monthly = 0.0
        else:
            req_monthly = round(rem_amt / months_remaining, 2)

        progress_pct = min(100.0, round((curr_saved / target_amt * 100), 1)) if target_amt > 0 else 100.0

        elapsed_months = max(0, total_months - months_remaining)
        expected_saved_by_now = min(target_amt, orig_monthly * (elapsed_months + 1))
        shortfall_extra = round(curr_saved - expected_saved_by_now, 2)

        actual_monthly = round(curr_saved / max(1, elapsed_months + 1), 2)

        if curr_saved >= target_amt:
            goal_status = "Completed"
        elif curr_saved >= expected_saved_by_now + 50:
            goal_status = "Ahead"
        elif curr_saved >= expected_saved_by_now * 0.9:
            goal_status = "On Track"
        else:
            goal_status = "Behind"

        goals_list.append({
            "goal_id": row.goal_id,
            "user_id": row.user_id,
            "name": row.name,
            "target_amount": target_amt,
            "current_saved": curr_saved,
            "remaining_amount": rem_amt,
            "progress_percent": progress_pct,
            "target_date": target_d.isoformat(),
            "months_remaining": months_remaining,
            "original_monthly_target": orig_monthly,
            "current_required_monthly_saving": req_monthly,
            "actual_monthly_saving": actual_monthly,
            "shortfall_or_extra": shortfall_extra,
            "status": goal_status,
            "created_at": row.created_at.isoformat() if row.created_at else None
        })

    return goals_list


@app.post("/goals", response_model=GoalResponse)
def create_goal(
    payload: GoalCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new savings goal with target date and dynamic calculation.
    """
    user_id = current_user["user_id"]
    new_goal_id = f"G_{uuid.uuid4().hex[:8].upper()}"

    target_amt = abs(payload.target_amount)
    curr_saved = abs(payload.current_saved or 0.0)
    target_d = datetime.date.fromisoformat(payload.target_date)
    today = datetime.date.today()

    months_remaining = max(1, (target_d.year - today.year) * 12 + (target_d.month - today.month))
    initial_monthly = payload.initial_monthly_target or round(target_amt / months_remaining, 2)

    db.execute(
        text("""
            INSERT INTO goals (goal_id, user_id, name, target_amount, current_saved, target_date, initial_monthly_target)
            VALUES (:goal_id, :user_id, :name, :target_amount, :current_saved, :target_date, :initial_monthly_target);
        """),
        {
            "goal_id": new_goal_id,
            "user_id": user_id,
            "name": payload.name.strip(),
            "target_amount": target_amt,
            "current_saved": curr_saved,
            "target_date": payload.target_date,
            "initial_monthly_target": initial_monthly
        }
    )
    db.commit()

    rem_amt = max(0.0, round(target_amt - curr_saved, 2))
    req_monthly = round(rem_amt / months_remaining, 2) if rem_amt > 0 else 0.0
    progress_pct = min(100.0, round((curr_saved / target_amt * 100), 1)) if target_amt > 0 else 100.0

    return {
        "goal_id": new_goal_id,
        "user_id": user_id,
        "name": payload.name.strip(),
        "target_amount": target_amt,
        "current_saved": curr_saved,
        "remaining_amount": rem_amt,
        "progress_percent": progress_pct,
        "target_date": payload.target_date,
        "months_remaining": months_remaining,
        "original_monthly_target": initial_monthly,
        "current_required_monthly_saving": req_monthly,
        "actual_monthly_saving": curr_saved,
        "shortfall_or_extra": 0.0,
        "status": "On Track" if curr_saved < target_amt else "Completed",
        "created_at": datetime.datetime.now().isoformat()
    }


@app.put("/goals/{goal_id}")
def update_goal(
    goal_id: str,
    payload: GoalUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates saved amount, target, or date for an existing goal.
    """
    user_id = current_user["user_id"]
    existing = db.execute(
        text("SELECT * FROM goals WHERE goal_id = :goal_id AND user_id = :user_id"),
        {"goal_id": goal_id, "user_id": user_id}
    ).fetchone()

    if not existing:
        raise HTTPException(status_code=404, detail="Goal not found")

    updates = []
    params = {"goal_id": goal_id, "user_id": user_id}

    if payload.name is not None:
        updates.append("name = :name")
        params["name"] = payload.name.strip()
    if payload.target_amount is not None:
        updates.append("target_amount = :target_amount")
        params["target_amount"] = abs(payload.target_amount)
    if payload.current_saved is not None:
        updates.append("current_saved = :current_saved")
        params["current_saved"] = abs(payload.current_saved)
    if payload.target_date is not None:
        updates.append("target_date = :target_date")
        params["target_date"] = payload.target_date

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        db.execute(
            text(f"UPDATE goals SET {', '.join(updates)} WHERE goal_id = :goal_id AND user_id = :user_id"),
            params
        )
        db.commit()

    return {"status": "success", "message": "Goal updated successfully"}


@app.delete("/goals/{goal_id}")
def delete_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Removes a goal for the authenticated user.
    """
    user_id = current_user["user_id"]
    result = db.execute(
        text("DELETE FROM goals WHERE goal_id = :goal_id AND user_id = :user_id"),
        {"goal_id": goal_id, "user_id": user_id}
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"status": "success", "message": "Goal deleted successfully"}


# ==================================================
# SPENDING BEHAVIOR SEGMENTATION (TASK 8)
# ==================================================

@app.get("/analytics/spending-segmentation")
def spending_segmentation(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Evaluates spending behavior persona based on actual transaction patterns.
    """
    user_id = current_user["user_id"]
    res = db.execute(
        text("""
            SELECT
                COALESCE(SUM(CASE WHEN transaction_type = 'Income' THEN ABS(amount) ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN transaction_type = 'Expense' THEN ABS(amount) ELSE 0 END), 0) AS total_expense,
                COUNT(CASE WHEN transaction_type = 'Expense' THEN 1 END) as expense_count,
                AVG(CASE WHEN transaction_type = 'Expense' THEN ABS(amount) END) as avg_expense
            FROM transactions
            WHERE user_id = :user_id
        """),
        {"user_id": user_id}
    )
    row = res.fetchone()
    income = float(row.total_income or 0)
    expense = float(row.total_expense or 0)
    count = int(row.expense_count or 0)
    avg_exp = float(row.avg_expense or 0)

    if count < 3:
        return {
            "segment": "New Explorer",
            "persona": "Building Baseline",
            "description": "Add more transactions to analyze your spending profile.",
            "metrics": {
                "expense_count": count,
                "savings_rate": 0.0,
                "average_ticket": round(avg_exp, 2)
            }
        }

    savings_rate = ((income - expense) / income * 100) if income > 0 else 0.0

    cat_res = db.execute(
        text("""
            SELECT category, SUM(ABS(amount)) as cat_total
            FROM transactions
            WHERE user_id = :user_id AND transaction_type = 'Expense'
            GROUP BY category
            ORDER BY cat_total DESC
            LIMIT 1
        """),
        {"user_id": user_id}
    ).fetchone()

    top_cat = cat_res.category if cat_res else "General"
    top_cat_share = (float(cat_res.cat_total) / expense * 100) if (cat_res and expense > 0) else 0

    if top_cat_share >= 50.0:
        segment = "Category-focused Spender"
        persona = f"Concentrated on {top_cat}"
        desc = f"Over {top_cat_share:.0f}% of your monthly expenses are concentrated in {top_cat}."
    elif savings_rate >= 35.0:
        segment = "Low Spender"
        persona = "Disciplined Wealth Builder"
        desc = f"You retain {savings_rate:.1f}% of your earnings with disciplined expense control."
    elif savings_rate >= 15.0:
        segment = "Balanced Spender"
        persona = "Steady Cash Flow Manager"
        desc = "Your spending and savings are well balanced against your incoming cash flow."
    else:
        segment = "High Spender"
        persona = "High Outflow Profile"
        desc = "Expenses absorb most of your income. Focusing on top discretionary categories will improve reserves."

    return {
        "segment": segment,
        "persona": persona,
        "description": desc,
        "metrics": {
            "expense_count": count,
            "savings_rate": round(savings_rate, 1),
            "average_ticket": round(avg_exp, 2),
            "top_category": top_cat,
            "top_category_share": round(top_cat_share, 1)
        }
    }


# ==================================================
# AI PERSONAL FINANCE COPILOT
# ==================================================

@app.get("/ai/status")
def ai_status(current_user: dict = Depends(get_current_user)):
    """
    Returns AI Copilot provider configuration and model readiness status.
    """
    return get_ai_status()


@app.post("/ai/chat", response_model=ChatResponse)
def ai_chat(
    payload: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Personal Finance Assistant endpoint.
    Answers user queries about income, expenses, balance, categories,
    Needs vs Wants, unusual expenses, ML predictions, and savings goals
    strictly grounded on the authenticated user's isolated data.
    """
    try:
        user_currency = current_user.get("currency") or "INR"
        res = handle_ai_chat(db, current_user, payload.message, currency=user_currency)
        return ChatResponse(**res)
    except Exception as exc:
        import logging
        logging.getLogger("uvicorn.error").error(
            f"Unhandled exception in /ai/chat for user {current_user.get('user_id')}: {exc}",
            exc_info=True
        )
        user_name = current_user.get("full_name") or "there"
        return ChatResponse(
            reply=f"Hello {user_name}! I am FinanceIQ AI Assistant. I can help analyze your income, expenses, Needs vs Wants distribution, and savings goals. How can I help you today?",
            provider="builtin_analytics_engine",
            provider_label="FinanceIQ Analytics Engine",
            model="FinanceIQ Analytics Engine",
            configured=False,
            setup_required=None,
            data_points=None
        )


