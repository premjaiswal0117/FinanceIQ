import pandas as pd
from pathlib import Path

# Project root
BASE_DIR = Path(__file__).resolve().parent.parent

# Dataset paths (case-resilient for Linux and Windows)
raw_dir = BASE_DIR / "Data" / "Raw" if (BASE_DIR / "Data" / "Raw").exists() else BASE_DIR / "Data" / "raw"
processed_dir = BASE_DIR / "Data" / "Processed" if (BASE_DIR / "Data" / "Processed").exists() else BASE_DIR / "Data" / "processed"

INPUT_PATH = raw_dir / "budgetwise_finance_dataset.csv"
OUTPUT_PATH = processed_dir / "cleaned_transactions.csv"

# Load raw data
df = pd.read_csv(INPUT_PATH)

print("========== START CLEANING ==========")
print("Original rows:", len(df))

# --------------------------------------------------
# 1. Remove exact duplicate rows
# --------------------------------------------------

duplicates = df.duplicated().sum()
df = df.drop_duplicates()

print("Duplicates removed:", duplicates)
print("Rows after duplicate removal:", len(df))


# --------------------------------------------------
# 2. Clean text formatting
# --------------------------------------------------

text_columns = [
    "transaction_type",
    "category",
    "payment_mode",
    "location",
    "notes"
]

for column in text_columns:
    df[column] = df[column].astype("string").str.strip()


# --------------------------------------------------
# 3. Standardize categories
# --------------------------------------------------

category_mapping = {
    "FOOD": "Food",
    "Food": "Food",
    "food": "Food",
    "Foods": "Food",
    "Fod": "Food",
    "Foodd": "Food",

    "RENT": "Rent",
    "Rent": "Rent",
    "rent": "Rent",
    "Rentt": "Rent",
    "Rnt": "Rent",

    "TRAVEL": "Travel",
    "Travel": "Travel",
    "travel": "Travel",
    "Traval": "Travel",
    "Travl": "Travel",

    "Entertain": "Entertainment",
    "Entrtnmnt": "Entertainment",
    "entertainment": "Entertainment",
    "Entertainment": "Entertainment",

    "Utility": "Utilities",
    "Utilties": "Utilities",
    "Utilities": "Utilities",
    "utilities": "Utilities",
    "Utlities": "Utilities",

    "education": "Education",
    "Education": "Education",
    "Educaton": "Education",
    "EDU": "Education",

    "health": "Health",
    "Health": "Health",
    "HEALTH": "Health",
    "Helth": "Health",

    "Savings": "Savings",
    "SAVINGS": "Savings",
    "savings": "Savings",
    "Saving": "Savings",

    "Others": "Other",
    "Other": "Other",
    "others": "Other",
    "OTHERS": "Other",
    "Misc": "Other"
}

df["category"] = df["category"].replace(category_mapping)

df["category"] = df["category"].fillna("Unknown")


# --------------------------------------------------
# 4. Standardize payment modes
# --------------------------------------------------

payment_mapping = {
    "UPI": "UPI",
    "Upi": "UPI",
    "upi": "UPI",
    "UPi": "UPI",

    "CARD": "Card",
    "Card": "Card",
    "card": "Card",
    "CRD": "Card",
    "Crd": "Card",

    "Cash": "Cash",
    "CASH": "Cash",
    "cash": "Cash",
    "Csh": "Cash",
    "csh": "Cash",

    "Bank Transfr": "Bank Transfer",
    "bank transfer": "Bank Transfer",
    "Bank Transfer": "Bank Transfer",
    "BankTransfer": "Bank Transfer",
    "Bank_Transfer": "Bank Transfer"
}

df["payment_mode"] = df["payment_mode"].replace(payment_mapping)

df["payment_mode"] = df["payment_mode"].fillna("Unknown")


# --------------------------------------------------
# 5. Standardize locations
# --------------------------------------------------

location_mapping = {
    "PUN": "Pune",
    "PUNE": "Pune",
    "pune": "Pune",

    "BAN": "Bangalore",
    "BANGALORE": "Bangalore",
    "Bangalore": "Bangalore",
    "bangalore": "Bangalore",

    "HYD": "Hyderabad",
    "HYDERABAD": "Hyderabad",
    "Hyderabad": "Hyderabad",
    "hyderabad": "Hyderabad",

    "AHM": "Ahmedabad",
    "AHMEDABAD": "Ahmedabad",
    "Ahmedabad": "Ahmedabad",
    "ahmedabad": "Ahmedabad",

    "DEL": "Delhi",
    "DELHI": "Delhi",
    "Delhi": "Delhi",
    "delhi": "Delhi",

    "MUM": "Mumbai",
    "MUMBAI": "Mumbai",
    "Mumbai": "Mumbai",
    "mumbai": "Mumbai",

    "CHE": "Chennai",
    "CHENNAI": "Chennai",
    "Chennai": "Chennai",
    "chennai": "Chennai",

    "KOL": "Kolkata",
    "KOLKATA": "Kolkata",
    "kolkata": "Kolkata",

    "JAI": "Jaipur",
    "JAIPUR": "Jaipur",
    "Jaipur": "Jaipur",

    "LUC": "Lucknow",
    "LUCKNOW": "Lucknow",
    "Lucknow": "Lucknow",
    "lucknow": "Lucknow"
}

df["location"] = df["location"].replace(location_mapping)

df["location"] = df["location"].fillna("Unknown")

# --------------------------------------------------
# 6. Convert amount to numeric
# --------------------------------------------------

df["amount"] = (
    df["amount"]
    .astype("string")
    .str.strip()
    .str.replace(",", "", regex=False)
    .str.replace("₹", "", regex=False)
    .str.replace("$", "", regex=False)
    .str.replace("Rs.", "", regex=False)
    .str.replace("INR", "", regex=False)
    .str.strip()
)

df["amount"] = pd.to_numeric(
    df["amount"],
    errors="coerce"
)


# --------------------------------------------------
# 6.1 Remove known invalid/sentinel amounts
# --------------------------------------------------

before_amount_filter = len(df)

invalid_amounts = [999999, 999999999]

df = df[
    df["amount"].notna() &
    (~df["amount"].abs().isin(invalid_amounts))
]

removed_extreme = before_amount_filter - len(df)

print("Invalid/sentinel amount records removed:", removed_extreme)

# --------------------------------------------------
# 7. Convert dates safely
# --------------------------------------------------

# Convert mixed date formats safely
def parse_date(value):
    if pd.isna(value):
        return pd.NaT

    value = str(value).strip()

    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d-%m-%y",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%m/%d/%y",
        "%d/%m/%y"
    ]

    for fmt in formats:
        try:
            return pd.to_datetime(value, format=fmt)
        except ValueError:
            continue

    return pd.NaT


df["date"] = df["date"].apply(parse_date)

print("\nInvalid/missing dates:", df["date"].isna().sum())
print("Missing amounts:", df["amount"].isna().sum())


# --------------------------------------------------
# 8. Handle missing notes
# --------------------------------------------------

df["notes"] = df["notes"].fillna("No notes")


# --------------------------------------------------
# 9. Remove only records with unusable critical data
# --------------------------------------------------

before = len(df)

df = df.dropna(
    subset=["transaction_id", "user_id", "date", "amount"]
)

removed = before - len(df)

print("Rows removed due to missing critical data:", removed)


# --------------------------------------------------
# 10. Save cleaned data
# --------------------------------------------------

OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)

df.to_csv(
    OUTPUT_PATH,
    index=False
)


# --------------------------------------------------
# 11. Final report
# --------------------------------------------------

print("\n========== CLEANING COMPLETE ==========")
print("Final rows:", len(df))
print("Final columns:", len(df.columns))
print("Saved to:", OUTPUT_PATH)

print("\n========== FINAL DATA TYPES ==========")
print(df.dtypes)

print("\n========== FINAL MISSING VALUES ==========")
print(df.isnull().sum())

print("\n========== FINAL CATEGORIES ==========")
print(df["category"].value_counts())
