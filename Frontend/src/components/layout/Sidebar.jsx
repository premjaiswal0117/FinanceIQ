import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse
}) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown },
    { id: 'income', label: 'Income', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'insights', label: 'Financial Insights', icon: Lightbulb },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      style={{
        width: isCollapsed ? '72px' : '300px',
        minWidth: isCollapsed ? '72px' : '300px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        transition: 'width 0.25s ease, min-width 0.25s ease',
        overflow: 'hidden'
      }}
    >
      {/* Brand Logo & Header */}
      <div
        style={{
          height: 'var(--header-height)',
          minHeight: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0' : '0 1.5rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer'
          }}
          onClick={() => onSelectTab('overview')}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background:
                'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                '0 0 16px rgba(99, 102, 241, 0.5)',
              flexShrink: 0
            }}
          >
            <Sparkles size={20} color="#ffffff" />
          </div>

          {!isCollapsed && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <span
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: '#ffffff'
                }}
              >
                Finance<span style={{ color: '#818cf8' }}>IQ</span>
              </span>

              <span
                style={{
                  fontSize: '0.68rem',
                  color: '#64748b',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                Personal Finance
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="icon-btn"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px'
            }}
            title="Collapse Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div
        style={{
          flex: 1,
          padding: isCollapsed
            ? '1rem 0.4rem'
            : '1.25rem 0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                width: '100%',
                padding: isCollapsed
                  ? '0.75rem 0'
                  : '0.7rem 0.95rem',
                justifyContent: isCollapsed
                  ? 'center'
                  : 'flex-start',
                backgroundColor: isActive
                  ? 'rgba(99, 102, 241, 0.12)'
                  : 'transparent',
                color: isActive
                  ? '#ffffff'
                  : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: isActive
                  ? 'rgba(99, 102, 241, 0.3)'
                  : 'transparent',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition:
                  'all var(--transition-fast)',
                position: 'relative',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                outline: 'none'
              }}
              title={isCollapsed ? item.label : undefined}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: '0',
                    top: '25%',
                    bottom: '25%',
                    width: '3px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: '#6366f1',
                    boxShadow: '0 0 10px #6366f1'
                  }}
                />
              )}

              <Icon
                size={19}
                style={{
                  color: isActive
                    ? '#818cf8'
                    : 'currentColor',
                  flexShrink: 0
                }}
              />

              {!isCollapsed && (
                <span
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.label}
                </span>
              )}

              {!isCollapsed && item.badge && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor:
                      'rgba(139, 92, 246, 0.15)',
                    color: '#c084fc',
                    border:
                      '1px solid rgba(139, 92, 246, 0.3)'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div
        style={{
          padding: isCollapsed
            ? '1rem 0.4rem'
            : '1.25rem',
          borderTop:
            '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        {isCollapsed ? (
          <button
            onClick={onToggleCollapse}
            className="icon-btn"
            style={{
              margin: '0 auto',
              width: '36px',
              height: '36px'
            }}
            title="Expand Sidebar"
          >
            <ChevronRight size={18} />
          </button>
        ) : (
          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              background:
                'linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
              border:
                '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                minWidth: 0
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  flexShrink: 0
                }}
              >
                {user?.full_name
                  ? user.full_name[0]
                  : 'U'}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#f1f5f9',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {user?.full_name ||
                    'Individual User'}
                </span>

                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#818cf8',
                    fontWeight: 600
                  }}
                >
                  ID: {user?.user_id}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="icon-btn"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                color: '#fb7185',
                flexShrink: 0
              }}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}