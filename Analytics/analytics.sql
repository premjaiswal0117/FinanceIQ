-- ==========================================
-- FinanceIQ Analytics
-- ==========================================

-- 1. Overall Financial Summary
CREATE OR REPLACE VIEW overall_summary AS
SELECT
    SUM(CASE
        WHEN transaction_type = 'Income'
        THEN ABS(amount)
        ELSE 0
    END) AS total_income,

    SUM(CASE
        WHEN transaction_type = 'Expense'
        THEN ABS(amount)
        ELSE 0
    END) AS total_expense,

    SUM(CASE
        WHEN transaction_type = 'Income'
        THEN ABS(amount)
        WHEN transaction_type = 'Expense'
        THEN -ABS(amount)
        ELSE 0
    END) AS net_balance
FROM transactions;


-- 2. Monthly Summary
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
    EXTRACT(YEAR FROM date)::INT AS year,
    EXTRACT(MONTH FROM date)::INT AS month,

    SUM(CASE
        WHEN transaction_type = 'Income'
        THEN ABS(amount)
        ELSE 0
    END) AS total_income,

    SUM(CASE
        WHEN transaction_type = 'Expense'
        THEN ABS(amount)
        ELSE 0
    END) AS total_expense
FROM transactions
WHERE date IS NOT NULL
GROUP BY
    EXTRACT(YEAR FROM date),
    EXTRACT(MONTH FROM date)
ORDER BY year, month;


-- 3. Category-wise Spending
CREATE OR REPLACE VIEW category_summary AS
SELECT
    category,
    SUM(ABS(amount)) AS total_spending,
    COUNT(*) AS transaction_count
FROM transactions
WHERE transaction_type = 'Expense'
GROUP BY category
ORDER BY total_spending DESC;


-- 4. User-wise Summary
CREATE OR REPLACE VIEW user_summary AS
SELECT
    user_id,

    SUM(CASE
        WHEN transaction_type = 'Income'
        THEN ABS(amount)
        ELSE 0
    END) AS total_income,

    SUM(CASE
        WHEN transaction_type = 'Expense'
        THEN ABS(amount)
        ELSE 0
    END) AS total_expense,

    COUNT(*) AS transaction_count
FROM transactions
GROUP BY user_id;


-- 5. Income vs Expense
CREATE OR REPLACE VIEW income_expense_summary AS
SELECT
    transaction_type,
    SUM(ABS(amount)) AS total_amount,
    COUNT(*) AS transaction_count
FROM transactions
GROUP BY transaction_type;