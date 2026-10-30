import os
from pathlib import Path
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, year, month, dayofmonth, when, sum
import psycopg2
from psycopg2.extras import execute_batch


# ==================================================
# 1. CREATE SPARK SESSION
# ==================================================

spark = SparkSession.builder \
    .appName("FinanceIQ Transformation") \
    .master("local[*]") \
    .getOrCreate()


# ==================================================
# 2. PROJECT PATH
# ==================================================

BASE_DIR = Path(__file__).resolve().parent.parent

# Case-resilient path for Linux and Windows
processed_dir = BASE_DIR / "Data" / "Processed" if (BASE_DIR / "Data" / "Processed").exists() else BASE_DIR / "Data" / "processed"

INPUT_PATH = str(
    processed_dir / "cleaned_transactions.csv"
)


# ==================================================
# 3. READ CLEANED DATA
# ==================================================

df = spark.read.csv(
    INPUT_PATH,
    header=True,
    inferSchema=True
)

print("\n========== INPUT DATA ==========")

input_count = df.count()

print("Rows:", input_count)


# ==================================================
# 4. CHECK DUPLICATE TRANSACTION IDs
# ==================================================

print("\n========== CHECKING DUPLICATES ==========")

duplicate_count = (
    df.groupBy("transaction_id")
      .count()
      .filter(col("count") > 1)
      .count()
)

print(
    "Duplicate transaction IDs found:",
    duplicate_count
)


# ==================================================
# 5. REMOVE DUPLICATE TRANSACTION IDs
# ==================================================

df = df.dropDuplicates(
    ["transaction_id"]
)

deduplicated_count = df.count()

print(
    "Rows after removing duplicates:",
    deduplicated_count
)

print(
    "Duplicate rows removed:",
    input_count - deduplicated_count
)


# ==================================================
# 6. PYSPARK TRANSFORMATIONS
# ==================================================

df = df.withColumn(
    "year",
    year(col("date"))
)

df = df.withColumn(
    "month",
    month(col("date"))
)

df = df.withColumn(
    "day",
    dayofmonth(col("date"))
)

df = df.withColumn(
    "is_income",
    when(
        col("transaction_type") == "Income",
        1
    ).otherwise(0)
)

df = df.withColumn(
    "is_expense",
    when(
        col("transaction_type") == "Expense",
        1
    ).otherwise(0)
)

df = df.withColumn(
    "signed_amount",
    when(
        col("transaction_type") == "Expense",
        -col("amount")
    ).otherwise(
        col("amount")
    )
)


# ==================================================
# 7. DISPLAY TRANSFORMED DATA
# ==================================================

print("\n========== TRANSFORMED DATA ==========")

df.select(
    "transaction_id",
    "user_id",
    "date",
    "transaction_type",
    "category",
    "amount",
    "year",
    "month",
    "day",
    "is_income",
    "is_expense",
    "signed_amount"
).show(
    10,
    truncate=False
)


# ==================================================
# 8. MONTHLY SPENDING
# ==================================================

monthly_spending = df.filter(
    col("transaction_type") == "Expense"
).groupBy(
    "user_id",
    "year",
    "month"
).agg(
    sum("amount").alias("monthly_expense")
)

print("\n========== MONTHLY SPENDING ==========")

monthly_spending.show(
    10,
    truncate=False
)


# ==================================================
# 9. CONVERT PYSPARK DATA TO PANDAS
# ==================================================

print("\n========== PREPARING DATABASE LOAD ==========")

final_df = df.toPandas()

print(
    "Rows ready for PostgreSQL:",
    len(final_df)
)


# ==================================================
# 10. CONNECT TO POSTGRESQL (AUTO-DETECT ENVIRONMENT)
# ==================================================

is_in_docker = Path("/.dockerenv").exists() or bool(os.getenv("AIRFLOW_HOME"))
default_host = "postgres" if is_in_docker else "localhost"
default_port = 5432 if is_in_docker else 5433

db_host = os.getenv("DB_HOST", default_host)
db_port = int(os.getenv("DB_PORT", default_port))
db_name = os.getenv("DB_NAME", "financeiq")
db_user = os.getenv("DB_USER", "airflow")
db_password = os.getenv("DB_PASSWORD", "airflow")

print(f"Connecting to PostgreSQL at {db_host}:{db_port}/{db_name} (user: {db_user})...")

connection = psycopg2.connect(
    host=db_host,
    port=db_port,
    database=db_name,
    user=db_user,
    password=db_password
)

cursor = connection.cursor()

print("Connected to PostgreSQL successfully")


# ==================================================
# 11. CREATE TRANSACTIONS TABLE
# ==================================================

create_table_query = """
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    date DATE,
    transaction_type VARCHAR(20),
    category VARCHAR(100),
    amount NUMERIC,
    payment_mode VARCHAR(50),
    location VARCHAR(100),
    notes TEXT
);
"""

cursor.execute(create_table_query)

print("Transactions table ready")


# ==================================================
# 12. CLEAR EXISTING TRANSACTIONS (OPTIONAL / SAFEGUARDED)
# ==================================================

should_truncate = os.getenv("RELOAD_TRUNCATE", "false").lower() in ("true", "1", "yes")

if should_truncate:
    cursor.execute("TRUNCATE TABLE transactions;")
    print("Existing transaction data cleared (RELOAD_TRUNCATE=true)")
else:
    print("Preserving existing transactions (batch upsert mode: ON CONFLICT DO NOTHING)")


# ==================================================
# 13. INSERT TRANSFORMED DATA (OPTIMIZED BATCH INSERT)
# ==================================================

insert_query = """
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
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (transaction_id) DO NOTHING;
"""

records = [
    (
        row["transaction_id"],
        row["user_id"],
        row["date"],
        row["transaction_type"],
        row["category"],
        row["amount"],
        row["payment_mode"],
        row["location"],
        row["notes"]
    )
    for _, row in final_df.iterrows()
]

print(f"Executing batch insert for {len(records)} records...")
execute_batch(cursor, insert_query, records, page_size=1000)


# ==================================================
# 14. COMMIT
# ==================================================

connection.commit()

print("Data committed to PostgreSQL")


# ==================================================
# 15. VERIFY DATABASE
# ==================================================

cursor.execute(
    "SELECT COUNT(*) FROM transactions;"
)

database_count = cursor.fetchone()[0]

print("\n========== DATABASE LOAD COMPLETE ==========")

print(
    "Total rows verified in PostgreSQL:",
    database_count
)


# ==================================================
# 16. CLOSE DATABASE
# ==================================================

cursor.close()

connection.close()

print("PostgreSQL connection closed.")


# ==================================================
# 17. STOP SPARK
# ==================================================

spark.stop()

print(
    "\n========== FINANCEIQ PYSPARK PIPELINE COMPLETE =========="
)
