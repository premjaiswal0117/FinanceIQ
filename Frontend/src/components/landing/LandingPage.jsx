import React from 'react';
import {
    ArrowRight,
    BarChart3,
    BrainCircuit,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Wallet,
    Database,
    Zap
} from 'lucide-react';

export function LandingPage({ onGetStarted, onLogin }) {
    return (
        <div className="financeiq-landing">
            {/* Background */}
            <div className="landing-orb landing-orb-one" />
            <div className="landing-orb landing-orb-two" />
            <div className="landing-grid" />

            {/* Navigation */}
            <nav className="landing-nav">
                <div className="landing-brand">
                    <div className="landing-brand-icon">
                        <Sparkles size={21} />
                    </div>

                    <div>
                        <div className="landing-brand-name">
                            Finance<span>IQ</span>
                        </div>
                        <div className="landing-brand-subtitle">
                            PERSONAL FINANCE
                        </div>
                    </div>
                </div>

                <div className="landing-nav-actions">
                    <button
                        type="button"
                        className="landing-login-btn"
                        onClick={onLogin}
                    >
                        Log In
                    </button>

                    <button
                        type="button"
                        className="landing-nav-cta"
                        onClick={onGetStarted}
                    >
                        Get Started
                        <ArrowRight size={16} />
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <section className="landing-hero">
                <div className="landing-hero-content">
                    <div className="landing-eyebrow">
                        <span className="landing-live-dot" />
                        PERSONAL FINANCE • INTELLIGENT ANALYTICS
                    </div>

                    <h1>
                        Your money.
                        <br />
                        <span>Understood.</span>
                    </h1>

                    <p className="landing-hero-description">
                        FinanceIQ transforms your everyday financial transactions
                        into clear analytics, meaningful insights, and smarter
                        money-management decisions.
                    </p>

                    <div className="landing-hero-actions">
                        <button
                            type="button"
                            className="landing-primary-btn"
                            onClick={onGetStarted}
                        >
                            Start Managing Your Money
                            <ArrowRight size={18} />
                        </button>

                        <button
                            type="button"
                            className="landing-secondary-btn"
                            onClick={onLogin}
                        >
                            Explore FinanceIQ
                        </button>
                    </div>

                    <div className="landing-trust-row">
                        <div>
                            <ShieldCheck size={16} />
                            Secure personal accounts
                        </div>

                        <div>
                            <Zap size={16} />
                            Real-time analytics
                        </div>

                        <div>
                            <BrainCircuit size={16} />
                            Intelligent insights
                        </div>
                    </div>
                </div>

                {/* Hero Financial Visualization */}
                <div className="landing-visual">
                    <div className="visual-glow" />

                    <div className="floating-card floating-card-top">
                        <div className="mini-icon income">
                            <TrendingUp size={16} />
                        </div>
                        <div>
                            <span>Monthly Income</span>
                            <strong>₹48,500</strong>
                        </div>
                        <small>+12.8%</small>
                    </div>

                    <div className="dashboard-preview">
                        <div className="preview-header">
                            <div>
                                <span>Financial Overview</span>
                                <strong>Personal Dashboard</strong>
                            </div>

                            <div className="preview-avatar">
                                P
                            </div>
                        </div>

                        <div className="preview-balance">
                            <span>Available Balance</span>
                            <strong>₹32,840</strong>

                            <div className="preview-positive">
                                <TrendingUp size={13} />
                                Healthy financial position
                            </div>
                        </div>

                        <div className="preview-chart">
                            <div className="chart-labels">
                                <span>Cash Flow</span>
                                <span>Last 6 months</span>
                            </div>

                            <div className="chart-bars">
                                <div style={{ height: '35%' }} />
                                <div style={{ height: '52%' }} />
                                <div style={{ height: '42%' }} />
                                <div style={{ height: '68%' }} />
                                <div style={{ height: '58%' }} />
                                <div style={{ height: '86%' }} />
                                <div style={{ height: '74%' }} />
                            </div>
                        </div>

                        <div className="preview-stats">
                            <div>
                                <span>Income</span>
                                <strong>₹48.5K</strong>
                            </div>

                            <div>
                                <span>Expenses</span>
                                <strong>₹15.6K</strong>
                            </div>

                            <div>
                                <span>Savings</span>
                                <strong>67.8%</strong>
                            </div>
                        </div>
                    </div>

                    <div className="floating-card floating-card-bottom">
                        <div className="mini-icon analytics">
                            <BarChart3 size={16} />
                        </div>
                        <div>
                            <span>Spending Analysis</span>
                            <strong>32% optimized</strong>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature intro */}
            <section className="landing-section">
                <div className="section-heading">
                    <div className="landing-eyebrow">
                        <Sparkles size={14} />
                        ONE PLATFORM
                    </div>

                    <h2>
                        Everything you need to
                        <span> understand your finances.</span>
                    </h2>

                    <p>
                        Stop guessing where your money goes. FinanceIQ brings your
                        financial activity together and turns it into information
                        you can actually use.
                    </p>
                </div>

                <div className="feature-grid">
                    <FeatureCard
                        icon={Wallet}
                        title="Track Your Money"
                        description="Keep your income, expenses, balance and transactions organized in one personal financial workspace."
                    />

                    <FeatureCard
                        icon={BarChart3}
                        title="Understand Your Spending"
                        description="Explore categories, monthly cash flow and spending patterns through interactive analytics."
                    />

                    <FeatureCard
                        icon={BrainCircuit}
                        title="Discover Financial Insights"
                        description="Turn transaction data into meaningful financial insights that help you understand your habits."
                    />

                    <FeatureCard
                        icon={TrendingUp}
                        title="Make Smarter Decisions"
                        description="Use your financial history to identify trends, improve savings and manage your money better."
                    />
                </div>
            </section>

            {/* Data Engineering section */}
            <section className="landing-engine-section">
                <div className="engine-copy">
                    <div className="landing-eyebrow">
                        <Database size={14} />
                        ENGINEERED FOR RELIABLE ANALYTICS
                    </div>

                    <h2>
                        Your financial data,
                        <br />
                        <span>processed intelligently.</span>
                    </h2>

                    <p>
                        Behind the beautiful dashboard is an end-to-end data
                        engineering pipeline designed to transform raw financial
                        records into reliable analytical information.
                    </p>

                    <div className="engine-pills">
                        <span>Data Quality</span>
                        <span>PySpark</span>
                        <span>PostgreSQL</span>
                        <span>Airflow</span>
                        <span>Analytics</span>
                        <span>Machine Learning</span>
                    </div>
                </div>

                <div className="pipeline-visual">
                    <PipelineStep number="01" title="Your Transactions" />
                    <div className="pipeline-line" />
                    <PipelineStep number="02" title="Data Quality" />
                    <div className="pipeline-line" />
                    <PipelineStep number="03" title="PySpark Processing" />
                    <div className="pipeline-line" />
                    <PipelineStep number="04" title="Financial Insights" />
                </div>
            </section>

            {/* Final CTA */}
            <section className="landing-final-cta">
                <div className="final-cta-glow" />

                <div className="landing-eyebrow">
                    <Sparkles size={14} />
                    START YOUR FINANCIAL JOURNEY
                </div>

                <h2>
                    Your money deserves
                    <br />
                    <span>more than a spreadsheet.</span>
                </h2>

                <p>
                    Create your personal FinanceIQ account and start understanding
                    your finances today.
                </p>

                <button
                    type="button"
                    className="landing-primary-btn"
                    onClick={onGetStarted}
                >
                    Create Your Free Account
                    <ArrowRight size={18} />
                </button>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-brand">
                    <div className="landing-brand-icon small">
                        <Sparkles size={17} />
                    </div>

                    <div className="landing-brand-name">
                        Finance<span>IQ</span>
                    </div>
                </div>

                <span>
                    Personal Finance Analytics & Intelligent Money Management
                </span>

                <span>© 2026 FinanceIQ</span>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description }) {
    return (
        <div className="landing-feature-card">
            <div className="feature-icon">
                <Icon size={21} />
            </div>

            <h3>{title}</h3>

            <p>{description}</p>

            <div className="feature-arrow">
                <ArrowRight size={15} />
            </div>
        </div>
    );
}

function PipelineStep({ number, title }) {
    return (
        <div className="pipeline-step">
            <span>{number}</span>

            <div>
                <small>FINANCEIQ</small>
                <strong>{title}</strong>
            </div>
        </div>
    );
}