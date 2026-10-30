import pandas as pd
from pathlib import Path

# Project root
BASE_DIR = Path(__file__).resolve().parent.parent

# Dataset path (case-resilient for Linux and Windows)
raw_dir = BASE_DIR / "Data" / "Raw" if (BASE_DIR / "Data" / "Raw").exists() else BASE_DIR / "Data" / "raw"
DATA_PATH = raw_dir / "budgetwise_finance_dataset.csv"

# Load data
df = pd.read_csv(DATA_PATH)

print("\n========== DATA QUALITY REPORT ==========")

# 1. Missing values
print("\n--- Missing Values ---")
print(df.isnull().sum())

# 2. Duplicate records
print("\n--- Duplicate Records ---")
print("Duplicates:", df.duplicated().sum())

# 3. Data types
print("\n--- Data Types ---")
print(df.dtypes)

# 4. Invalid transaction types
print("\n--- Transaction Types ---")
print(df["transaction_type"].value_counts(dropna=False))

# 5. Negative amounts
print("\n--- Negative Amounts ---")
print("Negative amounts:", 
      (pd.to_numeric(df["amount"], errors="coerce") < 0).sum())

# 6. Quality summary
print("\n========== SUMMARY ==========")
print("Total records:", len(df))
print("Total columns:", len(df.columns))
print("Duplicate records:", df.duplicated().sum())
print("Missing values:", df.isnull().sum().sum())
