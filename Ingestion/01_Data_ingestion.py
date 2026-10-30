import pandas as pd
from pathlib import Path

# Project root = parent of Ingestion folder
BASE_DIR = Path(__file__).resolve().parent.parent

# Raw dataset path
DATA_PATH = BASE_DIR / "Data" / "Raw" / "budgetwise_finance_dataset.csv"

# Load raw data
df = pd.read_csv(DATA_PATH)

print("\n========== DATASET OVERVIEW ==========")
print("Rows:", df.shape[0])
print("Columns:", df.shape[1])

print("\n========== COLUMNS ==========")
print(df.columns.tolist())

print("\n========== DATA TYPES ==========")
print(df.dtypes)

print("\n========== MISSING VALUES ==========")
print(df.isnull().sum())

print("\n========== DUPLICATES ==========")
print("Duplicate rows:", df.duplicated().sum())

print("\n========== SAMPLE DATA ==========")
print(df.head())

print("\n========== UNIQUE VALUES ==========")
for column in df.columns:
    print(f"{column}: {df[column].nunique()}")