import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { LandingPage } from './components/landing/LandingPage';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Hero } from './components/layout/Hero';
import { KPIGrid } from './components/cards/KPIGrid';
import { CashFlowChart } from './components/charts/CashFlowChart';
import { CategoryDonutChart } from './components/charts/CategoryDonutChart';
import { NeedsVsWantsChart } from './components/charts/NeedsVsWantsChart';
import { FinancialInsights } from './components/insights/FinancialInsights';
import { TransactionTable } from './components/transactions/TransactionTable';
import { SystemStatusModal } from './components/status/SystemStatusModal';
import { ErrorBanner } from './components/common/ErrorBanner';
import { MonthSelector } from './components/common/MonthSelector';
import { formatCurrency, formatPercentage } from './utils/formatters';
import { useFinanceData } from './hooks/useFinanceData';
import { Bot, PlusCircle, Upload, Calendar, TrendingDown } from 'lucide-react';
import { AddTransactionModal } from './components/transactions/AddTransactionModal';
import { ImportCSVModal } from './components/transactions/ImportCSVModal';
import { GoalTracker } from './components/goals/GoalTracker';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AIAssistant } from './components/assistant/AIAssistant';
import { FloatingAIAssistant } from './components/assistant/FloatingAIAssistant';

function UnusualExpensesAlert({ unusualExpenses, anomalyLoading, currency = 'INR' }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#f59e0b',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            Smart Spending Alert
          </div>
          <h2
            style={{
              margin: '0.25rem 0 0',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: '#ffffff'
            }}
          >
            Unusual Expenses
          </h2>
          <p
            style={{
              margin: '0.35rem 0 0',
              fontSize: '0.82rem',
              color: 'var(--text-muted)'
            }}
          >
            Transactions that stand out from your normal spending pattern
          </p>
        </div>

        {!anomalyLoading && unusualExpenses?.status === 'success' && (
          <div
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#fbbf24',
              fontSize: '0.78rem',
              fontWeight: 800
            }}
          >
            {unusualExpenses.detected_count || 0} detected
          </div>
        )}
      </div>

      {anomalyLoading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Analyzing your expenses...
        </div>
      ) : unusualExpenses?.status !== 'success' ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {unusualExpenses?.message || 'Detection unavailable'}
        </div>
      ) : unusualExpenses.unusual_expenses?.length === 0 ? (
        <div
          style={{
            padding: '1rem',
            borderRadius: '10px',
            background: 'rgba(34, 197, 94, 0.08)',
            color: '#86efac',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          No unusual expenses detected. Your recent spending looks consistent.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          {unusualExpenses.unusual_expenses.slice(0, 5).map((item) => (
            <div
              key={item.transaction_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: '1rem',
                alignItems: 'center',
                padding: '0.8rem 0.9rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px'
              }}
            >
              <div>
                <div
                  style={{
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}
                >
                  {item.category || 'Expense'}
                </div>
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    marginTop: '0.2rem'
                  }}
                >
                  {item.date} · {item.notes || 'Unusual spending detected'}
                </div>
              </div>
              <div
                style={{
                  color:
                    item.severity === 'high'
                      ? '#f87171'
                      : item.severity === 'medium'
                        ? '#fbbf24'
                        : '#a5b4fc',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}
              >
                {item.severity}
              </div>
              <div
                style={{
                  color: '#ffffff',
                  fontWeight: 800
                }}
              >
                {formatCurrency(item.amount || 0, currency)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  const [currentTab, setCurrentTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isImportCSVOpen, setIsImportCSVOpen] = useState(false);
  const [expensePrediction, setExpensePrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(true);
  const [unusualExpenses, setUnusualExpenses] = useState(null);
  const [anomalyLoading, setAnomalyLoading] = useState(true);

  const {
    loading,
    refreshing,
    error,
    currency,
    setCurrency,
    lastUpdated,
    selectedYear,
    selectedMonth,
    availableMonths,
    monthSummary,
    summary,
    categories,
    monthly,
    transactions,
    isTransactionsLive,
    systemHealth,
    handleSelectMonth,
    refetch
  } = useFinanceData(user);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Derive effective timeframe (fallback to monthSummary, latest transaction, or current calendar date)
  const effectiveYear =
    selectedYear ??
    monthSummary?.year ??
    (transactions[0]?.date
      ? parseInt(transactions[0].date.split('-')[0], 10)
      : new Date().getFullYear());

  const effectiveMonth =
    selectedMonth ??
    monthSummary?.month ??
    (transactions[0]?.date
      ? parseInt(transactions[0].date.split('-')[1], 10)
      : new Date().getMonth() + 1);

  const currentMonthLabel =
    effectiveMonth && effectiveYear
      ? `${monthNames[effectiveMonth - 1]} ${effectiveYear}`
      : 'Current Month';

  // Transactions for the selected month
  const monthTransactions = React.useMemo(() => {
    if (!effectiveYear || !effectiveMonth) return transactions;
    return transactions.filter((t) => {
      if (!t.date) return false;
      if (typeof t.date === 'string') {
        const parts = t.date.split('-');
        if (parts.length < 2) return false;
        const yr = parseInt(parts[0], 10);
        const mo = parseInt(parts[1], 10);
        return yr === Number(effectiveYear) && mo === Number(effectiveMonth);
      }
      const d = new Date(t.date);
      return !isNaN(d.getTime()) && d.getFullYear() === Number(effectiveYear) && (d.getMonth() + 1) === Number(effectiveMonth);
    });
  }, [transactions, effectiveYear, effectiveMonth]);

  // Category-wise spending for the selected month
  const monthCategories = React.useMemo(() => {
    const expenseTx = monthTransactions.filter(
      (t) => (t.transaction_type || '').toLowerCase() === 'expense'
    );
    if (expenseTx.length === 0) return [];

    const map = {};
    expenseTx.forEach((t) => {
      const cat = t.category || 'Other';
      const amt = Math.abs(Number(t.amount) || 0);
      if (!map[cat]) {
        map[cat] = { category: cat, total_spending: 0, transaction_count: 0 };
      }
      map[cat].total_spending += amt;
      map[cat].transaction_count += 1;
    });

    return Object.values(map).sort((a, b) => b.total_spending - a.total_spending);
  }, [monthTransactions]);

  // Highest spending category for the selected month
  const highestSpendingCategory = React.useMemo(() => {
    return monthCategories.length > 0 ? monthCategories[0] : null;
  }, [monthCategories]);

  // Active month summary (Income, Expenses, Balance, Savings Rate)
  const activeMonthSummary = React.useMemo(() => {
    if (
      monthSummary &&
      Number(monthSummary.year) === Number(effectiveYear) &&
      Number(monthSummary.month) === Number(effectiveMonth) &&
      monthSummary.income !== undefined
    ) {
      return monthSummary;
    }
    const inc = monthTransactions
      .filter((t) => (t.transaction_type || '').toLowerCase() === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const exp = monthTransactions
      .filter((t) => (t.transaction_type || '').toLowerCase() === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
    const bal = inc - exp;
    const rate = inc > 0 ? Math.max(0, ((inc - exp) / inc) * 100) : 0;
    return {
      year: Number(effectiveYear),
      month: Number(effectiveMonth),
      income: inc,
      expenses: exp,
      balance: bal,
      savings_rate: Math.round(rate * 10) / 10,
      transaction_count: monthTransactions.length
    };
  }, [monthSummary, monthTransactions, effectiveYear, effectiveMonth]);

  const topCategory =
    categories && categories.length > 0
      ? [...categories].sort(
          (a, b) => (b.total_spending || 0) - (a.total_spending || 0)
        )[0]
      : null;

  const expenseTxns = transactions.filter(
    (t) => (t.transaction_type || '').toLowerCase() === 'expense'
  );
  const incomeTxns = transactions.filter(
    (t) => (t.transaction_type || '').toLowerCase() === 'income'
  );

  const avgMonthlyExpense =
    monthly && monthly.length > 0
      ? Math.round(
          monthly.reduce((sum, m) => sum + (m.total_expense || 0), 0) /
            monthly.length
        )
      : 0;

  const avgMonthlyIncome =
    monthly && monthly.length > 0
      ? Math.round(
          monthly.reduce((sum, m) => sum + (m.total_income || 0), 0) /
            monthly.length
        )
      : 0;



  useEffect(() => {
    const getAccessToken = () => {
      const knownKeys = [
        'financeiq_access_token',
        'financeiq_token',
        'access_token',
        'token'
      ];

      for (const key of knownKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (parsed?.access_token) return parsed.access_token;
            if (parsed?.token) return parsed.token;
          } catch {
            return value;
          }
        }
      }

      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        const value = key ? localStorage.getItem(key) : null;

        if (!value) continue;

        if (value.startsWith('eyJ') && value.split('.').length === 3) {
          return value;
        }

        try {
          const parsed = JSON.parse(value);
          if (parsed?.access_token) return parsed.access_token;
          if (parsed?.token) return parsed.token;
        } catch {
          // Ignore non-JSON values.
        }
      }

      return null;
    };

    const loadPrediction = async () => {
      try {
        setPredictionLoading(true);
        const token = getAccessToken();

        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
          '/api/analytics/expense-prediction',
          { headers }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.detail || 'Prediction unavailable');
        }

        setExpensePrediction(data);
      } catch (error) {
        console.error('Expense prediction failed:', error);
        setExpensePrediction({
          status: 'error',
          message: 'Prediction is currently unavailable.'
        });
      } finally {
        setPredictionLoading(false);
      }
    };

    const loadUnusualExpenses = async () => {
      try {
        setAnomalyLoading(true);
        const token = getAccessToken();
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(
          '/api/analytics/unusual-expenses',
          { headers }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.detail || 'Unusual expense detection unavailable');
        }

        setUnusualExpenses(data);
      } catch (error) {
        console.error('Unusual expense detection failed:', error);
        setUnusualExpenses({
          status: 'error',
          message: 'Unusual expense detection is currently unavailable.',
          unusual_expenses: []
        });
      } finally {
        setAnomalyLoading(false);
      }
    };

    loadPrediction();
    loadUnusualExpenses();
  }, [user]);

  const handleToggleCurrency = () => {
    setCurrency((prev) => (prev === 'INR' ? 'USD' : 'INR'));
  };

  const handleAddTransaction = async (transaction) => {
    const getAccessToken = () => {
      const knownKeys = [
        'financeiq_access_token',
        'financeiq_token',
        'access_token',
        'token'
      ];

      for (const key of knownKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (parsed?.access_token) return parsed.access_token;
            if (parsed?.token) return parsed.token;
          } catch {
            return value;
          }
        }
      }

      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        const value = key ? localStorage.getItem(key) : null;

        if (!value) continue;

        if (value.startsWith('eyJ') && value.split('.').length === 3) {
          return value;
        }

        try {
          const parsed = JSON.parse(value);
          if (parsed?.access_token) return parsed.access_token;
          if (parsed?.token) return parsed.token;
        } catch {
          // Ignore non-JSON localStorage values.
        }
      }

      return null;
    };

    const token = getAccessToken();

    if (!token) {
      throw new Error('Your login session has expired. Please sign in again.');
    }

    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(transaction)
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      // Backend may return an empty/non-JSON response.
    }

    if (!response.ok) {
      throw new Error(
        data?.detail ||
        data?.message ||
        'Failed to record the transaction.'
      );
    }

    await refetch();
  };

  const handleImportCSV = async (rows) => {
    const getAccessToken = () => {
      const knownKeys = [
        'financeiq_access_token',
        'financeiq_token',
        'access_token',
        'token'
      ];

      for (const key of knownKeys) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (parsed?.access_token) return parsed.access_token;
            if (parsed?.token) return parsed.token;
          } catch {
            return value;
          }
        }
      }

      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        const value = key ? localStorage.getItem(key) : null;

        if (!value) continue;

        if (value.startsWith('eyJ') && value.split('.').length === 3) {
          return value;
        }

        try {
          const parsed = JSON.parse(value);
          if (parsed?.access_token) return parsed.access_token;
          if (parsed?.token) return parsed.token;
        } catch {
          // Ignore non-JSON values.
        }
      }

      return null;
    };

    const token = getAccessToken();

    if (!token) {
      throw new Error('Your login session has expired. Please sign in again.');
    }

    let imported = 0;
    let failed = 0;
    const errors = [];

    // Keep requests in small batches so a large CSV does not overwhelm the API.
    const batchSize = 8;

    for (let start = 0; start < rows.length; start += batchSize) {
      const batch = rows.slice(start, start + batchSize);

      const results = await Promise.all(
        batch.map(async (transaction, batchIndex) => {
          try {
            const response = await fetch('/api/transactions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(transaction)
            });

            let data = null;

            try {
              data = await response.json();
            } catch {
              // Ignore non-JSON responses.
            }

            if (!response.ok) {
              throw new Error(
                data?.detail ||
                data?.message ||
                `HTTP ${response.status}`
              );
            }

            return {
              ok: true,
              row: start + batchIndex + 2
            };
          } catch (error) {
            return {
              ok: false,
              row: start + batchIndex + 2,
              error: error?.message || 'Import failed'
            };
          }
        })
      );

      results.forEach((result) => {
        if (result.ok) {
          imported += 1;
        } else {
          failed += 1;
          if (errors.length < 8) {
            errors.push(`Row ${result.row}: ${result.error}`);
          }
        }
      });
    }

    await refetch();

    return {
      imported,
      failed,
      errors
    };
  };

  return (
    <div className="app-container">
      <div className="app-bg-glow" />

      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() =>
          setIsSidebarCollapsed((prev) => !prev)
        }
      />

      <div className="app-main">
        <Header
          systemHealth={systemHealth}
          onRefresh={refetch}
          isRefreshing={refreshing}
          currency={currency}
          onToggleCurrency={handleToggleCurrency}
          onOpenStatusModal={() => setIsStatusModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="main-content animate-fade-in">
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '0.7rem',
              marginBottom: '1.25rem'
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsImportCSVOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1rem',
                borderRadius: '12px',
                fontWeight: 700
              }}
            >
              <Upload size={18} />
              Import CSV
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsAddTransactionOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1rem',
                borderRadius: '12px',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)'
              }}
            >
              <PlusCircle size={18} />
              Add Transaction
            </button>
          </div>

          {error && (
            <ErrorBanner
              message={error}
              onRetry={refetch}
              isRefreshing={refreshing}
            />
          )}

          {/* OVERVIEW */}
          {currentTab === 'overview' && (
            <>
              <Hero
                summary={activeMonthSummary}
                currency={currency}
                categories={monthCategories.length > 0 ? monthCategories : categories}
                lastUpdated={lastUpdated}
              />

              {/* Interactive Month Selector Bar */}
              <div
                className="glass-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1rem 1.4rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    <Calendar size={19} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Active Timeframe
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#ffffff' }}>
                      {currentMonthLabel} Financial Summary
                    </h3>
                  </div>
                </div>

                <MonthSelector
                  selectedYear={effectiveYear}
                  selectedMonth={effectiveMonth}
                  onSelectMonth={handleSelectMonth}
                  availableMonths={availableMonths}
                />
              </div>

              {/* KPI Cards: This Month's Income, Expenses, Balance, Savings Rate */}
              <KPIGrid
                summary={activeMonthSummary}
                currency={currency}
                loading={loading}
              />

              {/* Highest Spending Category Highlight for Selected Month */}
              {highestSpendingCategory && (
                <div
                  className="glass-card"
                  style={{
                    padding: '1.1rem 1.4rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    borderLeft: '4px solid #f43f5e',
                    background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(244, 63, 94, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fb7185'
                      }}
                    >
                      <TrendingDown size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Highest Spending Category ({currentMonthLabel})
                      </span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {highestSpendingCategory.category}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                      {formatCurrency(highestSpendingCategory.total_spending, currency)}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                      {activeMonthSummary.expenses > 0
                        ? `${((highestSpendingCategory.total_spending / activeMonthSummary.expenses) * 100).toFixed(1)}% of this month's expenses`
                        : `${highestSpendingCategory.transaction_count} transactions`}
                    </div>
                  </div>
                </div>
              )}

              <div
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#818cf8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em'
                      }}
                    >
                      Intelligent Forecast
                    </div>
                    <h2
                      style={{
                        margin: '0.25rem 0 0',
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color: '#ffffff'
                      }}
                    >
                      Next Month Expense Prediction
                    </h2>
                    <p
                      style={{
                        margin: '0.35rem 0 0',
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Estimated from your historical spending patterns
                    </p>
                  </div>

                  <div
                    style={{
                      minWidth: '180px',
                      textAlign: 'right'
                    }}
                  >
                    {predictionLoading ? (
                      <div
                        style={{
                          fontSize: '1rem',
                          color: 'var(--text-muted)'
                        }}
                      >
                        Calculating...
                      </div>
                    ) : expensePrediction?.status === 'success' ? (
                      <>
                        <div
                          style={{
                            fontSize: '2rem',
                            fontWeight: 900,
                            color: '#ffffff'
                          }}
                        >
                          ₹{Number(
                            expensePrediction.predicted_next_month_expense || 0
                          ).toLocaleString('en-IN', {
                            maximumFractionDigits: 0
                          })}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color:
                              Number(
                                expensePrediction.spending_change_percent || 0
                              ) <= 0
                                ? '#4ade80'
                                : '#f87171',
                            fontWeight: 700
                          }}
                        >
                          {Number(
                            expensePrediction.spending_change_percent || 0
                          ) > 0
                            ? '↑'
                            : '↓'}{' '}
                          {Math.abs(
                            Number(
                              expensePrediction.spending_change_percent || 0
                            )
                          ).toFixed(1)}
                          % vs previous month
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          fontSize: '0.9rem',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {expensePrediction?.message ||
                          'Prediction unavailable'}
                      </div>
                    )}
                  </div>
                </div>

                {expensePrediction?.status === 'success' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '0.75rem',
                      paddingTop: '0.9rem',
                      borderTop: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)'
                        }}
                      >
                        Prediction Month
                      </div>
                      <div
                        style={{
                          marginTop: '0.2rem',
                          fontWeight: 700,
                          color: '#ffffff'
                        }}
                      >
                        {expensePrediction.prediction_month}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)'
                        }}
                      >
                        3-Month Average
                      </div>
                      <div
                        style={{
                          marginTop: '0.2rem',
                          fontWeight: 700,
                          color: '#ffffff'
                        }}
                      >
                        ₹{Number(
                          expensePrediction.recent_average_3_months || 0
                        ).toLocaleString('en-IN', {
                          maximumFractionDigits: 0
                        })}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)'
                        }}
                      >
                        Previous Month
                      </div>
                      <div
                        style={{
                          marginTop: '0.2rem',
                          fontWeight: 700,
                          color: '#ffffff'
                        }}
                      >
                        ₹{Number(
                          expensePrediction.previous_month_expense || 0
                        ).toLocaleString('en-IN', {
                          maximumFractionDigits: 0
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(460px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}
              >
                <CashFlowChart
                  monthlyData={monthly}
                  currency={currency}
                  loading={loading}
                />

                <CategoryDonutChart
                  categories={monthCategories}
                  currency={currency}
                  loading={loading}
                  subtitle={`Spending distribution for ${currentMonthLabel}`}
                />
              </div>

              <TransactionTable
                transactions={monthTransactions}
                currency={currency}
                loading={loading}
                isLive={isTransactionsLive}
                searchQuery={searchQuery}
                title={`${currentMonthLabel} Transactions`}
                subtitle={`Transactions recorded for ${currentMonthLabel}`}
              />
            </>
          )}

          {/* TRANSACTIONS */}
          {currentTab === 'transactions' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}
            >
              <div
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#f59e0b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em'
                    }}>
                      Smart Spending Alert
                    </div>
                    <h2 style={{
                      margin: '0.25rem 0 0',
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      color: '#ffffff'
                    }}>
                      Unusual Expenses
                    </h2>
                    <p style={{
                      margin: '0.35rem 0 0',
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)'
                    }}>
                      Transactions that stand out from your normal spending pattern
                    </p>
                  </div>

                  {!anomalyLoading && unusualExpenses?.status === 'success' && (
                    <div style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '999px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: '#fbbf24',
                      fontSize: '0.78rem',
                      fontWeight: 800
                    }}>
                      {unusualExpenses.detected_count || 0} detected
                    </div>
                  )}
                </div>

                {anomalyLoading ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Analyzing your expenses...
                  </div>
                ) : unusualExpenses?.status !== 'success' ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {unusualExpenses?.message || 'Detection unavailable'}
                  </div>
                ) : unusualExpenses.unusual_expenses?.length === 0 ? (
                  <div style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    background: 'rgba(34, 197, 94, 0.08)',
                    color: '#86efac',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}>
                    No unusual expenses detected. Your recent spending looks consistent.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.65rem' }}>
                    {unusualExpenses.unusual_expenses.slice(0, 5).map((item) => (
                      <div
                        key={item.transaction_id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto auto',
                          gap: '1rem',
                          alignItems: 'center',
                          padding: '0.8rem 0.9rem',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '10px'
                        }}
                      >
                        <div>
                          <div style={{
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.9rem'
                          }}>
                            {item.category || 'Expense'}
                          </div>
                          <div style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                            marginTop: '0.2rem'
                          }}>
                            {item.date} · {item.notes || 'Unusual spending detected'}
                          </div>
                        </div>
                        <div style={{
                          color: item.severity === 'high'
                            ? '#f87171'
                            : item.severity === 'medium'
                              ? '#fbbf24'
                              : '#a5b4fc',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textTransform: 'uppercase'
                        }}>
                          {item.severity}
                        </div>
                        <div style={{
                          color: '#ffffff',
                          fontWeight: 800
                        }}>
                          ₹{Number(item.amount || 0).toLocaleString('en-IN', {
                            maximumFractionDigits: 0
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h1
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: 0
                  }}
                >
                  Personal Transactions
                </h1>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.25rem'
                  }}
                >
                  Your personal financial transaction history
                </p>
              </div>

              <TransactionTable
                transactions={transactions}
                currency={currency}
                loading={loading}
                isLive={isTransactionsLive}
                searchQuery={searchQuery}
              />
            </div>
          )}

          {/* EXPENSES */}
          {currentTab === 'expenses' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: 0
                  }}
                >
                  Expense Analytics
                </h1>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.25rem'
                  }}
                >
                  Understand where your money goes and balance your Needs vs Wants
                </p>
              </div>

              {/* Timeframe Selector Bar for Expenses */}
              <div
                className="glass-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.4rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    <Calendar size={19} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Active Timeframe
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#ffffff' }}>
                      {currentMonthLabel} Expense Breakdown
                    </h3>
                  </div>
                </div>

                <MonthSelector
                  selectedYear={effectiveYear}
                  selectedMonth={effectiveMonth}
                  onSelectMonth={handleSelectMonth}
                  availableMonths={availableMonths}
                />
              </div>

              {/* Needs vs Wants Analysis Chart and Actionable Insights */}
              <NeedsVsWantsChart
                transactions={monthTransactions}
                currency={currency}
                loading={loading}
                currentMonthLabel={currentMonthLabel}
                monthlyIncome={activeMonthSummary.income}
                userId={user?.id || user?.user_id}
              />

              <CategoryDonutChart
                categories={monthCategories}
                currency={currency}
                loading={loading}
                title="Spending Breakdown by Category"
                subtitle={`Distribution of expenses for ${currentMonthLabel}`}
              />

              <TransactionTable
                transactions={monthTransactions.filter(
                  (t) =>
                    (t.transaction_type || '').toLowerCase() ===
                    'expense'
                )}
                currency={currency}
                loading={loading}
                isLive={isTransactionsLive}
                searchQuery={searchQuery}
                title={`${currentMonthLabel} Expenses`}
                subtitle={`Expense transactions recorded for ${currentMonthLabel}`}
              />
            </div>
          )}

          {/* INCOME */}
          {currentTab === 'income' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: 0
                  }}
                >
                  Income Analytics
                </h1>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.25rem'
                  }}
                >
                  Track your personal income and earnings
                </p>
              </div>

              <CashFlowChart
                monthlyData={monthly}
                currency={currency}
                loading={loading}
              />

              <TransactionTable
                transactions={transactions.filter(
                  (t) =>
                    (t.transaction_type || '').toLowerCase() ===
                    'income'
                )}
                currency={currency}
                loading={loading}
                isLive={isTransactionsLive}
                searchQuery={searchQuery}
              />
            </div>
          )}

          {/* ANALYTICS */}
          {currentTab === 'analytics' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: 0
                  }}
                >
                  Financial Analytics
                </h1>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.25rem'
                  }}
                >
                  Explore your financial trends and spending patterns
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(460px, 1fr))',
                  gap: '1.5rem'
                }}
              >
                <CashFlowChart
                  monthlyData={monthly}
                  currency={currency}
                  loading={loading}
                />

                <CategoryDonutChart
                  categories={categories}
                  currency={currency}
                  loading={loading}
                />
              </div>
            </div>
          )}

          {/* INSIGHTS */}
          {currentTab === 'insights' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: 0
                  }}
                >
                  Financial Insights
                </h1>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.25rem'
                  }}
                >
                  Personalized insights generated from your financial data
                </p>
              </div>

              <FinancialInsights
                summary={summary}
                categories={categories}
                monthly={monthly}
                loading={loading}
              />
            </div>
          )}

          {/* GOALS */}
          {currentTab === 'goals' && (
            <GoalTracker
              currency={currency}
              onGoalsChanged={refetch}
              monthly={monthly}
              transactions={transactions}
              summary={summary}
            />
          )}

          {/* AI ASSISTANT */}
          {currentTab === 'ai-assistant' && (
            <AIAssistant
              user={user}
              currency={currency}
              summary={summary}
              categories={categories}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {/* SETTINGS */}
          {currentTab === 'settings' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                maxWidth: '800px'
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: 0
                  }}
                >
                  Account Settings
                </h1>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.25rem'
                  }}
                >
                  Manage your FinanceIQ account preferences
                </p>
              </div>

              <div
                className="glass-card"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}
              >
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    margin: 0
                  }}
                >
                  Profile Information
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}
                >
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor:
                        'rgba(255, 255, 255, 0.03)',
                      border:
                        '1px solid var(--border-subtle)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      User ID
                    </div>

                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#818cf8',
                        marginTop: '2px'
                      }}
                    >
                      {user?.user_id}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor:
                        'rgba(255, 255, 255, 0.03)',
                      border:
                        '1px solid var(--border-subtle)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Email
                    </div>

                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        marginTop: '2px'
                      }}
                    >
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderTop:
                      '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#ffffff'
                      }}
                    >
                      Display Currency
                    </div>

                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Currently:{' '}
                      {currency === 'INR'
                        ? 'Indian Rupee (₹ INR)'
                        : 'US Dollar ($ USD)'}
                    </div>
                  </div>

                  <button
                    onClick={handleToggleCurrency}
                    className="btn-secondary"
                  >
                    Switch to{' '}
                    {currency === 'INR' ? 'USD ($)' : 'INR (₹)'}
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0',
                    borderTop:
                      '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#ffffff'
                      }}
                    >
                      System Health
                    </div>

                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Inspect API and PostgreSQL status
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setIsStatusModalOpen(true)
                    }
                    className="btn-primary"
                  >
                    Open Diagnostics
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <SystemStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        systemHealth={systemHealth}
        onRefresh={refetch}
        isRefreshing={refreshing}
      />

      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onAddTransaction={handleAddTransaction}
        currency={currency}
      />

      <ImportCSVModal
        isOpen={isImportCSVOpen}
        onClose={() => setIsImportCSVOpen(false)}
        onImport={handleImportCSV}
      />

      <FloatingAIAssistant
        user={user}
        currency={currency}
        summary={summary}
      />
    </div>
  );
}

function AuthScreen({ initialTab = 'login' }) {
  return <AuthModal initialTab={initialTab} />;
}

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState('login');

  return (
    <AuthProvider>
      <AppGate
        showAuth={showAuth}
        setShowAuth={setShowAuth}
        authTab={authTab}
        setAuthTab={setAuthTab}
      />
    </AuthProvider>
  );
}

function AppGate({
  showAuth,
  setShowAuth,
  authTab,
  setAuthTab
}) {
  const { user, isAuthenticated } = useAuth();
  const [previewUserMode, setPreviewUserMode] = useState(false);

  if (isAuthenticated) {
    if (user?.role === 'admin' && !previewUserMode) {
      return (
        <div style={{ position: 'relative' }}>
          <AdminDashboard
            onPreviewUserDashboard={() => setPreviewUserMode(true)}
          />
          <FloatingAIAssistant user={user} />
        </div>
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        {user?.role === 'admin' && previewUserMode && (
          <div
            onClick={() => setPreviewUserMode(false)}
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '24px',
              zIndex: 9999,
              backgroundColor: '#ef4444',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '999px',
              boxShadow: '0 8px 30px rgba(239, 68, 68, 0.45)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            title="Click to return to Admin Dashboard"
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
            <span>Admin Preview Active • Return to Admin Console →</span>
          </div>
        )}
        <DashboardContent />
      </div>
    );
  }

  if (showAuth) {
    return (
      <div style={{ position: 'relative' }}>
        <AuthScreen initialTab={authTab} />

        <button
          type="button"
          onClick={() => setShowAuth(false)}
          style={{
            position: 'fixed',
            top: '18px',
            left: '18px',
            zIndex: 200,
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(15,23,42,0.8)',
            color: '#ffffff',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)'
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <LandingPage
      onGetStarted={() => {
        setAuthTab('signup');
        setShowAuth(true);
      }}
      onLogin={() => {
        setAuthTab('login');
        setShowAuth(true);
      }}
    />
  );
}