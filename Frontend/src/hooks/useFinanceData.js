import { useState, useEffect, useCallback } from 'react';
import {
  getSummary,
  getMonthSummary,
  getAvailableMonths,
  getCategories,
  getMonthly,
  getHealth,
  getDatabaseTest,
  getRecentTransactions,
  createTransaction
} from '../api/financeApi';

export function useFinanceData(currentUser) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState('INR');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Active Month Filter
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [monthSummary, setMonthSummary] = useState(null);

  // Core Lifetime Data States (scoped to currentUser)
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isTransactionsLive, setIsTransactionsLive] = useState(false);

  // Health and System Connection
  const [systemHealth, setSystemHealth] = useState({
    api: 'checking',
    database: 'checking',
    totalTransactions: 0,
    dbLatencyMs: null
  });

  const userId = currentUser?.user_id || null;

  // 1. Initial Load of Available Months
  useEffect(() => {
    if (!userId) return;

    getAvailableMonths(userId)
      .then((months) => {
        setAvailableMonths(months);
        if (months && months.length > 0) {
          // Default to the first (most recent) month
          setSelectedYear(months[0].year);
          setSelectedMonth(months[0].month);
        } else {
          const now = new Date();
          setSelectedYear(now.getFullYear());
          setSelectedMonth(now.getMonth() + 1);
        }
      })
      .catch((err) => console.warn('Could not load available months:', err));
  }, [userId]);

  // 2. Main Data Fetcher
  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const startTime = performance.now();

    try {
      // 1. Health & Database diagnostics
      const healthPromise = getHealth()
        .then(res => ({ api: res.status === 'healthy' ? 'connected' : 'degraded' }))
        .catch(() => ({ api: 'disconnected' }));

      const dbPromise = getDatabaseTest()
        .then(res => ({
          database: res.database === 'connected' ? 'connected' : 'error',
          totalTransactions: res.transaction_count || 0
        }))
        .catch(() => ({ database: 'disconnected', totalTransactions: 0 }));

      // 2. Analytics queries
      const summaryPromise = getSummary(userId);
      const categoriesPromise = getCategories(userId);
      const monthlyPromise = getMonthly(userId);
      const transactionsPromise = getRecentTransactions(userId, 1000);
      const monthSummaryPromise = getMonthSummary(userId, selectedYear, selectedMonth);

      const [
        healthRes,
        dbRes,
        summaryRes,
        categoriesRes,
        monthlyRes,
        transactionsRes,
        monthSummaryRes
      ] = await Promise.allSettled([
        healthPromise,
        dbPromise,
        summaryPromise,
        categoriesPromise,
        monthlyPromise,
        transactionsPromise,
        monthSummaryPromise
      ]);

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      setSystemHealth({
        api: healthRes.status === 'fulfilled' ? healthRes.value.api : 'disconnected',
        database: dbRes.status === 'fulfilled' ? dbRes.value.database : 'disconnected',
        totalTransactions: dbRes.status === 'fulfilled' ? dbRes.value.totalTransactions : 0,
        dbLatencyMs: latency
      });

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value);
      if (monthlyRes.status === 'fulfilled') setMonthly(monthlyRes.value);
      if (transactionsRes.status === 'fulfilled') {
        setTransactions(transactionsRes.value.data || []);
        setIsTransactionsLive(transactionsRes.value.isLive);
      }
      if (monthSummaryRes.status === 'fulfilled') {
        const ms = monthSummaryRes.value;
        setMonthSummary(ms);
        if (ms?.year && ms?.month) {
          setSelectedYear((prev) => prev ?? ms.year);
          setSelectedMonth((prev) => prev ?? ms.month);
        }
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching personal finance data:', err);
      setError(err.message || 'Unable to load personal finance intelligence');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler to add a personal transaction
  const handleAddTransaction = async (data) => {
    await createTransaction(data);
    // Refresh available months and current data
    const months = await getAvailableMonths(userId);
    setAvailableMonths(months);
    await fetchData(true);
  };

  const handleSelectMonth = (year, month) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  return {
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
    handleAddTransaction,
    refetch: () => fetchData(true)
  };
}
