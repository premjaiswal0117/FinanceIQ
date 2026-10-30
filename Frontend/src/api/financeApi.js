/**
 * FinanceIQ Personal Finance API Service Layer
 * Automatically attaches session token and scopes requests to user_id.
 */

const API_BASE = '/api';

/**
 * Robust JSON fetcher with authorization token attachment and timeout
 */
async function fetchJSON(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 8000);

  const token = localStorage.getItem('financeiq_token');
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.detail) {
          errorMsg = errorData.detail;
        }
      } catch {
        // Fall back to default status text
      }
      const error = new Error(errorMsg);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ==========================================
// AUTHENTICATION SERVICES
// ==========================================

export async function loginUser(email, password) {
  return await fetchJSON('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function signupUser(payload) {
  return await fetchJSON('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function demoLoginUser() {
  return await fetchJSON('/auth/demo-login', {
    method: 'POST'
  });
}

export async function requestForgotPassword(email) {
  return await fetchJSON('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function fetchCurrentUser() {
  return await fetchJSON('/auth/me');
}

// ==========================================
// TRANSACTIONS MANAGEMENT
// ==========================================

export async function createTransaction(data) {
  return await fetchJSON('/transactions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function importTransactionsBulk(transactions) {
  return await fetchJSON('/transactions/bulk', {
    method: 'POST',
    body: JSON.stringify({ transactions })
  });
}

export async function getRecentTransactions(userId, limit = 50) {
  const data = await fetchJSON(`/transactions/recent?limit=${limit}`);
  return { data, isLive: true };
}

// ==========================================
// USER-SCOPED PERSONAL ANALYTICS SERVICES
// ==========================================

export async function getSummary() {
  return await fetchJSON('/analytics/summary');
}

export async function getMonthSummary(userId, year, month) {
  const params = new URLSearchParams();
  if (year) params.append('year', year);
  if (month) params.append('month', month);

  const qs = params.toString() ? `?${params.toString()}` : '';
  return await fetchJSON(`/analytics/month-summary${qs}`);
}

export async function getAvailableMonths() {
  return await fetchJSON('/analytics/available-months');
}

export async function getCategories() {
  return await fetchJSON('/analytics/categories');
}

export async function getMonthly() {
  return await fetchJSON('/analytics/monthly');
}

export async function getExpensePrediction() {
  return await fetchJSON('/analytics/expense-prediction');
}

export async function getUnusualExpenses() {
  return await fetchJSON('/analytics/unusual-expenses');
}

export async function getSpendingSegmentation() {
  return await fetchJSON('/analytics/spending-segmentation');
}

// ==========================================
// DYNAMIC GOAL TRACKER SERVICES
// ==========================================

export async function getGoals() {
  return await fetchJSON('/goals');
}

export async function createGoal(goalData) {
  return await fetchJSON('/goals', {
    method: 'POST',
    body: JSON.stringify(goalData)
  });
}

export async function updateGoal(goalId, goalData) {
  return await fetchJSON(`/goals/${encodeURIComponent(goalId)}`, {
    method: 'PUT',
    body: JSON.stringify(goalData)
  });
}

export async function deleteGoal(goalId) {
  return await fetchJSON(`/goals/${encodeURIComponent(goalId)}`, {
    method: 'DELETE'
  });
}

// ==========================================
// HEALTH & DIAGNOSTICS SERVICES
// ==========================================

export async function getHealth() {
  return await fetchJSON('/health');
}

export async function getDatabaseTest() {
  return await fetchJSON('/database-test');
}

// ==========================================
// ADMIN SERVICES
// ==========================================

export async function getAdminStats() {
  return await fetchJSON('/admin/system-stats');
}

export async function adminDemoLoginUser() {
  return await fetchJSON('/auth/admin-demo-login', {
    method: 'POST'
  });
}

// ==========================================
// AI PERSONAL FINANCE COPILOT SERVICES
// ==========================================

export async function getAiStatus() {
  return await fetchJSON('/ai/status');
}

export async function sendAiChatMessage(message, options = {}) {
  const payload = { message };
  if (options.month) payload.month = options.month;
  if (options.year) payload.year = options.year;
  return await fetchJSON('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

