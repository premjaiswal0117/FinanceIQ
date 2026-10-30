import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Minus,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Cpu,
  CornerDownLeft,
  ChevronDown
} from 'lucide-react';
import { getAiStatus, sendAiChatMessage, getSummary } from '../../api/financeApi';
import { formatCurrency } from '../../utils/formatters';

const SUGGESTED_CHIPS = [
  { id: 'spending', label: '📊 Spending Breakdown', prompt: 'How much did I spend this month?' },
  { id: 'needs_wants', label: '🎯 Needs vs Wants (50/30)', prompt: 'What is my Needs vs Wants breakdown?' },
  { id: 'anomalies', label: '⚠️ Unusual Expenses', prompt: 'Do I have any unusual expenses?' },
  { id: 'forecast', label: '📈 Next Month Forecast', prompt: 'What is my predicted expense for next month?' },
  { id: 'goals', label: '🏆 Savings Goals', prompt: 'How are my savings goals progressing?' },
  { id: 'advice', label: '💡 Savings Tips', prompt: 'How can I improve my savings rate?' }
];

// Helper to format assistant markdown responses neatly inside compact chat bubbles
function FormattedBubbleText({ text }) {
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
            margin: '0.35rem 0 0.5rem 1.1rem',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          {currentBullets.map((bullet, idx) => (
            <li key={idx} style={{ color: '#e2e8f0', lineHeight: 1.45, fontSize: '0.84rem' }}>
              {renderInlineStyles(bullet)}
            </li>
          ))}
        </ul>
      );
      currentBullets = [];
    }
  };

  const renderInlineStyles = (str) => {
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

    // Bullet item
    if (trimmed.startsWith('• ') || trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      currentBullets.push(trimmed.substring(2));
      return;
    }

    // Numbered item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      flushBullets(`num-${idx}`);
      elements.push(
        <div
          key={`num-${idx}`}
          style={{
            display: 'flex',
            gap: '0.45rem',
            margin: '0.3rem 0',
            fontSize: '0.84rem',
            lineHeight: 1.45,
            color: '#e2e8f0'
          }}
        >
          <span style={{ fontWeight: 800, color: '#818cf8', flexShrink: 0 }}>
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
            marginTop: '0.5rem',
            marginBottom: '0.3rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: '#fef3c7',
            fontSize: '0.82rem',
            lineHeight: 1.45
          }}
        >
          {renderInlineStyles(trimmed)}
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
            marginTop: '0.5rem',
            marginBottom: '0.3rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#c7d2fe',
            fontSize: '0.82rem',
            lineHeight: 1.45
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
        <div
          key={`hdr-${idx}`}
          style={{
            margin: '0.6rem 0 0.25rem',
            color: '#ffffff',
            fontSize: '0.88rem',
            fontWeight: 800,
            letterSpacing: '-0.01em'
          }}
        >
          {trimmed.slice(2, -2)}
        </div>
      );
      return;
    }

    // Regular line
    elements.push(
      <p
        key={`p-${idx}`}
        style={{
          margin: '0.25rem 0',
          lineHeight: 1.5,
          color: '#e2e8f0',
          fontSize: '0.84rem'
        }}
      >
        {renderInlineStyles(trimmed)}
      </p>
    );
  });

  flushBullets('end');
  return <div style={{ wordBreak: 'break-word' }}>{elements}</div>;
}

export function FloatingAIAssistant({
  user,
  currency = 'INR',
  summary = null
}) {
  const [isOpen, setIsOpen] = useState(false);
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
          console.warn('Floating AI Assistant: Could not load live summary:', err);
        });
    }
  }, [summary]);

  // Load AI status from backend
  useEffect(() => {
    let isMounted = true;
    async function loadStatus() {
      try {
        setStatusLoading(true);
        const st = await getAiStatus();
        if (isMounted) setAiStatus(st);
      } catch (err) {
        console.warn('Floating AI Assistant: Status load failed:', err);
        if (isMounted) {
          setAiStatus({
            configured: false,
            provider: 'builtin_analytics_engine',
            model: 'FinanceIQ Analytics Engine',
            provider_label: 'FinanceIQ Analytics Engine'
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

  const activeSummary = liveSummary || summary;
  const userName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'there');
  const isLlmConfigured = Boolean(aiStatus?.configured);
  const providerLabel = isLlmConfigured
    ? (aiStatus?.model ? `OpenAI (${aiStatus.model})` : 'OpenAI')
    : 'FinanceIQ Analytics Engine';

  // Build welcome text
  const buildInitialWelcome = () => {
    const sumIncome = Number(activeSummary?.total_income || 0);
    const sumExpense = Number(activeSummary?.total_expense || 0);
    const hasData = activeSummary && (sumIncome > 0 || sumExpense > 0);

    let snapshot = '';
    if (hasData) {
      snapshot =
        `\n\n📊 **Your Active Financial Snapshot:**\n` +
        `• **Recorded Inflows:** **${formatCurrency(sumIncome, currency)}**\n` +
        `• **Recorded Outflows:** **${formatCurrency(sumExpense, currency)}**\n`;
    }

    return (
      `Hello ${userName}! 👋 I am your **FinanceIQ AI Assistant**.\n\n` +
      `Ask me anything about your spending, budget, 50/30 rule, unusual expenses, or forecasts in **English**, **Hinglish**, **Hindi**, or **Marathi**.` +
      snapshot +
      `\nSelect a prompt below or type your question!`
    );
  };

  // Seed welcome message when first opened or when user data is ready
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: 'welcome-0',
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: buildInitialWelcome()
          }
        ];
      }
      return prev;
    });
  }, [userName, activeSummary, currency]);

  // Scroll to latest message
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom('smooth');
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom('auto');
      }, 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (overrideText) => {
    const isChip = typeof overrideText === 'string' && overrideText.trim().length > 0;
    const rawText = isChip ? overrideText : input;
    const query = (rawText || '').trim();

    if (!query || isLoading) return;

    setError(null);
    if (!isChip) {
      setInput('');
    }

    const userMsgId = `user-${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await sendAiChatMessage(query);
      const assistantMsgId = `assistant-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          sender: 'assistant',
          text: response.reply,
          provider: response.provider,
          configured: response.configured,
          model: response.model,
          dataPoints: response.data_points,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Floating AI Assistant error:', err);
      const errorMsg =
        err.message || 'Failed to reach AI Copilot backend. Ensure the server is reachable.';
      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          text: `⚠️ **Error communicating with AI Assistant:**\n\n${errorMsg}\n\nPlease try again or check your backend connection.`,
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
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleResetChat = (e) => {
    e.stopPropagation();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: buildInitialWelcome()
      }
    ]);
    setError(null);
  };

  return (
    <>
      {/* 1. EXPANDABLE CHAT PANEL */}
      <div
        id="financeiq-floating-chat-window"
        className={`floating-chat-window ${isOpen ? 'open' : 'closed'}`}
        role="dialog"
        aria-modal="true"
        aria-label="FinanceIQ AI Assistant Chat Panel"
        style={{
          display: isOpen ? 'flex' : 'none',
          position: 'fixed',
          bottom: '88px',
          right: '24px',
          width: '370px',
          height: '510px',
          maxHeight: 'calc(100vh - 110px)',
          flexDirection: 'column',
          zIndex: 9998,
          background: 'linear-gradient(165deg, rgba(17, 24, 39, 0.96), rgba(8, 13, 24, 0.98))',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.2)',
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: 'floatingPanelIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.06))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                flexShrink: 0
              }}
            >
              <Bot size={19} color="#ffffff" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  FinanceIQ AI Assistant
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1px' }}>
                <span
                  style={{
                    width: '6.5px',
                    height: '6.5px',
                    borderRadius: '50%',
                    backgroundColor: isLlmConfigured ? '#10b981' : '#818cf8',
                    boxShadow: isLlmConfigured ? '0 0 6px #10b981' : '0 0 6px #818cf8',
                    flexShrink: 0
                  }}
                />
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#94a3b8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={providerLabel}
                >
                  {isLlmConfigured ? 'OpenAI Live' : 'Analytics Engine'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Reset, Minimize, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
            <button
              onClick={handleResetChat}
              title="Clear conversation"
              aria-label="Clear conversation"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <RefreshCw size={13} />
            </button>

            <button
              onClick={() => setIsOpen(false)}
              title="Minimize panel"
              aria-label="Minimize panel"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <Minus size={14} />
            </button>

            <button
              onClick={() => setIsOpen(false)}
              title="Close panel"
              aria-label="Close panel"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fb7185';
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Conversation Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.85rem 0.9rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(148, 163, 184, 0.25) transparent'
          }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isErr = Boolean(msg.isError);

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '100%'
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    maxWidth: '88%',
                    padding: isUser ? '0.65rem 0.9rem' : '0.75rem 0.95rem',
                    borderRadius: isUser
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    background: isUser
                      ? 'linear-gradient(135deg, #6366f1, #7c3aed)'
                      : isErr
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(30, 41, 59, 0.85)',
                    border: isUser
                      ? '1px solid rgba(255, 255, 255, 0.18)'
                      : isErr
                        ? '1px solid rgba(239, 68, 68, 0.35)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isUser
                      ? '0 4px 14px rgba(99, 102, 241, 0.3)'
                      : '0 4px 14px rgba(0, 0, 0, 0.25)',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    lineHeight: 1.45,
                    wordBreak: 'break-word'
                  }}
                >
                  {isUser ? (
                    <div style={{ color: '#ffffff', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  ) : (
                    <FormattedBubbleText text={msg.text} />
                  )}

                  {/* Copy button for assistant responses */}
                  {!isUser && !isErr && msg.text && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        marginTop: '0.4rem',
                        gap: '0.4rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        paddingTop: '0.35rem'
                      }}
                    >
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy response"
                        aria-label="Copy response"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: copiedId === msg.id ? '#34d399' : '#94a3b8',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.68rem',
                          padding: '2px 5px',
                          borderRadius: '4px'
                        }}
                      >
                        {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {msg.timestamp && (
                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                          {msg.timestamp}
                        </span>
                      )}
                    </div>
                  )}

                  {isUser && msg.timestamp && (
                    <div
                      style={{
                        textAlign: 'right',
                        fontSize: '0.65rem',
                        color: 'rgba(255, 255, 255, 0.65)',
                        marginTop: '0.2rem'
                      }}
                    >
                      {msg.timestamp}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking / Loading indicator */}
          {isLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                alignSelf: 'flex-start',
                padding: '0.65rem 0.9rem',
                borderRadius: '16px 16px 16px 4px',
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className="typing-dot" style={{ animationDelay: '0s' }} />
                <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 600 }}>
                AI is analyzing your finances...
              </span>
            </div>
          )}

          {/* Quick prompt suggestions when conversation is brief */}
          {messages.length <= 2 && !isLoading && (
            <div style={{ marginTop: '0.4rem', marginBottom: '0.2rem' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  marginBottom: '0.45rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Suggested questions:
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem'
                }}
              >
                {SUGGESTED_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => handleSendMessage(chip.prompt)}
                    style={{
                      background: 'rgba(99, 102, 241, 0.09)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      borderRadius: '999px',
                      padding: '4px 9px',
                      color: '#cbd5e1',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.22)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.09)';
                      e.currentTarget.style.color = '#cbd5e1';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)';
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} style={{ height: '1px' }} />
        </div>

        {/* Input Footer Area */}
        <div
          style={{
            padding: '0.7rem 0.85rem 0.75rem',
            background: 'rgba(10, 16, 29, 0.92)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '0.35rem 0.5rem 0.35rem 0.75rem',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask in English, Hinglish, Hindi, Marathi..."
              disabled={isLoading}
              aria-label="Message input for FinanceIQ AI Assistant"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontFamily: 'inherit'
              }}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              title="Send message (Enter)"
              aria-label="Send message"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(255, 255, 255, 0.06)',
                color: input.trim() && !isLoading ? '#ffffff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              <Send size={15} />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.4rem',
              padding: '0 0.25rem',
              fontSize: '0.67rem',
              color: '#64748b'
            }}
          >
            <span>🔒 Ground-truth user isolated data</span>
            <span>Press Enter ↵ to send</span>
          </div>
        </div>
      </div>

      {/* 2. CIRCULAR FLOATING AI ASSISTANT BUTTON */}
      <button
        id="financeiq-floating-chat-btn"
        className="floating-ai-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close FinanceIQ AI Assistant' : 'Open FinanceIQ AI Assistant'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={isOpen ? 'Close AI Assistant' : 'FinanceIQ AI Assistant (Ask anything)'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: isOpen
            ? '0 8px 30px rgba(99, 102, 241, 0.6), 0 0 20px rgba(139, 92, 246, 0.4)'
            : '0 8px 24px rgba(99, 102, 241, 0.45), 0 0 15px rgba(99, 102, 241, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9998,
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
          e.currentTarget.style.boxShadow =
            '0 12px 32px rgba(99, 102, 241, 0.65), 0 0 25px rgba(6, 182, 212, 0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.boxShadow = isOpen
            ? '0 8px 30px rgba(99, 102, 241, 0.6), 0 0 20px rgba(139, 92, 246, 0.4)'
            : '0 8px 24px rgba(99, 102, 241, 0.45), 0 0 15px rgba(99, 102, 241, 0.25)';
        }}
      >
        {isOpen ? (
          <X size={25} color="#ffffff" />
        ) : (
          <>
            <Bot size={26} color="#ffffff" />
            {/* Status indicator pulse ring */}
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: isLlmConfigured ? '#10b981' : '#38bdf8',
                border: '2px solid #060914',
                boxShadow: isLlmConfigured ? '0 0 6px #10b981' : '0 0 6px #38bdf8'
              }}
            />
          </>
        )}
      </button>
    </>
  );
}
