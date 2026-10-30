import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';

export function TransactionTable({
  transactions = [],
  currency,
  loading,
  isLive,
  searchQuery: externalSearch,
  title = 'Recent Transactions',
  subtitle = 'Your personal transaction history'
}) {
  const [internalSearch, setInternalSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const pageSize = 8;

  const effectiveSearch =
    externalSearch || internalSearch;

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Filter by Type
    if (filterType !== 'ALL') {
      result = result.filter(
        (t) =>
          (t.transaction_type || '').toLowerCase() ===
          filterType.toLowerCase()
      );
    }

    // Filter by Search Query
    if (effectiveSearch.trim()) {
      const q = effectiveSearch.toLowerCase();

      result = result.filter(
        (t) =>
          (t.transaction_id || '')
            .toLowerCase()
            .includes(q) ||
          (t.user_id || '')
            .toLowerCase()
            .includes(q) ||
          (t.category || '')
            .toLowerCase()
            .includes(q) ||
          (t.payment_mode || '')
            .toLowerCase()
            .includes(q) ||
          (t.location || '')
            .toLowerCase()
            .includes(q) ||
          (t.notes || '')
            .toLowerCase()
            .includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'amount') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (sortField === 'date') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      }

      if (valA < valB) {
        return sortOrder === 'asc' ? -1 : 1;
      }

      if (valA > valB) {
        return sortOrder === 'asc' ? 1 : -1;
      }

      return 0;
    });

    return result;
  }, [
    transactions,
    filterType,
    effectiveSearch,
    sortField,
    sortOrder
  ]);

  const totalPages =
    Math.ceil(
      filteredTransactions.length / pageSize
    ) || 1;

  const paginatedTransactions =
    filteredTransactions.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(
        sortOrder === 'asc' ? 'desc' : 'asc'
      );
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}
    >
      {/* Header & Filters */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}
          >
            <Receipt
              size={19}
              color="#818cf8"
            />

            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0
              }}
            >
              {title}
            </h3>

            {isLive ? (
              <Badge
                variant="success"
                size="sm"
              >
                Live DB Synced
              </Badge>
            ) : (
              <Badge
                variant="warning"
                size="sm"
              >
                Dataset Schema Preview
              </Badge>
            )}
          </div>

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              marginTop: '0.2rem',
              margin: 0
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Filter Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Quick Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor:
                'rgba(255, 255, 255, 0.04)',
              border:
                '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.75rem',
              fontSize: '0.82rem'
            }}
          >
            <Search
              size={14}
              color="var(--text-muted)"
            />

            <input
              type="text"
              placeholder="Search transactions..."
              value={internalSearch}
              onChange={(e) => {
                setInternalSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '0.82rem',
                width: '130px'
              }}
            />
          </div>

          {/* Filter Pills */}
          <div
            style={{
              display: 'flex',
              backgroundColor:
                'rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              border:
                '1px solid var(--border-subtle)'
            }}
          >
            {['ALL', 'Income', 'Expense'].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor:
                      filterType === type
                        ? 'rgba(99, 102, 241, 0.25)'
                        : 'transparent',
                    color:
                      filterType === type
                        ? '#ffffff'
                        : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight:
                      filterType === type
                        ? 700
                        : 500,
                    cursor: 'pointer',
                    transition:
                      'all var(--transition-fast)'
                  }}
                >
                  {type}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div
        style={{
          overflowX: 'auto',
          width: '100%'
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.85rem'
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom:
                  '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              <th
                style={{
                  padding: '0.75rem 1rem'
                }}
              >
                Transaction ID
              </th>

              <th
                style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer'
                }}
                onClick={() =>
                  toggleSort('date')
                }
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Date</span>

                  <ArrowUpDown
                    size={12}
                    color={
                      sortField === 'date'
                        ? '#818cf8'
                        : 'currentColor'
                    }
                  />
                </div>
              </th>

              <th
                style={{
                  padding: '0.75rem 1rem'
                }}
              >
                User
              </th>

              <th
                style={{
                  padding: '0.75rem 1rem'
                }}
              >
                Type
              </th>

              <th
                style={{
                  padding: '0.75rem 1rem'
                }}
              >
                Category
              </th>

              <th
                style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  textAlign: 'right'
                }}
                onClick={() =>
                  toggleSort('amount')
                }
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      'flex-end',
                    gap: '4px'
                  }}
                >
                  <span>Amount</span>

                  <ArrowUpDown
                    size={12}
                    color={
                      sortField === 'amount'
                        ? '#818cf8'
                        : 'currentColor'
                    }
                  />
                </div>
              </th>

              <th
                style={{
                  padding: '0.75rem 1rem'
                }}
              >
                Payment Mode
              </th>

              <th
                style={{
                  padding: '0.75rem 1rem'
                }}
              >
                Location
              </th>

              <th
                style={{
                  padding: '0.75rem 1rem'
                }}
              >
                Notes
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom:
                      '1px solid rgba(255, 255, 255, 0.04)'
                  }}
                >
                  <td
                    colSpan="9"
                    style={{
                      padding: '1rem'
                    }}
                  >
                    <div
                      className="skeleton-shimmer"
                      style={{
                        height: '24px',
                        width: '100%',
                        borderRadius: '4px'
                      }}
                    />
                  </td>
                </tr>
              ))
            ) : paginatedTransactions.length ===
              0 ? (
              <tr>
                <td
                  colSpan="9"
                  style={{
                    padding: '3rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                  }}
                >
                  No transactions match the
                  selected filters
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx) => {
                const isIncome =
                  (
                    tx.transaction_type || ''
                  ).toLowerCase() ===
                  'income';

                return (
                  <tr
                    key={tx.transaction_id}
                    style={{
                      borderBottom:
                        '1px solid rgba(255, 255, 255, 0.04)',
                      transition:
                        'background-color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      'rgba(255, 255, 255, 0.03)')
                    }
                    onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      'transparent')
                    }
                  >
                    {/* Transaction ID */}
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        fontWeight: 600,
                        color: '#f1f5f9',
                        fontFamily:
                          "'JetBrains Mono', monospace",
                        fontSize: '0.8rem'
                      }}
                    >
                      {tx.transaction_id}
                    </td>

                    {/* Date */}
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        color:
                          'var(--text-secondary)'
                      }}
                    >
                      {formatDate(tx.date)}
                    </td>

                    {/* User ID */}
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        color: '#cbd5e1',
                        fontWeight: 500
                      }}
                    >
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor:
                            'rgba(255, 255, 255, 0.05)',
                          fontSize: '0.75rem'
                        }}
                      >
                        {tx.user_id}
                      </span>
                    </td>

                    {/* Type Badge */}
                    <td
                      style={{
                        padding: '0.85rem 1rem'
                      }}
                    >
                      <Badge
                        variant={
                          isIncome
                            ? 'income'
                            : 'expense'
                        }
                        size="sm"
                      >
                        {isIncome ? (
                          <ArrowUpRight
                            size={12}
                          />
                        ) : (
                          <ArrowDownLeft
                            size={12}
                          />
                        )}

                        {tx.transaction_type}
                      </Badge>
                    </td>

                    {/* Category */}
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        fontWeight: 600,
                        color: '#ffffff'
                      }}
                    >
                      {tx.category}
                    </td>

                    {/* Amount */}
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        textAlign: 'right',
                        fontWeight: 700
                      }}
                      className="tabular-nums"
                    >
                      <span
                        style={{
                          color: isIncome
                            ? '#34d399'
                            : '#fb7185'
                        }}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(
                          tx.amount,
                          currency
                        )}
                      </span>
                    </td>

                    {/* Payment Mode */}
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        color:
                          'var(--text-secondary)'
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <CreditCard
                          size={13}
                          color="var(--text-muted)"
                        />

                        {tx.payment_mode || '—'}
                      </span>
                    </td>

                    {/* Location */}
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        color:
                          'var(--text-secondary)'
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <MapPin
                          size={13}
                          color="var(--text-muted)"
                        />

                        {tx.location || '—'}
                      </span>
                    </td>

                    {/* Notes */}
                    <td
                      style={{
                        padding: '0.85rem 1rem',
                        color:
                          'var(--text-muted)',
                        fontSize: '0.8rem',
                        maxWidth: '180px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {tx.notes || '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingTop: '0.5rem',
          borderTop:
            '1px solid var(--border-subtle)',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}
      >
        <div>
          Showing{' '}
          {Math.min(
            filteredTransactions.length,
            (currentPage - 1) * pageSize + 1
          )}{' '}
          to{' '}
          {Math.min(
            filteredTransactions.length,
            currentPage * pageSize
          )}{' '}
          of {filteredTransactions.length}{' '}
          transactions
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <button
            onClick={() =>
              setCurrentPage((p) =>
                Math.max(1, p - 1)
              )
            }
            disabled={currentPage === 1}
            className="icon-btn"
            style={{
              width: '30px',
              height: '30px'
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <span
            style={{
              color: '#ffffff',
              fontWeight: 600
            }}
          >
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((p) =>
                Math.min(totalPages, p + 1)
              )
            }
            disabled={
              currentPage === totalPages
            }
            className="icon-btn"
            style={{
              width: '30px',
              height: '30px'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}