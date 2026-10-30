import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Wallet,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AuthModal({ initialTab = 'login' }) {
  const {
    login,
    signup,
    demoLogin,
    adminDemoLogin,
    forgotPassword,
    loading,
    error,
    clearError
  } = useAuth();

  const [tab, setTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  const handleTabChange = (newTab) => {
    setTab(newTab);
    clearError();

    setFormData({
      name: '',
      email: '',
      password: ''
    });

    setShowPassword(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (tab === 'login') {
      await login(formData.email, formData.password);
      return;
    }

    await signup(
      formData.name,
      formData.email,
      formData.password
    );
  };

  const handleDemoLogin = async () => {
    clearError();
    await demoLogin();
  };

  const handleAdminDemoLogin = async () => {
    clearError();
    await adminDemoLogin();
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    setForgotMessage('');

    const result = await forgotPassword(forgotEmail);

    if (result !== false) {
      setForgotMessage(
        'If an account exists with this email, password reset instructions have been sent.'
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background-grid" />
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <div className="auth-floating-orb auth-orb-one" />
      <div className="auth-floating-orb auth-orb-two" />

      <div className="auth-container">

        {/* LEFT SIDE */}
        <div className="auth-showcase">

          <div className="auth-brand">
            <div className="auth-brand-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <div className="auth-brand-name">
                Finance<span>IQ</span>
              </div>

              <div className="auth-brand-subtitle">
                PERSONAL FINANCE
              </div>
            </div>
          </div>

          <div className="auth-showcase-content">

            <div className="auth-eyebrow">
              <span className="auth-live-dot" />
              PERSONAL FINANCE • INTELLIGENT ANALYTICS
            </div>

            <h1>
              Understand your money.
              <br />
              <span>Improve your future.</span>
            </h1>

            <p>
              FinanceIQ turns your everyday financial activity into
              clear analytics, useful insights, and smarter money
              management decisions.
            </p>

            <div className="auth-benefits">

              <div className="auth-benefit">
                <div className="auth-benefit-icon">
                  <Wallet size={18} />
                </div>

                <div>
                  <strong>Track Your Money</strong>
                  <span>
                    Keep income, expenses and transactions organized.
                  </span>
                </div>
              </div>

              <div className="auth-benefit">
                <div className="auth-benefit-icon">
                  <BarChart3 size={18} />
                </div>

                <div>
                  <strong>Understand Your Spending</strong>
                  <span>
                    Discover patterns through interactive analytics.
                  </span>
                </div>
              </div>

              <div className="auth-benefit">
                <div className="auth-benefit-icon">
                  <BrainCircuit size={18} />
                </div>

                <div>
                  <strong>Get Intelligent Insights</strong>
                  <span>
                    Turn financial data into meaningful information.
                  </span>
                </div>
              </div>

            </div>

            <div className="auth-security">
              <ShieldCheck size={16} />
              <span>Your personal financial workspace</span>
            </div>

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="auth-card-wrapper">

          <div className="auth-card">

            <div className="auth-card-header">
              <div>
                <h2>
                  {tab === 'login'
                    ? 'Welcome back'
                    : 'Create your account'}
                </h2>

                <p>
                  {tab === 'login'
                    ? 'Sign in to access your personal finance dashboard.'
                    : 'Start understanding your finances with FinanceIQ.'}
                </p>
              </div>
            </div>

            {/* TABS */}
            <div className="auth-tabs">

              <button
                type="button"
                className={tab === 'login' ? 'active' : ''}
                onClick={() => handleTabChange('login')}
              >
                Sign In
              </button>

              <button
                type="button"
                className={tab === 'signup' ? 'active' : ''}
                onClick={() => handleTabChange('signup')}
              >
                Create Account
              </button>

            </div>

            {/* ERROR */}
            {error && (
              <div className="auth-error">
                <div>
                  <X size={16} />
                </div>

                <span>{error}</span>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="auth-form">

              {tab === 'signup' && (
                <div className="auth-field">

                  <label htmlFor="name">
                    Full Name
                  </label>

                  <div className="auth-input-wrapper">
                    <User size={18} />

                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                    />
                  </div>

                </div>
              )}

              <div className="auth-field">

                <label htmlFor="email">
                  Email Address
                </label>

                <div className="auth-input-wrapper">
                  <Mail size={18} />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>

              </div>

              <div className="auth-field">

                <div className="auth-label-row">
                  <label htmlFor="password">
                    Password
                  </label>

                  {tab === 'login' && (
                    <button
                      type="button"
                      className="auth-forgot-link"
                      onClick={() => {
                        setForgotEmail(formData.email);
                        setForgotMessage('');
                        clearError();
                        setShowForgotPassword(true);
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="auth-input-wrapper">

                  <Lock size={18} />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete={
                      tab === 'login'
                        ? 'current-password'
                        : 'new-password'
                    }
                    required
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </div>

              {tab === 'signup' && (
                <div className="auth-password-note">
                  <CheckCircle2 size={14} />
                  Use a strong password to protect your account.
                </div>
              )}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="auth-spinner"
                    />
                    Please wait...
                  </>
                ) : (
                  <>
                    {tab === 'login'
                      ? 'Sign In to FinanceIQ'
                      : 'Create FinanceIQ Account'}

                    <ArrowRight size={18} />
                  </>
                )}
              </button>

            </form>

            {/* DEMO */}
            <div className="auth-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="auth-demo-btn"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              <Sparkles size={17} />

              <div>
                <strong>Explore Live Demo (User)</strong>
                <span>
                  See FinanceIQ with sample individual account
                </span>
              </div>

              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="auth-demo-btn"
              onClick={handleAdminDemoLogin}
              disabled={loading}
              style={{
                marginTop: '0.6rem',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(15, 23, 42, 0.7))'
              }}
            >
              <ShieldAlert size={17} color="#f87171" />

              <div>
                <strong style={{ color: '#fca5a5' }}>System Administrator Demo</strong>
                <span>
                  Admin dashboard, Airflow ETL & system metrics
                </span>
              </div>

              <ArrowRight size={16} color="#f87171" />
            </button>

            <div className="auth-footer-note" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={14} />
                <span>Normal users see only their own data. Admin credentials: admin@financeiq.com</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* FORGOT PASSWORD */}
      {showForgotPassword && (
        <div className="auth-modal-overlay">

          <div className="auth-forgot-modal">

            <button
              type="button"
              className="auth-modal-close"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotMessage('');
                clearError();
              }}
            >
              <X size={19} />
            </button>

            <div className="auth-forgot-icon">
              <Lock size={22} />
            </div>

            <h3>Reset your password</h3>

            <p>
              Enter your email address and we'll help you
              reset your FinanceIQ password.
            </p>

            {forgotMessage && (
              <div className="auth-success">
                <CheckCircle2 size={16} />
                <span>{forgotMessage}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword}>

              <div className="auth-field">

                <label htmlFor="forgot-email">
                  Email Address
                </label>

                <div className="auth-input-wrapper">
                  <Mail size={18} />

                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(event) =>
                      setForgotEmail(event.target.value)
                    }
                    required
                  />
                </div>

              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="auth-spinner"
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Instructions
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

            </form>

            <button
              type="button"
              className="auth-back-link"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotMessage('');
                clearError();
              }}
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </button>

          </div>

        </div>
      )}

    </div>
  );
}