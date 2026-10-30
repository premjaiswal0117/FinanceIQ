import sys
import pandas as pd
import numpy as np
from pathlib import Path

# Force UTF-8 on Windows consoles to prevent character encoding issues
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib


# ============================================================
# FinanceIQ - Improved Next Month Expense Prediction
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Case-resilient path for Linux and Windows
processed_dir = PROJECT_ROOT / "Data" / "Processed" if (PROJECT_ROOT / "Data" / "Processed").exists() else PROJECT_ROOT / "Data" / "processed"
DATA_PATH = processed_dir / "cleaned_transactions.csv"
MODEL_DIR = PROJECT_ROOT / "Analytics" / "ML"
MODEL_PATH = MODEL_DIR / "expense_prediction_model.pkl"


print("=" * 70)
print("FinanceIQ - Improved Next Month Expense Prediction")
print("=" * 70)


# ============================================================
# 1. Load dataset
# ============================================================

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)
df["date"] = pd.to_datetime(df["date"])

# Keep only valid positive expenses.
# Negative expense records are treated as dirty data
# and are excluded from ML training.
expenses = df[
    (df["transaction_type"].astype(str).str.lower() == "expense")
    & (df["amount"] > 0)
].copy()

print(f"Total transactions         : {len(df)}")
print(f"Valid expense transactions : {len(expenses)}")
print(f"Users                      : {expenses['user_id'].nunique()}")


# ============================================================
# 2. Create monthly expense totals
# ============================================================

expenses["month"] = expenses["date"].dt.to_period("M")

monthly = (
    expenses
    .groupby(["user_id", "month"])["amount"]
    .sum()
    .reset_index()
)

monthly["month"] = monthly["month"].dt.to_timestamp()

monthly = monthly.sort_values(
    ["user_id", "month"]
).reset_index(drop=True)

print(f"Monthly records            : {len(monthly)}")


# ============================================================
# 3. Historical spending features
# ============================================================

grouped = monthly.groupby("user_id")["amount"]

# Previous months
monthly["previous_month"] = grouped.shift(1)
monthly["two_months_ago"] = grouped.shift(2)
monthly["three_months_ago"] = grouped.shift(3)

# Recent averages
monthly["average_last_3_months"] = (
    grouped
    .transform(
        lambda x: x.shift(1).rolling(3).mean()
    )
)

monthly["average_last_6_months"] = (
    grouped
    .transform(
        lambda x: x.shift(1).rolling(6).mean()
    )
)

# Recent range
monthly["minimum_last_3_months"] = (
    grouped
    .transform(
        lambda x: x.shift(1).rolling(3).min()
    )
)

monthly["maximum_last_3_months"] = (
    grouped
    .transform(
        lambda x: x.shift(1).rolling(3).max()
    )
)


# ============================================================
# 4. User-specific spending profile
# ============================================================

# These features describe the user's normal spending level.
# shift(1) prevents the current target month from leaking
# into the feature calculation.

monthly["user_average_expense"] = (
    grouped
    .transform(
        lambda x: x.shift(1).expanding().mean()
    )
)

monthly["user_median_expense"] = (
    grouped
    .transform(
        lambda x: x.shift(1).expanding().median()
    )
)

monthly["user_max_expense"] = (
    grouped
    .transform(
        lambda x: x.shift(1).expanding().max()
    )
)


# ============================================================
# 5. Spending trend features
# ============================================================

monthly["spending_change"] = (
    monthly["previous_month"]
    - monthly["two_months_ago"]
)

monthly["spending_change_percent"] = (
    monthly["spending_change"]
    / monthly["two_months_ago"].replace(0, np.nan)
) * 100

# Compare recent spending with the user's normal spending.
monthly["recent_vs_user_average"] = (
    monthly["average_last_3_months"]
    / monthly["user_average_expense"].replace(0, np.nan)
)


# ============================================================
# 6. Calendar features
# ============================================================

monthly["month_number"] = monthly["month"].dt.month
monthly["quarter"] = monthly["month"].dt.quarter


# ============================================================
# 7. Prediction target
# ============================================================

# The target is the actual expense for the current month.
# All features are calculated from previous months.

monthly["target_expense"] = monthly["amount"]


# ============================================================
# 8. Prepare training data
# ============================================================

features = [
    "previous_month",
    "two_months_ago",
    "three_months_ago",
    "average_last_3_months",
    "average_last_6_months",
    "minimum_last_3_months",
    "maximum_last_3_months",
    "user_average_expense",
    "user_median_expense",
    "user_max_expense",
    "spending_change",
    "spending_change_percent",
    "recent_vs_user_average",
    "month_number",
    "quarter",
]

model_data = monthly.dropna(
    subset=features + ["target_expense"]
).copy()

model_data = model_data.sort_values("month")

print(f"Training-ready records     : {len(model_data)}")


# ============================================================
# 9. Time-based train/test split
# ============================================================

# Important:
# We do NOT randomly mix past and future data.
# Earlier months are used for training and later months
# are used for testing.

split_index = int(len(model_data) * 0.80)

train_data = model_data.iloc[:split_index]
test_data = model_data.iloc[split_index:]

X_train = train_data[features]
y_train = train_data["target_expense"]

X_test = test_data[features]
y_test = test_data["target_expense"]

print(f"Training samples           : {len(train_data)}")
print(f"Testing samples            : {len(test_data)}")


# ============================================================
# 10. Simple baseline
# ============================================================

# Baseline prediction:
# next month's expense = previous month's expense

baseline_predictions = test_data["previous_month"]

baseline_mae = mean_absolute_error(
    y_test,
    baseline_predictions
)

baseline_rmse = np.sqrt(
    mean_squared_error(
        y_test,
        baseline_predictions
    )
)

baseline_r2 = r2_score(
    y_test,
    baseline_predictions
)


# ============================================================
# 11. Train Random Forest
# ============================================================

print("\nTraining improved Random Forest...")

model = RandomForestRegressor(
    n_estimators=400,
    max_depth=14,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features="sqrt",
    random_state=42,
    n_jobs=-1,
)

model.fit(
    X_train,
    y_train
)


# ============================================================
# 12. Generate predictions
# ============================================================

predictions = model.predict(X_test)

mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = np.sqrt(
    mean_squared_error(
        y_test,
        predictions
    )
)

r2 = r2_score(
    y_test,
    predictions
)


# ============================================================
# 13. Compare baseline and ML model
# ============================================================

print("\n" + "=" * 70)
print("BASELINE vs IMPROVED ML MODEL")
print("=" * 70)

print("\nSimple Previous-Month Baseline:")
print(f"MAE  : Rs. {baseline_mae:,.2f}")
print(f"RMSE : Rs. {baseline_rmse:,.2f}")
print(f"R2   : {baseline_r2:.4f}")

print("\nImproved Random Forest:")
print(f"MAE  : Rs. {mae:,.2f}")
print(f"RMSE : Rs. {rmse:,.2f}")
print(f"R2   : {r2:.4f}")


if mae < baseline_mae:
    model_is_better = True
    print("\nRESULT: ML MODEL BEATS BASELINE")
else:
    model_is_better = False
    print("\nRESULT: BASELINE IS BETTER")


# ============================================================
# 14. Feature importance
# ============================================================

print("\n" + "=" * 70)
print("FEATURE IMPORTANCE")
print("=" * 70)

importance = pd.DataFrame({
    "feature": features,
    "importance": model.feature_importances_,
})

importance = importance.sort_values(
    "importance",
    ascending=False
)

for _, row in importance.iterrows():
    print(
        f"{row['feature']:<35}"
        f"{row['importance']:.4f}"
    )


# ============================================================
# 15. Save trained model
# ============================================================

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)

joblib.dump(
    {
        "model": model,
        "features": features,
        "model_is_better_than_baseline": model_is_better,
        "mae": mae,
        "rmse": rmse,
        "r2": r2,
    },
    MODEL_PATH
)


# ============================================================
# 16. Final output
# ============================================================

print("\n" + "=" * 70)
print("MODEL SAVED")
print("=" * 70)

print(f"Location: {MODEL_PATH}")

print("\nTraining completed successfully.")
