import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { StatCard } from './StatCard';
import { StatCardSkeleton } from '../common/Skeleton';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { calculateSavingsRate } from '../../utils/calculations';

export function KPIGrid({ summary, currency, loading }) {
  if (loading || !summary) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  const income = summary.income !== undefined ? summary.income : (summary.total_income || 0);
  const expense = summary.expenses !== undefined ? summary.expenses : (summary.total_expense || 0);

  const balance =
    summary.balance !== undefined
      ? summary.balance
      : (summary.net_balance !== undefined
        ? summary.net_balance
        : income - expense);

  const savingsRate = summary.savings_rate !== undefined
    ? summary.savings_rate
    : calculateSavingsRate(income, expense);

  const isBalancePositive = balance >= 0;
  const isHealthySavings = savingsRate >= 20;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}
    >
      {/* 1. This Month's Income */}
      <StatCard
        title="This Month's Income"
        value={formatCurrency(income, currency)}
        icon={TrendingUp}
        variant="income"
        badgeText="Income"
        trendDirection="up"
        secondaryText="Monthly income received"
      />

      {/* 2. This Month's Expenses */}
      <StatCard
        title="This Month's Expenses"
        value={formatCurrency(expense, currency)}
        icon={TrendingDown}
        variant="expense"
        badgeText="Expenses"
        trendDirection="down"
        secondaryText={`${income > 0 ? ((expense / income) * 100).toFixed(0) : 0}% of income`}
      />

      {/* 3. This Month's Balance */}
      <StatCard
        title="This Month's Balance"
        value={formatCurrency(balance, currency)}
        icon={Wallet}
        variant={isBalancePositive ? 'balance' : 'expense'}
        badgeText={isBalancePositive ? 'Positive' : 'Deficit'}
        trendDirection={isBalancePositive ? 'up' : 'down'}
        secondaryText="Income − expenses"
      />

      {/* 4. This Month's Savings Rate */}
      <StatCard
        title="This Month's Savings Rate"
        value={formatPercentage(savingsRate)}
        icon={PiggyBank}
        variant="savings"
        badgeText={isHealthySavings ? 'Healthy' : 'Low'}
        trendDirection={isHealthySavings ? 'up' : 'neutral'}
        secondaryText="Percentage of income saved"
      />
    </div>
 
);
}