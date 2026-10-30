/**
 * Format currency with internationalization
 * Supports both INR (₹) and USD ($)
 */
export function formatCurrency(amount, currency = 'INR', compact = false) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '—';
  }

  const num = Number(amount);

  if (compact && Math.abs(num) >= 1000) {
    if (currency === 'INR') {
      if (Math.abs(num) >= 10000000) {
        return `₹${(num / 10000000).toFixed(2)} Cr`;
      }
      if (Math.abs(num) >= 100000) {
        return `₹${(num / 100000).toFixed(2)} L`;
      }
      return `₹${(num / 1000).toFixed(1)}k`;
    } else {
      if (Math.abs(num) >= 1000000) {
        return `$${(num / 1000000).toFixed(2)}M`;
      }
      return `$${(num / 1000).toFixed(1)}k`;
    }
  }

  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * Format percentage values with clean decimal precision
 */
export function formatPercentage(value, decimals = 1) {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.0%';
  }
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format date strings into human-readable format
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

/**
 * Month names lookup
 */
export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function getMonthName(monthNumber) {
  const index = parseInt(monthNumber, 10) - 1;
  return MONTH_NAMES[index] || `M${monthNumber}`;
}
