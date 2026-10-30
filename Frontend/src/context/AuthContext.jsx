import React, { createContext, useContext, useState } from 'react';
import {
  loginUser,
  signupUser,
  demoLoginUser,
  adminDemoLoginUser,
  requestForgotPassword
} from '../api/financeApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('financeiq_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('financeiq_token') || null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser(email, password);
      localStorage.setItem('financeiq_token', data.access_token);
      localStorage.setItem('financeiq_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.message || 'Invalid email or password credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (fullName, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await signupUser({
        full_name: fullName,
        email,
        password
      });
      localStorage.setItem('financeiq_token', data.access_token);
      localStorage.setItem('financeiq_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.message || 'Failed to create account.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await demoLoginUser();
      localStorage.setItem('financeiq_token', data.access_token);
      localStorage.setItem('financeiq_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.message || 'Failed to access demo session.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      return await requestForgotPassword(email);
    } catch (err) {
      const msg = err.message || 'Unable to submit password reset.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const adminDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminDemoLoginUser();
      localStorage.setItem('financeiq_token', data.access_token);
      localStorage.setItem('financeiq_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.message || 'Failed to access administrator session.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('financeiq_token');
    localStorage.removeItem('financeiq_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        loading,
        error,
        login,
        signup,
        demoLogin,
        adminDemoLogin,
        forgotPassword,
        logout,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
