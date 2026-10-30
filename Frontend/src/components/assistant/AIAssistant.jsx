import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  PieChart,
  HelpCircle,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Info
} from 'lucide-react';
import { getAiStatus, sendAiChatMessage, getSummary } from '../../api/financeApi';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const SUGGESTED_PROMPTS = [
  {
    id: 'spending',
    title: 'Spending Breakdown',
    icon: PieChart,
    color: '#818cf8',
    prompt: 'How much did I spend this month?'
  },
  {
    id: 'needs_wants',
    title: 'Needs vs Wants (50/30)',
    icon: Target,
    color: '#34d399',
    prompt: 'What is my Needs vs Wants breakdown?'
  },
  {
    id: 'anomalies',
    title: 'Unusual Expenses',
    icon: AlertTriangle,
    color: '#f59e0b',
    prompt: 'Do I have any unusual expenses?'
  },
  {
    id: 'prediction',
    title: 'Expense Forecast',
    icon: TrendingUp,
    color: '#22d3ee',
    prompt: 'What is my predicted expense for next month?'
  },
  {
    id: 'goals',
    title: 'Savings Goals',
    icon: Target,
    color: '#a78bfa',
    prompt: 'How are my savings goals progressing?'
  },
  {
    id: 'savings_rate',
    title: 'Savings Advice',
    icon: Lightbulb,
    color: '#fb7185',
    prompt: 'How can I improve my savings rate?'
  }
];

// Helper to render markdown bold, bullets, tips, and headings cleanly
function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentBullets = [];

  const flushBullets = (keyPrefix) => {
    if (currentBullets.length > 0) {
      elements.push(
        <ul
          key={`${keyPrefix}-bullets`}
          style={{
            margin: '0.4rem 0 0.8rem 1.2rem',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}
        >
          {currentBullets.map((b, i) => (
            <li key={i} style={{ color: '#e2e8f0', lineHeight: 1.5, fontSize: '0.92rem' }}>
              {renderInlineStyles(b)}
            </li>
          ))}
        </ul>
      );
      currentBullets = [];
    }
  };

  const renderInlineStyles = (str) => {
    // Splits **bold** and *italic*
    const parts = [];
    let remaining = str;
    let idx = 0;

    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let match;
    let lastIdx = 0;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIdx) {
        parts.push(str.substring(lastIdx, match.index));
      }
      const matchText = match[0];
      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        parts.push(
          <strong key={idx++} style={{ color: '#ffffff', fontWeight: 700 }}>
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
        parts.push(
          <em key={idx++} style={{ color: '#cbd5e1', fontStyle: 'italic' }}>
            {matchText.slice(1, -1)}
          </em>
        );
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < str.length) {
      parts.push(str.substring(lastIdx));
    }

    return parts;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushBullets(`p-${idx}`);
      return;
    }

    // Bullet point
    if (trimmed.startsWith('• ') || trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      currentBullets.push(trimmed.substring(2));
      return;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      flushBullets(`num-${idx}`);
      elements.push(
        <div
          key={`num-${idx}`}
          style={{
            display: 'flex',
            gap: '0.6rem',
            margin: '0.4rem 0',
            fontSize: '0.92rem',
            lineHeight: 1.5,
            color: '#e2e8f0'
          }}
        >
          <span
            style={{
              fontWeight: 800,
              color: '#818cf8',
              flexShrink: 0
            }}
          >
            {numMatch[1]}.
          </span>
          <div>{renderInlineStyles(numMatch[2])}</div>
        </div>
      );
      return;
    }

    flushBullets(`nonbullet-${idx}`);

    // Callout tip box
    if (trimmed.includes('💡')) {
      elements.push(
        <div
          key={`tip-${idx}`}
          style={{
            marginTop: '0.8rem',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'flex-start',
            color: '#fef3c7',
            fontSize: '0.88rem',
            lineHeight: 1.5
          }}
        >
          <div style={{ flex: 1 }}>{renderInlineStyles(trimmed)}</div>
        </div>
      );
      return;
    }

    // Notice info box
    if (trimmed.includes('ℹ️') || trimmed.includes('Data Notice:')) {
      elements.push(
        <div
          key={`notice-${idx}`}
          style={{
            marginTop: '0.8rem',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#c7d2fe',
            fontSize: '0.88rem',
            lineHeight: 1.5
          }}
        >
          {renderInlineStyles(trimmed)}
        </div>
      );
      return;
    }

    // Header line
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      elements.push(
        <h4
          key={`hdr-${idx}`}
          style={{
            margin: '0.8rem 0 0.35rem',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: 800
          }}
        >
          {trimmed.slice(2, -2)}
        </h4>
      );
      return;
    }

    // Regular line
    elements.push(
      <p
        key={`p-${idx}`}
        style={{
          margin: '0.35rem 0',
          lineHeight: 1.6,
          color: '#e2e8f0',
          fontSize: '0.92rem'
        }}
      >
        {renderInlineStyles(trimmed)}
      </p>
    );
  });

  flushBullets('end');
  return <div style={{ wordBreak: 'break-word' }}>{elements}</div>;
}

export function AIAssistant({
  user,
  currency = 'INR',
  summary = null,
  categories = [],
  onNavigate = null
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [liveSummary, setLiveSummary] = useState(summary);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync or fetch live user-isolated financial summary
  useEffect(() => {
    if (summary) {
      setLiveSummary(summary);
    } else {
      getSummary()
        .then((data) => {
          if (data) setLiveSummary(data);
        })
        .catch((err) => {
          console.warn('Could not load live summary for AI Assistant:', err);
        });
    }
  }, [summary]);

  const activeSummary = liveSummary || summary;
  const totalIncome = Number(activeSummary?.total_income || 0);
  const totalExpense = Number(activeSummary?.total_expense || 0);
  const netBalance = activeSummary?.net_balance !== undefined
    ? Number(activeSummary.net_balance)
    : activeSummary?.net_savings !== undefined
      ? Number(activeSummary.net_savings)
      : (totalIncome - totalExpense);
  const savingsRate = activeSummary?.savings_rate !== undefined
    ? Number(activeSummary.savings_rate)
    : (totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0);

  const userName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'there');
  const isLlmConfigured = Boolean(aiStatus?.configured);
  const providerLabel = isLlmConfigured
    ? (aiStatus?.model ? `OpenAI (${aiStatus.model})` : 'OpenAI')
    : 'FinanceIQ Analytics Engine';

  const buildWelcomeText = (name, sum, isLlm, modelName) => {
    const sumIncome = Number(sum?.total_income || 0);
    const sumExpense = Number(sum?.total_expense || 0);
    const sumBalance = sum?.net_balance !== undefined
      ? Number(sum.net_balance)
      : sum?.net_savings !== undefined
        ? Number(sum.net_savings)
        : (sumIncome - sumExpense);
    const sumRate = sum?.savings_rate !== undefined
      ? Number(sum.savings_rate)
      : (sumIncome > 0 ? Math.max(0, ((sumIncome - sumExpense) / sumIncome) * 100) : 0);

    const hasData = sum && (sumIncome > 0 || sumExpense > 0);
    const engineText = isLlm
      ? (modelName ? `OpenAI (${modelName})` : 'OpenAI')
      : 'FinanceIQ Analytics Engine';

    const snapshotText = hasData
      ? `\n\n📊 **Your Active Ground-Truth Financial Snapshot:**\n` +
        `• **Recorded Inflows:** **${formatCurrency(sumIncome, currency)}**\n` +
        `• **Recorded Outflows:** **${formatCurrency(sumExpense, currency)}**\n` +
        `• **Net Balance:** **${formatCurrency(sumBalance, currency)}** (${formatPercentage(sumRate)} savings rate)\n\n`
      : `\n\n📊 **Your Account Status:**\n` +
        `No transactions have been recorded in your account yet. Add transactions using the **Add Transaction** button or import a CSV to unlock instant live insights!\n\n`;

    return (
      `Hello ${name}! 👋 Welcome to your **FinanceIQ Copilot** (Engine: **${engineText}**).\n\n` +
      `I am connected directly to your personal financial records to evaluate **spending**, **Needs vs Wants (50/30 rule)**, **unusual expenses**, **predictions**, and **savings targets**.` +
      snapshotText +
      `Select any suggested prompt below or type your question to begin!`
    );
  };

  // Fetch AI status
  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      try {
        setStatusLoading(true);
        const st = await getAiStatus();
        if (isMounted) {
          setAiStatus(st);
        }
      } catch (err) {
        console.warn('Failed to load AI copilot status:', err);
        if (isMounted) {
          setAiStatus({
            configured: false,
            provider: 'builtin_analytics_engine',
            model: 'FinanceIQ Analytics Engine',
            provider_label: 'FinanceIQ Analytics Engine',
            setup_required: 'Set OPENAI_API_KEY in backend environment to enable OpenAI chat completions.'
          });
        }
      } finally {
        if (isMounted) setStatusLoading(false);
      }
    }

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update initial welcome message whenever authenticated user data or summary loads
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1 && (!prev[0] || prev[0].id.startsWith('welcome'))) {
        return [
          {
            id: 'welcome-1',
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            provider: aiStatus?.provider || 'builtin_analytics_engine',
            configured: Boolean(aiStatus?.configured),
            model: aiStatus?.model,
            text: buildWelcomeText(userName, activeSummary, Boolean(aiStatus?.configured), aiStatus?.model)
          }
        ];
      }
      return prev;
    });
  }, [userName, activeSummary, currency, aiStatus]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (overrideText) => {
    const isChip = typeof overrideText === 'string' && overrideText.trim().length > 0;
    const rawText = isChip ? overrideText : input;
    const query = (rawText || '').trim();

    // Prevent empty or whitespace-only messages
    if (!query || isLoading) return;

    setError(null);
    if (!isChip) {
      setInput('');
    }

    const userMessageId = `user-${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        sender: 'user',
        text: query, // Exact typed message
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await sendAiChatMessage(query);
      const assistantMessageId = `assistant-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          sender: 'assistant',
          text: response.reply,
          provider: response.provider,
          configured: response.configured,
          model: response.model,
          dataPoints: response.data_points,
          setupRequired: response.setup_required,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('AI chat error:', err);
      const errorMsg =
        err.message || 'Failed to reach AI Copilot backend. Ensure the server is reachable.';
      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          text: `⚠️ **Error communicating with Copilot:**\n\n${errorMsg}\n\nPlease try again or verify your connection to the FinanceIQ backend service.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Prevent premature submit while composing IME input (e.g. Hindi/Marathi Devanagari)
      if (e.nativeEvent && e.nativeEvent.isComposing) return;
      e.preventDefault();
      if (input && input.trim() && !isLoading) {
        handleSendMessage();
      }
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: aiStatus?.provider || 'builtin_analytics_engine',
        configured: Boolean(aiStatus?.configured),
        model: aiStatus?.model,
        text: buildWelcomeText(userName, activeSummary, Boolean(aiStatus?.configured), aiStatus?.model)
      }
    ]);
    setError(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
        paddingBottom: '2rem'
      }}
    >
      {/* 1. Header & Engine Indicator */}
      <div
        className="glass-card"
        style={{
          padding: '1.5rem 1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderRadius: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
              flexShrink: 0
            }}
          >
            <Bot size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em'
                }}
              >
                FinanceIQ Copilot
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  backgroundColor: isLlmConfigured
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(99, 102, 241, 0.15)',
                  color: isLlmConfigured ? '#34d399' : '#a5b4fc',
                  border: isLlmConfigured
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isLlmConfigured ? <Sparkles size={11} /> : <Cpu size={11} />}
                {isLlmConfigured ? 'OpenAI' : 'FinanceIQ Analytics Engine'}
              </span>
            </div>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: '0.84rem',
                color: 'var(--text-muted)'
              }}
            >
              Strictly isolated calculations computed directly from your personal financial records
            </p>
          </div>
        </div>

        {/* Engine status pill & Reset Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.035)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.78rem',
              color: '#cbd5e1'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isLlmConfigured ? '#10b981' : '#6366f1',
                boxShadow: isLlmConfigured
                  ? '0 0 10px #10b981'
                  : '0 0 8px #6366f1'
              }}
            />
            <span>
              Engine: <strong style={{ color: '#ffffff' }}>{providerLabel}</strong>
            </span>
          </div>

          <button
            onClick={handleResetChat}
            title="Clear Chat History"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.035)',
              color: '#94a3b8',
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.035)';
            }}
          >
            <RefreshCw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Ground-Truth Financial Metrics Strip */}
      {activeSummary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '0.85rem'
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '0.85rem 1.15rem',
              borderRadius: '14px',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(15, 23, 42, 0.6))'
            }}
          >
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
              Recorded Inflows
            </div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#34d399',
                marginTop: '0.2rem'
              }}
            >
              {formatCurrency(totalIncome, currency)}
            </div>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '0.85rem 1.15rem',
              borderRadius: '14px',
              border: '1px solid rgba(244, 63, 94, 0.15)',
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05), rgba(15, 23, 42, 0.6))'
            }}
          >
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
              Recorded Expenses
            </div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#fb7185',
                marginTop: '0.2rem'
              }}
            >
              {formatCurrency(totalExpense, currency)}
            </div>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '0.85rem 1.15rem',
              borderRadius: '14px',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(15, 23, 42, 0.6))'
            }}
          >
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
              Net Balance
            </div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: netBalance >= 0 ? '#818cf8' : '#fb7185',
                marginTop: '0.2rem'
              }}
            >
              {formatCurrency(netBalance, currency)}
            </div>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '0.85rem 1.15rem',
              borderRadius: '14px',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.05), rgba(15, 23, 42, 0.6))'
            }}
          >
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
              Savings Rate
            </div>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#38bdf8',
                marginTop: '0.2rem'
              }}
            >
              {formatPercentage(savingsRate)}
            </div>
          </div>
        </div>
      )}

      {/* 3. Suggested Prompt Chips */}
      <div>
        <div
          style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            color: '#94a3b8',
            marginBottom: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Sparkles size={13} color="#818cf8" />
          <span>Quick Financial Analysis Queries</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.65rem'
          }}
        >
          {SUGGESTED_PROMPTS.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSendMessage(item.prompt)}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '13px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.075)',
                  color: '#e2e8f0',
                  textAlign: 'left',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.075)';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    backgroundColor: `${item.color}1a`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color,
                    flexShrink: 0
                  }}
                >
                  <IconComponent size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      color: '#94a3b8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    "{item.prompt}"
                  </div>
                </div>
                <ArrowRight size={14} color="#64748b" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Chat Message Window */}
      <div
        className="glass-card"
        style={{
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          height: '560px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.09)'
        }}
      >
        {/* Messages Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: isUser ? '80%' : '88%',
                  flexDirection: isUser ? 'row-reverse' : 'row'
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: isUser
                      ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                      : msg.isError
                        ? 'linear-gradient(135deg, #f43f5e, #be123c)'
                        : 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0,
                    boxShadow: isUser
                      ? '0 4px 12px rgba(99, 102, 241, 0.3)'
                      : '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  {isUser ? (
                    <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  ) : msg.isError ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <Bot size={18} />
                  )}
                </div>

                {/* Message Body */}
                <div
                  style={{
                    background: isUser
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(79, 70, 229, 0.95))'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isUser
                      ? '1px solid rgba(165, 180, 252, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    padding: '1rem 1.25rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                    position: 'relative'
                  }}
                >
                  {/* Sender metadata & Copy action */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.4rem',
                      gap: '1rem'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: isUser ? '#e0e7ff' : '#94a3b8'
                      }}
                    >
                      {isUser ? 'You' : 'FinanceIQ Copilot'}
                      {!isUser && msg.provider && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '0.66rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#cbd5e1'
                          }}
                        >
                          {msg.configured ? (msg.model ? `OpenAI (${msg.model})` : 'OpenAI') : 'FinanceIQ Analytics Engine'}
                        </span>
                      )}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: isUser ? 'rgba(255, 255, 255, 0.65)' : 'var(--text-muted)'
                        }}
                      >
                        {msg.timestamp}
                      </span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          title="Copy reply text"
                          style={{
                            background: 'transparent',
                            border: 0,
                            padding: '2px',
                            color: copiedId === msg.id ? '#34d399' : '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content: Render exact typed message verbatim for user; formatted for assistant */}
                  {isUser ? (
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: '#ffffff',
                        fontSize: '0.92rem',
                        lineHeight: 1.5
                      }}
                    >
                      {msg.text}
                    </div>
                  ) : (
                    <FormattedMessage text={msg.text} />
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading typing bubble */}
          {isLoading && (
            <div
              style={{
                display: 'flex',
                gap: '0.85rem',
                alignSelf: 'flex-start',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}
              >
                <Bot size={18} />
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px 18px 18px 18px',
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: '#cbd5e1',
                  fontSize: '0.86rem'
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#818cf8',
                    animation: 'authPulse 1.2s infinite ease-in-out'
                  }}
                />
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#a78bfa',
                    animation: 'authPulse 1.2s infinite ease-in-out 0.2s'
                  }}
                />
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#22d3ee',
                    animation: 'authPulse 1.2s infinite ease-in-out 0.4s'
                  }}
                />
                <span style={{ marginLeft: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Analyzing your transactions...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(10, 16, 29, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.075)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(255, 255, 255, 0.035)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '0.35rem 0.5rem 0.35rem 1rem'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about spending, Needs vs Wants, unexpected spikes, or savings goals..."
              disabled={isLoading}
              style={{
                flex: 1,
                border: 0,
                outline: 'none',
                background: 'transparent',
                color: '#f8fafc',
                fontSize: '0.92rem',
                fontFamily: 'inherit',
                padding: '0.5rem 0'
              }}
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!input || !input.trim() || isLoading}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                padding: '0.6rem 1.1rem',
                borderRadius: '10px',
                border: 0,
                cursor: !input || !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                opacity: !input || !input.trim() || isLoading ? 0.45 : 1,
                transition: 'all 0.2s ease',
                fontSize: '0.86rem',
                fontWeight: 700
              }}
            >
              <span>Send</span>
              <Send size={14} />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
              padding: '0 0.25rem',
              fontSize: '0.72rem',
              color: 'var(--text-muted)'
            }}
          >
            <span>
              Press <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)' }}>Enter</kbd> to send
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={11} color="#10b981" />
              <span>User-isolated ground truth calculation</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
