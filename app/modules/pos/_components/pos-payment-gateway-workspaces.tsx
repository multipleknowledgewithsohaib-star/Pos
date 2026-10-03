'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  Printer,
  Receipt,
  Save,
  Search,
  Smartphone,
  Wallet,
} from 'lucide-react';
import {
  getEnabledPaymentMethods,
  getPaymentMethodMeta,
  processGatewayPayment,
  type PosGatewayMethodKey,
  type PosGatewaySettings,
} from '@/lib/pos-payment-gateway';
import {
  buildPosDraftPreview,
  formatMoney,
  usePosStore,
  type PosPaymentMethod,
  type PosSaleRecord,
} from '@/lib/pos-state';
import { syncInventoryAfterSale } from './pos-payment-helpers';

function moneyLabel(value: number, prefix = '') {
  return `${prefix}${formatMoney(value)}`;
}

function splitCreatedAt(value: string) {
  const [date = '', time = ''] = value.split(',');
  return { date: date.trim(), time: time.trim() };
}

function PaymentStepBar({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps = ['Sale', 'Payment', 'Method', 'Success'];

  return (
    <div className="pos-payment-steps" aria-label="Payment progress">
      {steps.map((label, index) => {
        const step = (index + 1) as 1 | 2 | 3 | 4;
        const active = step === current;
        const done = step < current;

        return (
          <div
            className={`pos-payment-step${active ? ' pos-payment-step-active' : ''}${done ? ' pos-payment-step-done' : ''}`}
            key={label}
          >
            <span>{step}</span>
            <strong>{label}</strong>
          </div>
        );
      })}
    </div>
  );
}

export function PosPaymentMethodWorkspace() {
  const router = useRouter();
  const {
    state,
    setPaymentMethod,
    setAmountReceived,
    setPayerMobile,
    setBankReference,
    setCardReference,
    setNotes,
    completeSaleWithPayment,
  } = usePosStore();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const preview = state.cart.length > 0 ? buildPosDraftPreview(state) : null;
  const enabledMethods = getEnabledPaymentMethods(state.gatewaySettings);
  const activeMethod = state.draft.paymentMethod;
  const meta = getPaymentMethodMeta(activeMethod);
  const total = preview?.total ?? 0;
  const amountReceived = state.draft.amountReceived > 0 ? state.draft.amountReceived : total;
  const change = Math.max(0, amountReceived - total);

  useEffect(() => {
    if (meta.requiresAmount && state.draft.amountReceived <= 0) {
      setAmountReceived(total);
    }
  }, [activeMethod, meta.requiresAmount, setAmountReceived, state.draft.amountReceived, total]);

  const handlePay = async () => {
    if (!preview || state.cart.length === 0 || isProcessing) {
      return;
    }

    setError('');
    setIsProcessing(true);

    const result = processGatewayPayment({
      method: activeMethod,
      total,
      amountReceived,
      payerMobile: state.draft.payerMobile,
      bankReference: state.draft.bankReference,
      cardReference: state.draft.cardReference,
      gateway: state.gatewaySettings,
    });

    if (!result.ok) {
      setError(result.message);
      setIsProcessing(false);
      return;
    }

    const syncResult = await syncInventoryAfterSale(preview.items);
    if (!syncResult.ok) {
      setError(syncResult.message ?? 'Stock update failed.');
      setIsProcessing(false);
      return;
    }

    // Persist sale centrally on the server so other devices & reports see it immediately
    try {
      await fetch('/api/modules/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...preview,
          paymentReference: result.paymentReference,
          gatewayTransactionId: result.gatewayTransactionId,
          paymentStatus: 'Completed',
          changeAmount: result.change,
        }),
      });
    } catch (err) {
      console.warn('Server sale sync failed, saved locally:', err);
    }

    completeSaleWithPayment({
      paymentReference: result.paymentReference,
      gatewayTransactionId: result.gatewayTransactionId,
      paymentStatus: 'Completed',
      changeAmount: result.change,
    });

    setIsProcessing(false);
    router.push(`/modules/pos/payment-success${state.settings.autoPrintReceipt ? '?print=1' : ''}`);
  };

  if (!preview) {
    return (
      <article className="panel pos-panel">
        <div className="pos-empty-state">No active sale found. Start a new sale first.</div>
        <button className="button button-primary" type="button" onClick={() => router.push('/modules/pos/new-sale')}>
          New Sale
        </button>
      </article>
    );
  }

  // Tone class for active method
  const methodToneClass: Record<string, string> = {
    Cash: 'pos-pm-tone-green',
    'Bank Transfer': 'pos-pm-tone-blue',
    Card: 'pos-pm-tone-purple',
    JazzCash: 'pos-pm-tone-orange',
    EasyPaisa: 'pos-pm-tone-teal',
  };

  return (
    <>
      <PaymentStepBar current={3} />

      {/* Order Summary Strip */}
      <div className="pos-pm-summary-strip">
        <div className="pos-pm-summary-strip-label">
          <Receipt className="pos-pm-summary-strip-icon" />
          <span>Invoice <strong>{preview.invoice}</strong> · Customer <strong>{preview.customer.name}</strong></span>
        </div>
        <div className="pos-pm-summary-strip-total">
          <span>Payable</span>
          <strong>{moneyLabel(total)}</strong>
        </div>
      </div>

      {/* Payment Method Cards */}
      <div className="pos-pm-method-grid">
        {enabledMethods.map((entry) => {
          const Icon = entry.icon;
          const active = activeMethod === entry.method;
          const toneClass = methodToneClass[entry.method] ?? 'pos-pm-tone-green';

          return (
            <button
              className={`pos-pm-card ${toneClass}${active ? ' pos-pm-card-active' : ''}`}
              key={entry.method}
              type="button"
              onClick={() => setPaymentMethod(entry.method)}
            >
              <span className="pos-pm-card-icon-wrap" aria-hidden="true">
                <Icon />
              </span>
              <strong>{entry.title}</strong>
              <span>{entry.description}</span>
              {active && <span className="pos-pm-card-check" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Active Method Details Panel */}
      <section className={`panel pos-panel pos-pm-details-panel ${methodToneClass[activeMethod] ?? ''}`}>
        <div className="pos-pm-details-head">
          <div className="pos-pm-details-method-label">
            <span className="pos-pm-details-dot" />
            <strong>{meta.title} Payment</strong>
          </div>
          <span className="pos-pm-details-total-label">Total: <strong>{moneyLabel(total)}</strong></span>
        </div>

        {meta.requiresAmount ? (
          <div className="pos-payment-amount-row">
            <label className="pos-form-group">
              <strong>Amount Received (PKR)</strong>
              <input
                inputMode="decimal"
                onChange={(event) => setAmountReceived(Number(event.target.value))}
                step="0.01"
                type="number"
                value={amountReceived}
              />
            </label>
            <div className="pos-payment-change">
              <strong>Change (PKR)</strong>
              <div className="pos-payment-change-value">{moneyLabel(change)}</div>
            </div>
          </div>
        ) : null}

        {meta.requiresMobile ? (
          <label className="pos-form-group">
            <strong>Customer Mobile Number</strong>
            <input
              inputMode="tel"
              onChange={(event) => setPayerMobile(event.target.value)}
              placeholder="03XX-XXXXXXX"
              value={state.draft.payerMobile}
            />
          </label>
        ) : null}

        {meta.requiresBankRef ? (
          <>
            <div className="pos-gateway-info">
              <span>Bank: {state.gatewaySettings.bankTransfer.bankName}</span>
              <span>Account: {state.gatewaySettings.bankTransfer.accountNumber}</span>
              <span>Title: {state.gatewaySettings.bankTransfer.accountTitle}</span>
            </div>
            <label className="pos-form-group">
              <strong>Transfer Reference</strong>
              <input
                onChange={(event) => setBankReference(event.target.value)}
                placeholder="Enter bank transfer reference"
                value={state.draft.bankReference}
              />
            </label>
          </>
        ) : null}

        {meta.requiresCardRef ? (
          <label className="pos-form-group">
            <strong>Card Approval / Reference</strong>
            <input
              onChange={(event) => setCardReference(event.target.value)}
              placeholder="Enter card approval code"
              value={state.draft.cardReference}
            />
          </label>
        ) : null}

        {activeMethod === 'JazzCash' ? (
          <div className="pos-gateway-info">
            <span>Till Number: {state.gatewaySettings.jazzCash.tillNumber}</span>
            <span>{state.gatewaySettings.jazzCash.sandbox ? 'Sandbox mode' : 'Live mode'}</span>
          </div>
        ) : null}

        {activeMethod === 'EasyPaisa' ? (
          <div className="pos-gateway-info">
            <span>Store ID: {state.gatewaySettings.easyPaisa.storeId}</span>
            <span>{state.gatewaySettings.easyPaisa.sandbox ? 'Sandbox mode' : 'Live mode'}</span>
          </div>
        ) : null}

        <label className="pos-form-group pos-payment-notes">
          <strong>Notes (Optional)</strong>
          <textarea
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add payment notes..."
            value={state.draft.notes}
          />
        </label>
      </section>

      {error ? <div className="pos-payment-alert" role="alert">{error}</div> : null}

      <div className="pos-payment-actions">
        <button className="button button-outline" type="button" onClick={() => router.push('/modules/pos/payment')}>
          <ArrowLeft className="button-icon" />
          <span>Back</span>
        </button>
        <button className="button button-primary pos-pay-now-btn" disabled={isProcessing} type="button" onClick={() => void handlePay()}>
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <BadgeCheck className="button-icon" />
              <span>Pay {moneyLabel(total)} via {meta.title}</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}




export function PosPaymentSuccessWorkspace() {
  const router = useRouter();
  const { state } = usePosStore();
  const sale = state.lastCompletedSale;

  if (!sale) {
    return (
      <article className="panel pos-panel">
        <div className="pos-empty-state">No completed payment found.</div>
        <button className="button button-primary" type="button" onClick={() => router.push('/modules/pos/new-sale')}>
          New Sale
        </button>
      </article>
    );
  }

  const { date, time } = splitCreatedAt(sale.createdAt);

  return (
    <>
      <PaymentStepBar current={4} />

      <article className="panel pos-panel pos-payment-success-card">
        <div className="pos-payment-success-icon" aria-hidden="true">
          <CheckCircle2 />
        </div>
        <h2>Payment Successful</h2>
        <p>{sale.paymentMethod} payment received for invoice {sale.invoice}.</p>

        <div className="pos-payment-success-grid">
          <div>
            <span>Transaction ID</span>
            <strong>{sale.gatewayTransactionId ?? 'N/A'}</strong>
          </div>
          <div>
            <span>Reference</span>
            <strong>{sale.paymentReference ?? 'N/A'}</strong>
          </div>
          <div>
            <span>Amount Paid</span>
            <strong className="pos-summary-success">{moneyLabel(sale.total)}</strong>
          </div>
          <div>
            <span>Change</span>
            <strong>{moneyLabel(sale.changeAmount ?? 0)}</strong>
          </div>
          <div>
            <span>Date</span>
            <strong>{date}</strong>
          </div>
          <div>
            <span>Time</span>
            <strong>{time}</strong>
          </div>
        </div>

        <div className="pos-invoice-mini">
          <div className="pos-invoice-mini-head">
            <Receipt />
            <strong>Invoice Summary</strong>
          </div>
          <div className="pos-invoice-mini-row">
            <span>Customer</span>
            <strong>{sale.customer.name}</strong>
          </div>
          <div className="pos-invoice-mini-row">
            <span>Items</span>
            <strong>{sale.itemsCount}</strong>
          </div>
          <div className="pos-invoice-mini-row">
            <span>Payment Method</span>
            <strong>{sale.paymentMethod}</strong>
          </div>
        </div>

        <div className="pos-payment-actions">
          <button className="button button-secondary" type="button" onClick={() => router.push('/modules/pos/payment-transactions')}>
            View Transactions
          </button>
          <button className="button button-secondary" type="button" onClick={() => router.push('/modules/pos/invoice-preview')}>
            <Printer className="button-icon" />
            <span>Invoice</span>
          </button>
          <button className="button button-primary" type="button" onClick={() => router.push('/modules/pos/new-sale')}>
            New Sale
          </button>
        </div>
      </article>
    </>
  );
}

export function PosPaymentTransactionsWorkspace() {
  const [query, setQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'All' | PosPaymentMethod>('All');
  const { state } = usePosStore();

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return state.completedSales.filter((sale) => {
      const matchesMethod = methodFilter === 'All' || sale.paymentMethod === methodFilter;
      const matchesQuery =
        !normalized ||
        sale.invoice.toLowerCase().includes(normalized) ||
        sale.customer.name.toLowerCase().includes(normalized) ||
        (sale.gatewayTransactionId ?? '').toLowerCase().includes(normalized) ||
        (sale.paymentReference ?? '').toLowerCase().includes(normalized);

      return matchesMethod && matchesQuery;
    });
  }, [methodFilter, query, state.completedSales]);

  return (
    <section className="pos-stack">
      <div className="pos-transactions-toolbar">
        <div className="pos-search-field">
          <Search className="pos-search-icon" />
          <input
            aria-label="Search transactions"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search invoice, customer, transaction ID..."
            value={query}
          />
        </div>
        <select
          aria-label="Filter by payment method"
          className="pos-select"
          onChange={(event) => setMethodFilter(event.target.value as 'All' | PosPaymentMethod)}
          value={methodFilter}
        >
          <option value="All">All Methods</option>
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Card">Card</option>
          <option value="JazzCash">JazzCash</option>
          <option value="EasyPaisa">EasyPaisa</option>
        </select>
      </div>

      <article className="panel pos-panel pos-table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Transaction ID</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="pos-cart-empty" colSpan={7}>
                  No payment transactions found.
                </td>
              </tr>
            ) : (
              rows.map((sale: PosSaleRecord) => (
                <tr key={sale.id}>
                  <td>{sale.invoice}</td>
                  <td>{sale.customer.name}</td>
                  <td>{sale.paymentMethod}</td>
                  <td>{moneyLabel(sale.total)}</td>
                  <td>{sale.gatewayTransactionId ?? '—'}</td>
                  <td>
                    <span className={`pos-status-pill pos-status-${(sale.paymentStatus ?? 'Completed').toLowerCase()}`}>
                      {sale.paymentStatus ?? 'Completed'}
                    </span>
                  </td>
                  <td>{sale.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>
    </section>
  );
}

const gatewayIcons: Record<PosGatewayMethodKey, typeof CreditCard> = {
  cash: Wallet,
  bankTransfer: Building2,
  card: CreditCard,
  jazzCash: Smartphone,
  easyPaisa: Wallet,
};

export function PosGatewaySettingsWorkspace() {
  const router = useRouter();
  const { state, updateGatewaySettings } = usePosStore();
  const [saved, setSaved] = useState(false);
  const gateway = state.gatewaySettings;

  const updateMethod = (key: PosGatewayMethodKey, patch: Partial<PosGatewaySettings[PosGatewayMethodKey]>) => {
    updateGatewaySettings({
      [key]: {
        ...gateway[key],
        ...patch,
      },
    });
    setSaved(false);
  };

  const cards: Array<{ key: PosGatewayMethodKey; title: string }> = [
    { key: 'cash', title: 'Cash' },
    { key: 'bankTransfer', title: 'Bank Transfer' },
    { key: 'card', title: 'Card' },
    { key: 'jazzCash', title: 'JazzCash' },
    { key: 'easyPaisa', title: 'EasyPaisa' },
  ];

  return (
    <section className="pos-stack">
      {cards.map((card) => {
        const Icon = gatewayIcons[card.key];
        const config = gateway[card.key];

        return (
          <article className="panel pos-panel pos-gateway-card" key={card.key}>
            <div className="pos-gateway-card-head">
              <div>
                <Icon className="pos-gateway-card-icon" />
                <h2>{card.title}</h2>
              </div>
              <label className="switch">
                <input
                  checked={config.enabled}
                  type="checkbox"
                  onChange={(event) => updateMethod(card.key, { enabled: event.target.checked })}
                />
                <span />
              </label>
            </div>

            <div className="pos-form-block">
              <label className="pos-form-group">
                <strong>Merchant ID</strong>
                <input
                  onChange={(event) => updateMethod(card.key, { merchantId: event.target.value })}
                  value={config.merchantId}
                />
              </label>
              <label className="pos-form-group">
                <strong>API Key</strong>
                <input
                  onChange={(event) => updateMethod(card.key, { apiKey: event.target.value })}
                  type="password"
                  value={config.apiKey}
                />
              </label>

              {card.key === 'bankTransfer' ? (
                <>
                  <label className="pos-form-group">
                    <strong>Bank Name</strong>
                    <input
                      onChange={(event) => updateMethod(card.key, { bankName: event.target.value })}
                      value={config.bankName ?? ''}
                    />
                  </label>
                  <label className="pos-form-group">
                    <strong>Account Title</strong>
                    <input
                      onChange={(event) => updateMethod(card.key, { accountTitle: event.target.value })}
                      value={config.accountTitle ?? ''}
                    />
                  </label>
                  <label className="pos-form-group">
                    <strong>Account Number</strong>
                    <input
                      onChange={(event) => updateMethod(card.key, { accountNumber: event.target.value })}
                      value={config.accountNumber ?? ''}
                    />
                  </label>
                </>
              ) : null}

              {card.key === 'jazzCash' ? (
                <label className="pos-form-group">
                  <strong>Till Number</strong>
                  <input
                    onChange={(event) => updateMethod(card.key, { tillNumber: event.target.value })}
                    value={config.tillNumber ?? ''}
                  />
                </label>
              ) : null}

              {card.key === 'easyPaisa' ? (
                <label className="pos-form-group">
                  <strong>Store ID</strong>
                  <input
                    onChange={(event) => updateMethod(card.key, { storeId: event.target.value })}
                    value={config.storeId ?? ''}
                  />
                </label>
              ) : null}

              {card.key !== 'cash' ? (
                <div className="pos-setting-row">
                  <div>
                    <strong>Sandbox Mode</strong>
                    <span>Use test credentials without live charges.</span>
                  </div>
                  <label className="switch">
                    <input
                      checked={config.sandbox}
                      type="checkbox"
                      onChange={(event) => updateMethod(card.key, { sandbox: event.target.checked })}
                    />
                    <span />
                  </label>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}

      <div className="pos-payment-actions">
        <button className="button button-outline" type="button" onClick={() => router.push('/modules/pos/settings')}>
          Back to POS Settings
        </button>
        <button
          className="button button-primary"
          type="button"
          onClick={() => {
            setSaved(true);
          }}
        >
          <Save className="button-icon" />
          <span>{saved ? 'Saved' : 'Save Gateway Settings'}</span>
        </button>
      </div>
    </section>
  );
}

export { PaymentStepBar };
