import React, { useRef, useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  ArrowRight,
  HelpCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { importTransactionsBulk } from '../../api/financeApi';

const FIELD_ALIASES = {
  date: [
    'date',
    'transaction date',
    'transaction_date',
    'value date',
    'value_date',
    'tran date',
    'tran_date',
    'txn date',
    'txn_date'
  ],
  description: [
    'description',
    'narration',
    'remarks',
    'details',
    'transaction details',
    'transaction_details',
    'particulars',
    'notes',
    'note'
  ],
  debit: [
    'debit',
    'withdrawal',
    'withdraw',
    'dr',
    'debit amount',
    'withdrawal amount (inr)'
  ],
  credit: [
    'credit',
    'deposit',
    'cr',
    'credit amount',
    'deposit amount (inr)'
  ],
  amount: [
    'amount',
    'transaction amount',
    'txn amount',
    'value',
    'net amount'
  ],
  balance: [
    'balance',
    'closing balance',
    'available balance',
    'balance (inr)'
  ],
  type: [
    'transaction type',
    'transaction_type',
    'type',
    'dr/cr',
    'debit/credit'
  ],
  category: [
    'category',
    'expense category',
    'expense_category'
  ],
  payment_mode: [
    'payment mode',
    'payment_mode',
    'payment method',
    'mode'
  ],
  location: [
    'location',
    'city',
    'merchant location'
  ]
};

function normalizeHeader(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(cell.trim());
      cell = '';
      if (row.some((v) => String(v).trim() !== '')) {
        rows.push(row);
      }
      row = [];
    } else {
      cell += char;
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    if (row.some((v) => String(v).trim() !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

function cleanAmount(val) {
  if (val === null || val === undefined) return 0;
  const cleaned = String(val)
    .replace(/[₹$€£,\s]/g, '')
    .replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? Math.abs(num) : 0;
}

function parseFlexibleDate(val) {
  if (!val) return '';
  const str = String(val).trim();

  // 1. ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  let match = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    const p1 = parseInt(match[1], 10);
    const p2 = parseInt(match[2], 10);
    const year = match[3];

    // If p1 > 12, it must be DD/MM/YYYY
    if (p1 > 12 && p2 <= 12) {
      const day = String(p1).padStart(2, '0');
      const month = String(p2).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // If p2 > 12, it is MM/DD/YYYY
    if (p2 > 12 && p1 <= 12) {
      const month = String(p1).padStart(2, '0');
      const day = String(p2).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Standard default for Indian/UK bank statements is DD/MM/YYYY
    const day = String(p1).padStart(2, '0');
    const month = String(p2).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 3. YYYY/MM/DD
  match = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 4. Fallback Date.parse
  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return '';
}

function inferCategoryFromDescription(desc, txnType) {
  if (!desc) return txnType === 'Income' ? 'Salary' : 'Other';
  const text = desc.toLowerCase();

  if (txnType === 'Income') {
    if (text.includes('salary') || text.includes('payroll') || text.includes('wage')) return 'Salary';
    if (text.includes('dividend') || text.includes('interest') || text.includes('fd interest')) return 'Investment';
    if (text.includes('refund') || text.includes('cashback')) return 'Refund';
    return 'Income';
  }

  if (text.includes('swiggy') || text.includes('zomato') || text.includes('mcdonald') || text.includes('cafe') || text.includes('restaurant') || text.includes('starbucks') || text.includes('dine')) return 'Food';
  if (text.includes('uber') || text.includes('ola') || text.includes('metro') || text.includes('fuel') || text.includes('petrol') || text.includes('irctc') || text.includes('rail') || text.includes('flight')) return 'Travel';
  if (text.includes('blinkit') || text.includes('zepto') || text.includes('grocery') || text.includes('dmart') || text.includes('instamart') || text.includes('bigbasket') || text.includes('supermarket')) return 'Groceries';
  if (text.includes('netflix') || text.includes('prime') || text.includes('hotstar') || text.includes('spotify') || text.includes('cinema') || text.includes('movie') || text.includes('theatre') || text.includes('game')) return 'Entertainment';
  if (text.includes('bescom') || text.includes('electricity') || text.includes('water') || text.includes('wifi') || text.includes('broadband') || text.includes('airtel') || text.includes('jio') || text.includes('recharge') || text.includes('bill')) return 'Utilities';
  if (text.includes('amazon') || text.includes('flipkart') || text.includes('myntra') || text.includes('zara') || text.includes('shopping') || text.includes('mall') || text.includes('h&m')) return 'Shopping';
  if (text.includes('hospital') || text.includes('pharmacy') || text.includes('apollo') || text.includes('medical') || text.includes('clinic') || text.includes('doctor')) return 'Health';
  if (text.includes('rent') || text.includes('maintenance')) return 'Housing';

  return 'Other';
}

export function ImportCSVModal({ isOpen, onClose, onImportSuccess }) {
  const fileInputRef = useRef(null);

  const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'result'
  const [fileName, setFileName] = useState('');
  const [detectedColumns, setDetectedColumns] = useState({});
  const [parsedTransactions, setParsedTransactions] = useState([]);
  const [skippedRowsCount, setSkippedRowsCount] = useState(0);
  const [parseError, setParseError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  const reset = () => {
    setStep('upload');
    setFileName('');
    setDetectedColumns({});
    setParsedTransactions([]);
    setSkippedRowsCount(0);
    setParseError('');
    setIsImporting(false);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isImporting) return;
    reset();
    onClose();
  };

  const processCSVContent = (csvText) => {
    const table = parseCSV(csvText);
    if (table.length < 2) {
      throw new Error('CSV must contain a header row and at least one transaction row.');
    }

    const rawHeaders = table[0];
    const normalizedHeaders = rawHeaders.map(normalizeHeader);

    const findIndex = (aliases) => {
      for (let i = 0; i < normalizedHeaders.length; i += 1) {
        const h = normalizedHeaders[i];
        if (aliases.includes(h)) return i;
      }
      return -1;
    };

    const mapping = {
      date: findIndex(FIELD_ALIASES.date),
      description: findIndex(FIELD_ALIASES.description),
      debit: findIndex(FIELD_ALIASES.debit),
      credit: findIndex(FIELD_ALIASES.credit),
      amount: findIndex(FIELD_ALIASES.amount),
      balance: findIndex(FIELD_ALIASES.balance),
      type: findIndex(FIELD_ALIASES.type),
      category: findIndex(FIELD_ALIASES.category),
      payment_mode: findIndex(FIELD_ALIASES.payment_mode),
      location: findIndex(FIELD_ALIASES.location)
    };

    // Validation: Must have a date column
    if (mapping.date === -1) {
      throw new Error('Could not detect a Date column (e.g., "Date", "Transaction Date", "Value Date").');
    }

    // Must have either (Debit/Credit) OR (Amount)
    const hasDualCols = mapping.debit !== -1 || mapping.credit !== -1;
    const hasSingleAmount = mapping.amount !== -1;

    if (!hasDualCols && !hasSingleAmount) {
      throw new Error('Could not find transaction amount columns (need either "Debit" & "Credit" or "Amount").');
    }

    const validTxns = [];
    let skipped = 0;

    for (let i = 1; i < table.length; i += 1) {
      const row = table[i];
      const getVal = (idx) => (idx >= 0 && idx < row.length ? String(row[idx] || '').trim() : '');

      const rawDate = getVal(mapping.date);
      const isoDate = parseFlexibleDate(rawDate);
      if (!isoDate) {
        skipped += 1;
        continue;
      }

      const desc = getVal(mapping.description) || 'Bank Transaction';
      let txnType = '';
      let txnAmount = 0;

      if (hasDualCols) {
        const debitVal = cleanAmount(getVal(mapping.debit));
        const creditVal = cleanAmount(getVal(mapping.credit));

        if (debitVal > 0 && creditVal === 0) {
          txnType = 'Expense';
          txnAmount = debitVal;
        } else if (creditVal > 0 && debitVal === 0) {
          txnType = 'Income';
          txnAmount = creditVal;
        } else if (debitVal > 0 && creditVal > 0) {
          txnType = 'Expense';
          txnAmount = debitVal;
        }
      }

      if (!txnAmount && hasSingleAmount) {
        const amt = cleanAmount(getVal(mapping.amount));
        const rawType = getVal(mapping.type).toLowerCase();

        if (rawType.includes('cr') || rawType.includes('income') || rawType.includes('deposit')) {
          txnType = 'Income';
          txnAmount = amt;
        } else if (rawType.includes('dr') || rawType.includes('expense') || rawType.includes('withdrawal')) {
          txnType = 'Expense';
          txnAmount = amt;
        } else if (desc.toLowerCase().includes('salary') || desc.toLowerCase().includes('credited')) {
          txnType = 'Income';
          txnAmount = amt;
        } else {
          txnType = 'Expense';
          txnAmount = amt;
        }
      }

      if (!txnAmount || txnAmount <= 0) {
        skipped += 1;
        continue;
      }

      const explicitCategory = getVal(mapping.category);
      const category = explicitCategory || inferCategoryFromDescription(desc, txnType);
      const paymentMode = getVal(mapping.payment_mode) || 'Bank';
      const location = getVal(mapping.location) || 'Online';

      validTxns.push({
        date: isoDate,
        transaction_type: txnType,
        category,
        amount: txnAmount,
        payment_mode: paymentMode,
        location,
        notes: desc
      });
    }

    if (validTxns.length === 0) {
      throw new Error(`Found ${table.length - 1} rows, but no valid transactions could be parsed. Check column formats.`);
    }

    setDetectedColumns({
      date: rawHeaders[mapping.date] || 'Not found',
      amount: hasDualCols
        ? `Debit: ${rawHeaders[mapping.debit] || '—'}, Credit: ${rawHeaders[mapping.credit] || '—'}`
        : rawHeaders[mapping.amount],
      description: mapping.description >= 0 ? rawHeaders[mapping.description] : 'Defaulted',
      balanceIgnored: mapping.balance >= 0 ? rawHeaders[mapping.balance] : null
    });

    setParsedTransactions(validTxns);
    setSkippedRowsCount(skipped);
    setStep('preview');
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError('');

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please upload a valid .csv file.');
      return;
    }

    try {
      const text = await file.text();
      processCSVContent(text);
    } catch (err) {
      setParseError(err.message || 'Failed to parse CSV file.');
    }
  };

  const handleConfirmImport = async () => {
    if (parsedTransactions.length === 0) return;

    setIsImporting(true);
    setParseError('');

    try {
      const res = await importTransactionsBulk(parsedTransactions);
      setImportResult(res);
      setStep('result');
      if (onImportSuccess) {
        await onImportSuccess();
      }
    } catch (err) {
      setParseError(err.message || 'Import failed. Please check network connection or file format.');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleBankCSV = () => {
    const sample = [
      'Date,Narration,Withdrawal (Debit),Deposit (Credit),Closing Balance',
      '15/09/2026,SWIGGY BANGALORE,450.00,,12450.00',
      '16/09/2026,MONTHLY SALARY CREDIT,,55000.00,67450.00',
      '17/09/2026,UBER RIDE INDIA,240.00,,67210.00',
      '18/09/2026,BLINKIT GROCERIES,1150.00,,66060.00',
      '19/09/2026,NETFLIX SUBSCRIPTION,649.00,,65411.00'
    ].join('\n');

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financeiq_sample_bank_statement.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(14px)'
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 30px 90px rgba(0,0,0,0.75)'
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', gap: '0.85rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                boxShadow: '0 10px 30px rgba(6,182,212,0.25)'
              }}
            >
              <FileSpreadsheet size={24} color="#ffffff" />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  color: '#ffffff',
                  fontSize: '1.4rem',
                  fontWeight: 800
                }}
              >
                Bank Statement CSV Import
              </h2>
              <p
                style={{
                  margin: '4px 0 0',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem'
                }}
              >
                Upload flexible bank export CSVs with automatic column and category detection
              </p>
            </div>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={handleClose}
            disabled={isImporting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Banner */}
        {parseError && (
          <div
            style={{
              display: 'flex',
              gap: '0.65rem',
              alignItems: 'flex-start',
              padding: '0.85rem 1.1rem',
              borderRadius: '12px',
              background: 'rgba(244,63,94,0.12)',
              border: '1px solid rgba(244,63,94,0.3)',
              color: '#fb7185',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{parseError}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div>
            <div
              style={{
                padding: '2rem 1.5rem',
                borderRadius: '18px',
                border: '2px dashed rgba(129,140,248,0.4)',
                background: 'rgba(99,102,241,0.04)',
                textAlign: 'center',
                marginBottom: '1.25rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload
                size={34}
                style={{ color: '#818cf8', marginBottom: '0.75rem' }}
              />

              <div
                style={{
                  color: '#f8fafc',
                  fontWeight: 700,
                  fontSize: '1rem',
                  marginBottom: '0.35rem'
                }}
              >
                Select your Bank CSV file
              </div>

              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  maxWidth: '420px',
                  margin: '0 auto 1.25rem'
                }}
              >
                Supports HDFC, ICICI, SBI, Axis, Kotak, Chase, and custom personal finance exports.
              </p>

              <button
                type="button"
                className="btn-primary"
                style={{ pointerEvents: 'none', margin: '0 auto' }}
              >
                Browse Files
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
            </div>

            {/* Feature Callouts */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}
            >
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '2px' }}>
                  ✓ Debit & Credit Support
                </strong>
                Automatically maps withdrawals to Expenses and deposits to Income.
              </div>

              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <strong style={{ color: '#34d399', display: 'block', marginBottom: '2px' }}>
                  ✓ Balance Protection
                </strong>
                Account balance columns are detected and excluded from transaction values.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={downloadSampleBankCSV}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.8rem'
                }}
              >
                <Download size={15} />
                Download Sample Bank Statement CSV
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 'preview' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.1rem',
                borderRadius: '14px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={20} color="#34d399" />
                <div>
                  <strong style={{ color: '#34d399', fontSize: '0.92rem' }}>
                    {parsedTransactions.length.toLocaleString()} transactions ready to import
                  </strong>
                  {skippedRowsCount > 0 && (
                    <div style={{ color: '#fbbf24', fontSize: '0.78rem', marginTop: '2px' }}>
                      {skippedRowsCount} {skippedRowsCount === 1 ? 'row' : 'rows'} skipped (empty or zero amount)
                    </div>
                  )}
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#e2e8f0'
                }}
              >
                {fileName}
              </span>
            </div>

            {/* Detected Column Mapping */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem'
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#818cf8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.6rem'
                }}
              >
                Detected Column Mapping
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.78rem'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Date Column</span>
                  <strong style={{ color: '#ffffff' }}>{detectedColumns.date}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Amount Mapping</span>
                  <strong style={{ color: '#ffffff' }}>{detectedColumns.amount}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Description</span>
                  <strong style={{ color: '#ffffff' }}>{detectedColumns.description}</strong>
                </div>
                {detectedColumns.balanceIgnored && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Balance (Ignored)</span>
                    <span style={{ color: '#fbbf24' }}>{detectedColumns.balanceIgnored}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sample Table Preview */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Eye size={14} /> Sample Rows Preview (First 5)
              </div>

              <div
                style={{
                  overflowX: 'auto',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Date</th>
                      <th style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Type</th>
                      <th style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Category</th>
                      <th style={{ padding: '8px 12px', color: 'var(--text-muted)', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedTransactions.slice(0, 5).map((t, idx) => (
                      <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{t.date}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              color: t.transaction_type === 'Income' ? '#34d399' : '#fb7185',
                              fontWeight: 700
                            }}
                          >
                            {t.transaction_type}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#818cf8' }}>{t.category}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                          ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            color: 'var(--text-muted)',
                            maxWidth: '180px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {t.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep('upload')}
                disabled={isImporting}
              >
                Back / Re-upload
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmImport}
                disabled={isImporting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  minWidth: '170px',
                  justifyContent: 'center'
                }}
              >
                {isImporting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Confirm & Import {parsedTransactions.length.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 'result' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#34d399'
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ margin: '0 0 0.5rem', color: '#ffffff', fontSize: '1.3rem', fontWeight: 800 }}>
              Import Complete!
            </h3>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.5rem' }}>
              Your transactions have been securely saved to your personal FinanceIQ account.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                padding: '1.25rem',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Imported</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                  {importResult?.imported || 0}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Skipped / Duplicates</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
                  {(importResult?.skipped || 0) + skippedRowsCount}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Failed</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: (importResult?.failed > 0) ? '#fb7185' : '#94a3b8', marginTop: '4px' }}>
                  {importResult?.failed || 0}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={handleClose}
              style={{ width: '100%' }}
            >
              Done & View Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
