'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Banknote,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Ellipsis,
  Eye,
  Mail,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  ScanBarcode,
  Smartphone,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { posMedicineCatalog } from '@/lib/pos-catalog';
import { posPaymentMethodCards, posSettingsNav } from '@/lib/pos-data';
import {
  buildPosDraftPreview,
  calculateTotals,
  formatInvoiceNumber,
  formatMoney,
  usePosStore,
  type PosCartLine,
  type PosDraftCustomer,
  type PosDraftState,
  type PosPaymentMethod,
  type PosSettings,
  type PosSaleRecord,
} from '@/lib/pos-state';
import { readSystemSettings } from '@/lib/core-settings';
import { readAuthSession } from '@/lib/auth-session';
import { syncInventoryAfterSale } from './pos-payment-helpers';
import { PaymentStepBar } from './pos-payment-gateway-workspaces';

type CatalogMedicine = (typeof posMedicineCatalog)[number];

function splitCreatedAt(value: string) {
  const [date = '', time = ''] = value.split(',');
  return {
    date: date.trim(),
    time: time.trim(),
  };
}

function moneyLabel(value: number, prefix = '') {
  return `${prefix}${formatMoney(value)}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return character;
    }
  });
}

function totalsToDraft(state: PosDraftState) {
  return {
    customer: state.customer,
    discountType: state.discountType,
    discountValue: state.discountValue,
    taxType: state.taxType,
    taxValue: state.taxValue,
    paymentMethod: state.paymentMethod,
    amountReceived: state.amountReceived,
    notes: state.notes,
    payerMobile: state.payerMobile,
    bankReference: state.bankReference,
    cardReference: state.cardReference,
  } satisfies PosDraftState;
}

function useLiveMedicineCatalog() {
  const [catalog, setCatalog] = useState<CatalogMedicine[]>(posMedicineCatalog);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const response = await fetch('/api/modules/inventory', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          data?: Array<{
            id?: number;
            medicineName?: string;
            genericName?: string;
            category?: string;
            unit?: string;
            price?: number;
            stock?: number;
            active?: boolean;
          }>;
        };
        const liveCatalog = (payload.data ?? [])
          .filter((medicine) => medicine.active !== false && typeof medicine.id === 'number' && Boolean(medicine.medicineName?.trim()))
          .map((medicine) => ({
            id: medicine.id as number,
            name: medicine.medicineName?.trim() ?? 'Unnamed Medicine',
            barcode: `MED-${String(medicine.id).padStart(4, '0')}`,
            category: medicine.category?.trim() || medicine.genericName?.trim() || 'General',
            unit: medicine.unit?.trim() || 'Item',
            price: Number(medicine.price) || 0,
            stock: Number(medicine.stock) || 0,
          }));

        if (!cancelled) {
          setCatalog(liveCatalog.length ? liveCatalog : posMedicineCatalog);
        }
      } catch {
        if (!cancelled) {
          setCatalog(posMedicineCatalog);
        }
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  return catalog;
}

function buildReceiptHtml(preview: PosSaleRecord, settings: PosSettings) {
  const sysSettings = readSystemSettings();
  const session = readAuthSession();
  const userName = session ? (session.email.split('@')[0]) : 'Admin';
  const received = preview.amountReceived > 0 ? preview.amountReceived : preview.total;
  const change = preview.changeAmount ?? Math.max(0, received - preview.total);
  const paymentRows = `
        <tr><td>Payment Method</td><td>${escapeHtml(preview.paymentMethod)}</td></tr>
        <tr><td>Transaction ID</td><td>${escapeHtml(preview.gatewayTransactionId ?? 'N/A')}</td></tr>
        <tr><td>Reference</td><td>${escapeHtml(preview.paymentReference ?? 'N/A')}</td></tr>
        <tr><td>Amount Paid</td><td>${formatMoney(preview.total)}</td></tr>
        ${preview.paymentMethod === 'Cash' ? `<tr><td>Cash Received</td><td>${formatMoney(received)}</td></tr><tr><td>Change Return</td><td>${formatMoney(change)}</td></tr>` : ''}
      `;
  const { date, time } = splitCreatedAt(preview.createdAt);
  const rows = preview.items
    .map((item) => {
      const lineTotal = item.price * item.qty - item.lineDiscount;
      return `
        <tr class="product-row">
          <td colspan="5">${escapeHtml(item.name.toUpperCase())}</td>
        </tr>
        <tr class="detail-row">
          <td></td>
          <td class="qty">${item.qty}</td>
          <td class="rate">${formatMoney(item.price)}</td>
          <td class="disc">${formatMoney(item.lineDiscount)}</td>
          <td class="total">${formatMoney(lineTotal)}</td>
        </tr>
      `;
    })
    .join('');
  const taxRow = preview.taxAmount > 0 ? `<tr><td>Adv. Tax (0.5%)</td><td>${formatMoney(preview.taxAmount)}</td></tr>` : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(preview.invoice)}</title>
    <style>
      @page { size: 80mm auto; margin: 3mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Courier New", Courier, monospace;
        color: #111;
        background: #fff;
      }
      .receipt {
        width: 74mm;
        margin: 0 auto;
        padding: 0;
        font-size: 10px;
      }
      .header {
        text-align: center;
        margin-bottom: 5px;
      }
      .logo-mark {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 42px;
        font-weight: 900;
        line-height: 0.8;
        letter-spacing: -2px;
        color: #777;
        margin: 0;
      }
      .logo-name {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 1px;
        margin: 0 0 7px;
        color: #777;
      }
      .address {
        font-size: 10px;
        font-weight: 700;
        line-height: 1.35;
        margin: 0;
        text-transform: uppercase;
      }
      .receipt-title {
        font-size: 11px;
        font-weight: 800;
        margin: 5px 0 3px;
        text-align: center;
      }
      .rule {
        border-top: 1px dashed #111;
        height: 0;
        margin: 3px 0;
      }
      .meta {
        display: flex;
        justify-content: space-between;
        gap: 6px;
        font-size: 10px;
        line-height: 1.35;
      }
      .meta .right {
        text-align: right;
        min-width: 25mm;
      }
      .meta strong {
        font-weight: 800;
      }
      .items, .summary, .cash-box {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
      }
      .items th {
        text-align: left;
        font-size: 9px;
        padding: 2px 0;
        border-bottom: 1px dashed #111;
      }
      .product-row td {
        padding: 6px 0 2px;
        font-weight: 800;
        word-break: break-word;
      }
      .detail-row td {
        padding: 0 0 2px;
      }
      .qty { width: 10mm; text-align: center; }
      .rate, .disc, .total {
        text-align: right;
      }
      .summary {
        margin-top: 4px;
      }
      .summary td {
        padding: 1px 0;
      }
      .summary td:last-child {
        text-align: right;
      }
      .summary .grand td {
        font-weight: 800;
      }
      .cash-box {
        border: 1px solid #111;
        margin-top: 8px;
      }
      .cash-box td {
        padding: 2px 6px;
      }
      .cash-box td:last-child {
        text-align: right;
      }
      .foot {
        margin-top: 14px;
        font-size: 10px;
        text-align: center;
        line-height: 1.45;
      }
      .thanks {
        margin-top: 22px;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="header">
        <p class="logo-mark">MC+</p>
        <p class="logo-name">${escapeHtml((sysSettings.systemName || settings.receiptTitle).toUpperCase())}</p>
        <p class="address">${escapeHtml(sysSettings.address.toUpperCase())}</p>
      </div>
      <div class="receipt-title">CUSTOMER INVOICE</div>
      <div class="rule"></div>
      <div class="meta">
        <div>
          <div>Invoice:</div>
          <div>Date:</div>
          <div>Time:</div>
          <div>User:</div>
          <div>Customer: ${escapeHtml(preview.customer.name.toUpperCase())}</div>
        </div>
        <div class="right">
          <div><strong>${escapeHtml(preview.invoice)}</strong></div>
          <div>${escapeHtml(date)}</div>
          <div>${escapeHtml(time)}</div>
          <div>${escapeHtml(userName)}</div>
        </div>
      </div>
      <div class="rule"></div>
      <table class="items">
        <thead>
          <tr>
            <th>Product</th>
            <th class="qty">Qty</th>
            <th class="rate">Rate</th>
            <th class="disc">Disc</th>
            <th class="total">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="rule"></div>
      <table class="summary">
        <tr><td>Gross Total</td><td>${formatMoney(preview.subtotal)}</td></tr>
        <tr><td>Discount (PKR)</td><td>${formatMoney(preview.discountAmount)}</td></tr>
        ${taxRow}
        <tr class="grand"><td>Grand Total</td><td>${formatMoney(preview.total)}</td></tr>
      </table>
      <table class="cash-box">
        ${paymentRows}
      </table>
      <div class="rule"></div>
      <div class="foot">
        <div>"No Return Or Exchange Without Receipt"</div>
        <div>"No Exchange After 3 Days Of Purchase"</div>
        <div>${escapeHtml(settings.receiptFooter)}</div>
        <div class="thanks">THANK YOU FOR YOUR VISIT</div>
      </div>
    </div>
  </body>
</html>`;
}

function printReceipt(preview: PosSaleRecord, settings: PosSettings) {
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.style.opacity = '0';
  frame.setAttribute('aria-hidden', 'true');
  frame.srcdoc = buildReceiptHtml(preview, settings);
  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) {
      frame.remove();
      return;
    }

    win.focus();
    win.print();
    window.setTimeout(() => {
      frame.remove();
    }, 1000);
  };

  document.body.appendChild(frame);
}

type SaleInventoryItem = {
  id: number;
  name: string;
  stock: number;
};

function normalizePosLookupName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findInventoryItemByName(items: SaleInventoryItem[], name: string) {
  const normalizedName = normalizePosLookupName(name);
  if (!normalizedName) {
    return null;
  }

  return (
    items.find((item) => normalizePosLookupName(item.name) === normalizedName) ??
    items.find((item) => {
      const candidate = normalizePosLookupName(item.name);
      return candidate.length > 2 && (candidate.includes(normalizedName) || normalizedName.includes(candidate));
    }) ??
    null
  );
}

export function PosNewSaleWorkspace() {
  const router = useRouter();
  const {
    state,
    totals,
    addMedicine,
    updateLineQty,
    updateLinePrice,
    updateLineDiscount,
    removeLine,
    clearCart,
    setDiscountType,
    setDiscountValue,
    setNotes,
    holdCurrentSale,
  } = usePosStore();
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<CatalogMedicine[]>([]);
  const [loading, setLoading] = useState(false);

  const posDisabled = !state.settings.enablePos;
  const discountEnabled = state.settings.enableDiscount;
  const customerSelectionEnabled = state.settings.askCustomerDetails;

  const search = query.trim().toLowerCase();

  useEffect(() => {
    const searchVal = query.trim();
    if (!searchVal) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const delay = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/modules/inventory?search=${encodeURIComponent(searchVal)}&limit=8`,
          { cache: 'no-store', signal: controller.signal },
        );
        if (response.ok) {
          const payload = await response.json();
          const items = (payload.data ?? []).map((medicine: any) => ({
            id: medicine.id,
            name: medicine.medicineName?.trim() ?? 'Unnamed Medicine',
            barcode: `MED-${String(medicine.id).padStart(4, '0')}`,
            category: medicine.category?.trim() || medicine.genericName?.trim() || 'General',
            unit: medicine.unit?.trim() || 'Item',
            price: Number(medicine.price) || 0,
            stock: Number(medicine.stock) || 0,
          }));
          setMatches(items);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(delay);
      controller.abort();
    };
  }, [query]);

  const currentCustomer = state.draft.customer;
  const discountDisplay = totals.discountAmount > 0 ? `-${formatMoney(totals.discountAmount)}` : formatMoney(0);
  const taxDisplay = totals.taxAmount > 0 ? `+${formatMoney(totals.taxAmount)}` : formatMoney(0);
  const discountInputValue = discountEnabled
    ? state.draft.discountType === 'percentage'
      ? totals.saleDiscountAmount
      : state.draft.discountValue
    : 0;

  const handleAddMedicine = (medicine: CatalogMedicine) => {
    if (posDisabled || medicine.stock <= 0) {
      return;
    }

    addMedicine(medicine);
    setQuery('');
    setMatches([]);
  };

  const handleHoldSale = () => {
    if (state.cart.length === 0 || posDisabled) {
      return;
    }

    holdCurrentSale();
    router.push('/modules/pos/hold-sale');
  };

  const handleProceedToPayment = () => {
    if (state.cart.length === 0 || posDisabled) {
      return;
    }

    router.push('/modules/pos/payment');
  };

  return (
    <section className="pos-sale-layout">
      <div className="pos-stack">
        <div className="pos-search-shell">
          <div className="pos-search-split">
            <div className="pos-search-field">
              <Search className="pos-search-icon" />
              <input
                aria-label="Search medicine by name or barcode"
                disabled={posDisabled}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={async (event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    let currentMatches = matches;
                    if (currentMatches.length === 0 && query.trim()) {
                      setLoading(true);
                      try {
                        const response = await fetch(`/api/modules/inventory?search=${encodeURIComponent(query.trim())}&limit=5`, { cache: 'no-store' });
                        if (response.ok) {
                          const payload = await response.json();
                          currentMatches = (payload.data ?? []).map((medicine: any) => ({
                            id: medicine.id,
                            name: medicine.medicineName?.trim() ?? 'Unnamed Medicine',
                            barcode: `MED-${String(medicine.id).padStart(4, '0')}`,
                            category: medicine.category?.trim() || medicine.genericName?.trim() || 'General',
                            unit: medicine.unit?.trim() || 'Item',
                            price: Number(medicine.price) || 0,
                            stock: Number(medicine.stock) || 0,
                          }));
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setLoading(false);
                      }
                    }
                    if (currentMatches && currentMatches[0]) {
                      handleAddMedicine(currentMatches[0]);
                    }
                  }
                }}
                placeholder="Search medicine by name / barcode"
                value={query}
              />
            </div>
            <button
              aria-label="Scan barcode"
              className="button button-secondary pos-search-split-button"
              disabled={posDisabled}
              type="button"
              onClick={() => router.push('/modules/pos/barcode-scanner')}
            >
              <ScanBarcode className="button-icon" />
            </button>
          </div>

          {loading ? (
            <div className="pos-search-dropdown">
              <div className="pos-search-empty">Searching medicines...</div>
            </div>
          ) : search ? (
            <div className="pos-search-dropdown" role="listbox" aria-label="Medicine search results">
              {matches.length > 0 ? (
                matches.map((medicine) => (
                  <div className="pos-search-result" key={medicine.id}>
                    <div className="pos-search-result-copy">
                      <strong>{medicine.name}</strong>
                      <span>
                        {medicine.category} - {medicine.barcode}
                      </span>
                    </div>
                    <div className="pos-search-result-meta">
                      <span>{medicine.stock} in stock</span>
                      <strong>{moneyLabel(medicine.price)}</strong>
                    </div>
                    <button
                      className="button button-secondary pos-search-result-button"
                      disabled={posDisabled || medicine.stock <= 0}
                      type="button"
                      onClick={() => handleAddMedicine(medicine)}
                    >
                      <Plus className="button-icon" />
                      <span>{medicine.stock > 0 ? 'Add' : 'Out of stock'}</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="pos-search-empty">No medicines found.</div>
              )}
            </div>
          ) : null}
        </div>

        <article className="panel pos-panel pos-table-panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Discount</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {state.cart.length === 0 ? (
                <tr>
                  <td className="pos-cart-empty" colSpan={7}>
                    No medicines added yet. Search a medicine and press Add.
                  </td>
                </tr>
              ) : (
                state.cart.map((row, index) => {
                  const lineTotal = row.price * row.qty - row.lineDiscount;

                  return (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong className="pos-table-link">{row.name}</strong>
                        <div className="pos-table-subtitle">
                          {row.batchNo ? `Batch: ${row.batchNo} • ` : ''}{row.barcode} • {row.unit}
                        </div>
                      </td>
                      <td>
                        <input
                          aria-label={`${row.name} quantity`}
                          className="pos-table-input pos-table-qty"
                          disabled={posDisabled}
                          inputMode="numeric"
                          min={1}
                          onChange={(event) => updateLineQty(row.id, Number(event.target.value))}
                          type="number"
                          value={row.qty}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`${row.name} rate`}
                          className="pos-table-input pos-table-price"
                          disabled={posDisabled}
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          onChange={(event) => updateLinePrice(row.id, Number(event.target.value))}
                          type="number"
                          value={row.price}
                          style={{ width: '85px', fontWeight: 700 }}
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`${row.name} discount`}
                          className="pos-table-input pos-table-discount"
                          disabled={posDisabled || !discountEnabled}
                          inputMode="decimal"
                          min={0}
                          onChange={(event) => updateLineDiscount(row.id, Number(event.target.value))}
                          step="0.01"
                          type="number"
                          value={row.lineDiscount}
                        />
                      </td>
                      <td>{moneyLabel(lineTotal)}</td>
                      <td>
                        <button className="icon-button icon-button-danger" type="button" title="Remove item" onClick={() => removeLine(row.id)}>
                          <X className="icon-button-icon" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </article>

        <div className="pos-form-block">
          <div className="pos-form-group">
            <strong>Customer</strong>
            <div className="pos-customer-picker">
              <input readOnly value={currentCustomer.name} />
              <button
                aria-label="Select customer"
                className="pos-customer-picker-button"
                disabled={posDisabled || !customerSelectionEnabled}
                type="button"
                onClick={() => router.push('/modules/pos/customer-selection')}
              >
                <Plus />
              </button>
            </div>
          </div>

          <div className="pos-form-group">
            <strong>Discount (PKR)</strong>
            <input
              disabled={posDisabled || !discountEnabled}
              inputMode="decimal"
              onChange={(event) => {
                setDiscountType('amount');
                setDiscountValue(Number(event.target.value));
              }}
              step="0.01"
              type="number"
              value={discountInputValue}
            />
          </div>

          <div className="pos-form-group">
            <strong>Notes (Optional)</strong>
            <textarea
              disabled={posDisabled}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add notes here..."
              value={state.draft.notes}
            />
          </div>
        </div>
      </div>

      <article className="panel pos-panel pos-summary-card">
        <div className="pos-summary-row">
          <span>Subtotal (PKR)</span>
          <strong>{moneyLabel(totals.subtotal)}</strong>
        </div>
        <div className="pos-summary-row">
          <span>Discount (PKR)</span>
          <strong className={totals.discountAmount > 0 ? 'pos-summary-danger' : ''}>{discountDisplay}</strong>
        </div>
        <div className="pos-summary-row">
          <span>Adv. Tax (0.5%)</span>
          <strong className="pos-summary-accent">{taxDisplay}</strong>
        </div>
        <div className="pos-summary-divider" />
        <div className="pos-summary-row pos-summary-total">
          <span>Total (PKR)</span>
          <strong className="pos-summary-success">{moneyLabel(totals.total)}</strong>
        </div>
      </article>

      <article className="panel pos-panel pos-sale-payment-section">
        <div className="pos-sale-payment-head">
          <div>
            <strong>Payment Gateway</strong>
            <span className="pos-sale-payment-subtitle">
              {state.cart.length > 0
                ? `${state.cart.length} item${state.cart.length !== 1 ? 's' : ''} — Ready for checkout`
                : 'Add medicines to begin checkout'}
            </span>
          </div>
          <div className="pos-sale-payment-total-badge">
            <span>Total</span>
            <strong>{moneyLabel(totals.total)}</strong>
          </div>
        </div>

        <div className="pos-sale-payment-methods-row">
          <button
            className={`pos-sale-pm-btn pos-sale-pm-cash${state.draft.paymentMethod === 'Cash' ? ' pos-sale-pm-active' : ''}`}
            type="button"
            disabled={posDisabled}
            onClick={() => { /* method is selected on payment-methods page */ router.push('/modules/pos/payment-methods'); }}
            title="Cash"
          >
            <Banknote />
            <span>Cash</span>
          </button>
          <button
            className={`pos-sale-pm-btn pos-sale-pm-bank${state.draft.paymentMethod === 'Bank Transfer' ? ' pos-sale-pm-active' : ''}`}
            type="button"
            disabled={posDisabled}
            title="Bank Transfer"
            onClick={() => router.push('/modules/pos/payment-methods')}
          >
            <CreditCard />
            <span>Bank</span>
          </button>
          <button
            className={`pos-sale-pm-btn pos-sale-pm-card${state.draft.paymentMethod === 'Card' ? ' pos-sale-pm-active' : ''}`}
            type="button"
            disabled={posDisabled}
            title="Card"
            onClick={() => router.push('/modules/pos/payment-methods')}
          >
            <CreditCard />
            <span>Card</span>
          </button>
          <button
            className={`pos-sale-pm-btn pos-sale-pm-jazz${state.draft.paymentMethod === 'JazzCash' ? ' pos-sale-pm-active' : ''}`}
            type="button"
            disabled={posDisabled}
            title="JazzCash"
            onClick={() => router.push('/modules/pos/payment-methods')}
          >
            <Smartphone />
            <span>JazzCash</span>
          </button>
          <button
            className={`pos-sale-pm-btn pos-sale-pm-easy${state.draft.paymentMethod === 'EasyPaisa' ? ' pos-sale-pm-active' : ''}`}
            type="button"
            disabled={posDisabled}
            title="EasyPaisa"
            onClick={() => router.push('/modules/pos/payment-methods')}
          >
            <Smartphone />
            <span>EasyPaisa</span>
          </button>
        </div>

        <div className="pos-sale-payment-summary-row">
          <div className="pos-sale-payment-summary-item">
            <span>Subtotal</span>
            <strong>{moneyLabel(totals.subtotal)}</strong>
          </div>
          {totals.discountAmount > 0 && (
            <div className="pos-sale-payment-summary-item pos-sale-payment-summary-danger">
              <span>Discount</span>
              <strong>−{moneyLabel(totals.discountAmount)}</strong>
            </div>
          )}
          {totals.taxAmount > 0 && (
            <div className="pos-sale-payment-summary-item pos-sale-payment-summary-tax">
              <span>Tax</span>
              <strong>+{moneyLabel(totals.taxAmount)}</strong>
            </div>
          )}
          <div className="pos-sale-payment-summary-item pos-sale-payment-summary-total">
            <span>Grand Total (PKR)</span>
            <strong>{moneyLabel(totals.total)}</strong>
          </div>
        </div>
      </article>

      <div className="pos-sale-actions">
        <button className="button button-secondary" disabled={state.cart.length === 0 || posDisabled} type="button" onClick={handleHoldSale}>
          Hold Sale
        </button>
        <button className="button button-outline" disabled={state.cart.length === 0 || posDisabled} type="button" onClick={clearCart}>
          Clear Cart
        </button>
        <button className="button button-primary" disabled={state.cart.length === 0 || posDisabled} type="button" onClick={handleProceedToPayment}>
          Proceed to Payment
        </button>
      </div>
    </section>
  );
}

export function PosPaymentWorkspace() {
  const router = useRouter();
  const { state } = usePosStore();

  const preview = state.cart.length > 0 ? buildPosDraftPreview(state) : null;
  const invoiceNumber = preview?.invoice ?? formatInvoiceNumber(state.nextInvoiceNumber);
  const activeCustomer = preview?.customer ?? state.draft.customer;
  const activeTotals = preview
    ? {
        subtotal: preview.subtotal,
        discountAmount: preview.discountAmount,
        taxAmount: preview.taxAmount,
        total: preview.total,
      }
    : {
        subtotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        total: 0,
      };
  const posDisabled = !state.settings.enablePos;

  if (!preview) {
    return (
      <article className="panel pos-panel">
        <div className="pos-empty-state">No active sale found. Add items in New Sale first.</div>
        <button className="button button-primary" type="button" onClick={() => router.push('/modules/pos/new-sale')}>
          Go to New Sale
        </button>
      </article>
    );
  }

  return (
    <>
      <PaymentStepBar current={2} />

      <section className="pos-payment-grid">
        <article className="panel pos-panel pos-payment-meta-card">
          <div className="pos-payment-meta-row">
            <strong>Invoice No.</strong>
            <div className="pos-payment-meta-value">
              <span className="pos-payment-meta-value-accent">{invoiceNumber}</span>
            </div>
          </div>

          <div className="pos-payment-meta-row">
            <strong>Date &amp; Time</strong>
            <div className="pos-payment-meta-value">
              <span>{splitCreatedAt(preview.createdAt).date}</span>
              <span>{splitCreatedAt(preview.createdAt).time}</span>
            </div>
          </div>

          <div className="pos-payment-meta-row">
            <strong>Customer</strong>
            <div className="pos-payment-meta-value">
              <span className="pos-payment-meta-value-accent">{activeCustomer.name}</span>
            </div>
          </div>
        </article>

        <article className="panel pos-panel pos-summary-card">
          <div className="pos-summary-row">
            <span>Subtotal (PKR)</span>
            <strong>{moneyLabel(activeTotals.subtotal)}</strong>
          </div>
          <div className="pos-summary-row">
            <span>Discount (PKR)</span>
            <strong className={activeTotals.discountAmount > 0 ? 'pos-summary-danger' : ''}>
              {activeTotals.discountAmount > 0 ? `-${formatMoney(activeTotals.discountAmount)}` : formatMoney(0)}
            </strong>
          </div>
          <div className="pos-summary-row">
            <span>Tax (PKR)</span>
            <strong>{activeTotals.taxAmount > 0 ? `+${formatMoney(activeTotals.taxAmount)}` : formatMoney(0)}</strong>
          </div>
          <div className="pos-summary-divider" />
          <div className="pos-summary-row pos-summary-total">
            <span>Total (PKR)</span>
            <strong className="pos-summary-success">{moneyLabel(activeTotals.total)}</strong>
          </div>
        </article>
      </section>

      <article className="panel pos-panel pos-payment-review-card">
        <h2>Payment Review</h2>
        <p>Confirm sale totals, then choose a payment method to complete checkout.</p>
        <ul className="pos-payment-review-list">
          <li>Cash with change calculation</li>
          <li>Bank Transfer with reference</li>
          <li>Card with approval code</li>
          <li>JazzCash and EasyPaisa wallet payments</li>
        </ul>
      </article>

      <div className="pos-payment-actions">
        <button className="button button-outline" type="button" onClick={() => router.push('/modules/pos/new-sale')}>
          Back to Sale
        </button>
        <button
          className="button button-primary"
          disabled={state.cart.length === 0 || posDisabled}
          type="button"
          onClick={() => router.push('/modules/pos/payment-methods')}
        >
          Select Payment Method
          <ArrowRight className="button-icon" />
        </button>
      </div>
    </>
  );
}

export function PosInvoicePreviewWorkspace() {
  const store = usePosStore();
  const sysSettings = readSystemSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoPrintedRef = useRef(false);
  const preview = store.state.cart.length > 0 ? buildPosDraftPreview(store.state) : store.state.lastCompletedSale ?? store.state.completedSales[0];
  const shouldAutoPrint = searchParams.get('print') === '1';

  useEffect(() => {
    if (!preview || !shouldAutoPrint || autoPrintedRef.current) {
      return;
    }

    autoPrintedRef.current = true;
    printReceipt(preview, store.state.settings);
  }, [preview, shouldAutoPrint, store.state.settings]);

  const handleDownload = () => {
    if (!preview) {
      return;
    }

    const { date, time } = splitCreatedAt(preview.createdAt);
    const lines = [
      sysSettings.systemName || store.state.settings.receiptTitle,
      'Invoice Preview',
      `Invoice: ${preview.invoice}`,
      `Date: ${date}`,
      `Time: ${time}`,
      `Customer: ${preview.customer.name}`,
      '',
      'Items:',
      ...preview.items.map((item, index) => {
        const total = item.price * item.qty - item.lineDiscount;
        return `${index + 1}. ${item.name} x${item.qty} = ${formatMoney(total)}`;
      }),
      '',
      `Subtotal: ${formatMoney(preview.subtotal)}`,
      `Discount: ${preview.discountAmount > 0 ? '-' : ''}${formatMoney(preview.discountAmount)}`,
      `Tax: ${preview.taxAmount > 0 ? '+' : ''}${formatMoney(preview.taxAmount)}`,
      `Total: ${formatMoney(preview.total)}`,
      `Payment Method: ${preview.paymentMethod}`,
      `Transaction ID: ${preview.gatewayTransactionId ?? 'N/A'}`,
      `Reference: ${preview.paymentReference ?? 'N/A'}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${preview.invoice}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    if (!preview) {
      return;
    }

    const subject = encodeURIComponent(`Invoice ${preview.invoice}`);
    const body = encodeURIComponent(
      `Invoice: ${preview.invoice}\nCustomer: ${preview.customer.name}\nTotal: ${formatMoney(preview.total)}\n`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handlePrint = () => {
    if (!preview) {
      return;
    }

    printReceipt(preview, store.state.settings);
  };

  if (!preview) {
    return (
      <article className="panel pos-panel pos-invoice-card">
        <div className="pos-empty-state">No completed sale is available yet.</div>
        <div className="pos-invoice-actions">
          <button className="button button-secondary" type="button" onClick={() => router.push('/modules/pos/new-sale')}>
            Back to Sale
          </button>
        </div>
      </article>
    );
  }

  const { date, time } = splitCreatedAt(preview.createdAt);

  return (
    <article className="panel pos-panel pos-invoice-card">
      <div className="pos-invoice-header">
        <div className="pos-invoice-brand">
          <div className="pos-invoice-logo" aria-hidden="true">
            <Plus strokeWidth={2.8} />
          </div>
          <div className="pos-invoice-brand-copy">
            <strong>{sysSettings.systemName || store.state.settings.receiptTitle}</strong>
            <span style={{ display: 'block', fontSize: '0.85rem', color: '#666' }}>{sysSettings.address}</span>
          </div>
        </div>

        <div className="pos-invoice-meta">
          <strong>INVOICE</strong>
          <span>{preview.invoice}</span>
          <div className="pos-invoice-info">
            <span>Date: {date}</span>
            <span>Time: {time}</span>
          </div>
        </div>
      </div>

      <div className="pos-invoice-grid">
        <div className="pos-invoice-info">
          <span>Customer</span>
          <strong>{preview.customer.name}</strong>
        </div>

        <div className="pos-invoice-info pos-invoice-payment-info">
          <span>Payment Method</span>
          <strong>{preview.paymentMethod}</strong>
          <span>Transaction ID</span>
          <strong>{preview.gatewayTransactionId ?? 'N/A'}</strong>
          <span>Reference</span>
          <strong>{preview.paymentReference ?? 'N/A'}</strong>
        </div>

        <div className="pos-invoice-table-wrap">
          <table className="data-table pos-invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {preview.items.map((row, index) => {
                const lineTotal = row.price * row.qty - row.lineDiscount;

                return (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{row.name}</td>
                    <td>{row.qty}</td>
                    <td>{moneyLabel(row.price)}</td>
                    <td>{moneyLabel(row.lineDiscount)}</td>
                    <td>{moneyLabel(lineTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pos-invoice-summary">
          <div className="pos-invoice-summary-row">
            <span>Subtotal</span>
            <strong>{moneyLabel(preview.subtotal)}</strong>
          </div>
          <div className="pos-invoice-summary-row">
            <span>Discount</span>
            <strong className={preview.discountAmount > 0 ? 'pos-summary-danger' : ''}>
              {preview.discountAmount > 0 ? `-${formatMoney(preview.discountAmount)}` : formatMoney(0)}
            </strong>
          </div>
          <div className="pos-invoice-summary-row">
            <span>Tax</span>
            <strong>{preview.taxAmount > 0 ? `+${formatMoney(preview.taxAmount)}` : formatMoney(0)}</strong>
          </div>
          <div className="pos-summary-divider" />
          <div className="pos-invoice-summary-row pos-summary-total">
            <span>Total (PKR)</span>
            <strong className="pos-summary-success">{moneyLabel(preview.total)}</strong>
          </div>
        </div>
      </div>

      <div className="pos-invoice-footer">{store.state.settings.receiptFooter}</div>

      <div className="pos-invoice-actions">
        <button className="button button-outline" type="button" onClick={() => router.push('/modules/pos/new-sale')}>
          New Sale
        </button>
        <button className="button button-secondary" type="button" onClick={() => router.push('/modules/pos/payment-transactions')}>
          Transactions
        </button>
        <button className="button button-secondary" type="button" onClick={handleDownload}>
          <Download className="button-icon" />
          <span>Download</span>
        </button>
        <button className="button button-secondary" type="button" onClick={handlePrint}>
          <Printer className="button-icon" />
          <span>Print</span>
        </button>
        <button className="button button-primary" type="button" onClick={handleEmail}>
          <Mail className="button-icon" />
          <span>Send to Email</span>
        </button>
      </div>
    </article>
  );
}

export function PosSettingsWorkspace() {
  const router = useRouter();
  const { state, updateSettings } = usePosStore();
  const [activeSection, setActiveSection] = useState(posSettingsNav[0].title);

  const settings = state.settings;

  const applyPatch = (patch: Partial<PosSettings>) => {
    updateSettings(patch);
  };

  return (
    <section className="pos-settings-layout">
      <nav className="pos-settings-nav" aria-label="POS settings sections">
        {posSettingsNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.title;

          return (
            <button
              aria-pressed={isActive}
              className={`pos-settings-nav-item${isActive ? ' pos-settings-nav-active' : ''}`}
              key={item.title}
              type="button"
              onClick={() => setActiveSection(item.title)}
            >
              <Icon className="pos-settings-nav-icon" />
              <div>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <article className="panel pos-panel pos-settings-panel">
        <h2>{activeSection}</h2>

        {activeSection === 'General Settings' ? (
          <div className="pos-toggle-list">
            <div className="pos-setting-row">
              <div>
                <strong>Enable POS</strong>
                <span>Turn the POS workflows on or off.</span>
              </div>
              <label className="switch">
                <input checked={settings.enablePos} type="checkbox" onChange={(event) => applyPatch({ enablePos: event.target.checked })} />
                <span />
              </label>
            </div>

            <div className="pos-setting-row">
              <div>
                <strong>Default Payment Method</strong>
                <span>Used when a new sale starts.</span>
              </div>
              <select
                className="pos-select"
                value={settings.defaultPaymentMethod}
                onChange={(event) => applyPatch({ defaultPaymentMethod: event.target.value as PosPaymentMethod })}
              >
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Card</option>
                <option>JazzCash</option>
                <option>EasyPaisa</option>
              </select>
            </div>

            <div className="pos-setting-row">
              <div>
                <strong>Ask Customer Details</strong>
                <span>Show customer selection in the sale flow.</span>
              </div>
              <label className="switch">
                <input
                  checked={settings.askCustomerDetails}
                  type="checkbox"
                  onChange={(event) => applyPatch({ askCustomerDetails: event.target.checked })}
                />
                <span />
              </label>
            </div>
          </div>
        ) : null}

        {activeSection === 'Receipt Settings' ? (
          <div className="pos-form-block">
            <div className="pos-setting-row">
              <div>
                <strong>Print Receipt Automatically</strong>
                <span>Automatically open receipt print after payment.</span>
              </div>
              <label className="switch">
                <input
                  checked={settings.autoPrintReceipt}
                  type="checkbox"
                  onChange={(event) => applyPatch({ autoPrintReceipt: event.target.checked })}
                />
                <span />
              </label>
            </div>

            <label className="pos-form-group">
              <strong>Receipt Title</strong>
              <input
                onChange={(event) => applyPatch({ receiptTitle: event.target.value })}
                placeholder="Al Raza Pharmacy"
                value={settings.receiptTitle}
              />
            </label>

            <label className="pos-form-group">
              <strong>Receipt Footer</strong>
              <textarea
                onChange={(event) => applyPatch({ receiptFooter: event.target.value })}
                placeholder="Thank you for shopping with us."
                value={settings.receiptFooter}
              />
            </label>
          </div>
        ) : null}

        {activeSection === 'Payment Methods' ? (
          <div className="pos-settings-payment-grid">
            {posPaymentMethodCards.map((card) => {
              const Icon = card.icon;
              const isActive = settings.defaultPaymentMethod === card.title;

              return (
                <button
                  className={`pos-payment-method${isActive ? ' pos-payment-method-active' : ''}`}
                  key={card.title}
                  type="button"
                  onClick={() => applyPatch({ defaultPaymentMethod: card.title as PosPaymentMethod })}
                >
                  <span className="pos-payment-method-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <strong>{card.title}</strong>
                </button>
              );
            })}
            <button className="button button-secondary pos-gateway-settings-link" type="button" onClick={() => router.push('/modules/pos/gateway-settings')}>
              Open Gateway Settings
            </button>
          </div>
        ) : null}

        {activeSection === 'Gateway Settings' ? (
          <div className="pos-settings-gateway-copy">
            <p>Configure JazzCash, EasyPaisa, bank transfer, card, and cash gateway options.</p>
            <button className="button button-primary" type="button" onClick={() => router.push('/modules/pos/gateway-settings')}>
              Manage Gateway Settings
            </button>
          </div>
        ) : null}

        {activeSection === 'Taxes' ? (
          <div className="pos-toggle-list">
            <div className="pos-setting-row">
              <div>
                <strong>Enable Discount</strong>
                <span>Allow sale and item discounts.</span>
              </div>
              <label className="switch">
                <input
                  checked={settings.enableDiscount}
                  type="checkbox"
                  onChange={(event) => applyPatch({ enableDiscount: event.target.checked })}
                />
                <span />
              </label>
            </div>

            <div className="pos-setting-row">
              <div>
                <strong>Enable Tax</strong>
                <span>Include tax inputs in sales and receipts.</span>
              </div>
              <label className="switch">
                <input
                  checked={settings.enableTax}
                  type="checkbox"
                  onChange={(event) => applyPatch({ enableTax: event.target.checked })}
                />
                <span />
              </label>
            </div>
          </div>
        ) : null}

        {activeSection === 'POS Devices' ? (
          <div className="pos-settings-devices">
            <div className="pos-device-card">
              <strong>Receipt Printer</strong>
              <span>Ready for thermal receipt output.</span>
            </div>
            <div className="pos-device-card">
              <strong>Barcode Scanner</strong>
              <span>Can be used from the barcode scanner page.</span>
            </div>
            <div className="pos-device-card">
              <strong>Cash Drawer</strong>
              <span>Opens with cash payment workflows.</span>
            </div>
          </div>
        ) : null}
      </article>

      <div className="pos-settings-actions">
        <button className="button button-primary" type="button" onClick={() => router.push('/modules/pos')}>
          <Save className="button-icon" />
          <span>Save Settings</span>
        </button>
      </div>
    </section>
  );
}

export function PosDiscountTaxWorkspace() {
  const router = useRouter();
  const { state, setDiscountType, setDiscountValue, setTaxType, setTaxValue } = usePosStore();
  const [discountType, setLocalDiscountType] = useState(state.draft.discountType);
  const [discountValue, setLocalDiscountValue] = useState(state.draft.discountValue);
  const [taxType, setLocalTaxType] = useState(state.draft.taxType);
  const [taxValue, setLocalTaxValue] = useState(state.draft.taxValue);
  const discountEnabled = state.settings.enableDiscount;
  const taxEnabled = state.settings.enableTax;

  const previewTotals = calculateTotals(
    state.cart,
    totalsToDraft({
      ...state.draft,
      discountType: discountEnabled ? discountType : 'amount',
      discountValue: discountEnabled ? discountValue : 0,
      taxType: taxEnabled ? taxType : 'amount',
      taxValue: taxEnabled ? taxValue : 0,
    }),
  );

  const discountAmount = previewTotals.discountAmount;

  const applyChanges = () => {
    setDiscountType(discountEnabled ? discountType : 'amount');
    setDiscountValue(discountEnabled ? discountValue : 0);
    setTaxType(taxEnabled ? taxType : 'amount');
    setTaxValue(taxEnabled ? taxValue : 0);
    router.push('/modules/pos/new-sale');
  };

  const discountValueLabel = discountType === 'percentage' ? 'Discount Value (%)' : 'Discount Value (PKR)';
  const discountAmountLabel = 'Discount Amount (PKR)';
  const taxValueLabel = taxType === 'percentage' ? 'Tax Value (%)' : 'Tax Amount (PKR)';

  return (
    <section className="pos-discount-grid">
      <div className="pos-discount-stack">
        <article className="panel pos-panel">
          <h2>Discount</h2>

          <div className="pos-form-block">
            <label className="pos-form-group">
              <strong>Discount Type</strong>
              <select
                disabled={!discountEnabled}
                onChange={(event) => setLocalDiscountType(event.target.value === 'Percentage (%)' ? 'percentage' : 'amount')}
                value={discountType === 'percentage' ? 'Percentage (%)' : 'Fixed Amount'}
              >
                <option>Percentage (%)</option>
                <option>Fixed Amount</option>
              </select>
            </label>

            <label className="pos-form-group">
              <strong>{discountValueLabel}</strong>
              <input
                disabled={!discountEnabled}
                inputMode="decimal"
                onChange={(event) => setLocalDiscountValue(Number(event.target.value))}
                step="0.01"
                type="number"
                value={discountValue}
              />
            </label>

            <label className="pos-form-group">
              <strong>{discountAmountLabel}</strong>
              <input readOnly value={discountAmount > 0 ? formatMoney(discountAmount) : '0.00'} />
            </label>
          </div>
        </article>

        <article className="panel pos-panel pos-summary-card">
          <div className="pos-summary-row">
            <span>Subtotal (PKR)</span>
            <strong>{moneyLabel(previewTotals.subtotal)}</strong>
          </div>
          <div className="pos-summary-row">
            <span>Discount (PKR)</span>
            <strong className={previewTotals.discountAmount > 0 ? 'pos-summary-danger' : ''}>
              {previewTotals.discountAmount > 0 ? `-${formatMoney(previewTotals.discountAmount)}` : formatMoney(0)}
            </strong>
          </div>
          <div className="pos-summary-row">
            <span>Adv. Tax (0.5%)</span>
            <strong>{previewTotals.taxAmount > 0 ? `+${formatMoney(previewTotals.taxAmount)}` : formatMoney(0)}</strong>
          </div>
          <div className="pos-summary-divider" />
          <div className="pos-summary-row pos-summary-total">
            <span>Total (PKR)</span>
            <strong className="pos-summary-success">{moneyLabel(previewTotals.total)}</strong>
          </div>
        </article>
      </div>

      <div className="pos-discount-stack">
        <article className="panel pos-panel">
          <h2>Advance Tax (Adv.T)</h2>

          <div className="pos-form-block">
            <label className="pos-form-group">
              <strong>Tax Type</strong>
              <select
                disabled={!taxEnabled}
                onChange={(event) => setLocalTaxType(event.target.value === 'Percentage (%)' ? 'percentage' : 'amount')}
                value={taxType === 'percentage' ? 'Percentage (%)' : 'Fixed Amount'}
              >
                <option>Fixed Amount</option>
                <option>Percentage (%)</option>
              </select>
            </label>

            <label className="pos-form-group">
              <strong>{taxValueLabel}</strong>
              <input
                disabled={!taxEnabled}
                inputMode="decimal"
                onChange={(event) => setLocalTaxValue(Number(event.target.value))}
                step="0.01"
                type="number"
                value={taxValue}
              />
            </label>
          </div>
        </article>

        <div className="pos-discount-actions">
          <button className="button button-primary" type="button" onClick={applyChanges}>
            <Save className="button-icon" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export function PosCustomerSelectionWorkspace() {
  const router = useRouter();
  const { state, setCustomer, addCustomer } = usePosStore();
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<PosDraftCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  const fetchCustomers = useCallback(async (searchQuery: string, pageNum: number, append = false) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/modules/customers?search=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=30`, { cache: 'no-store' });
      if (response.ok) {
        const payload = await response.json();
        const apiData = payload.data || [];
        
        let data = apiData;
        if (pageNum === 1) {
          const searchLower = searchQuery.trim().toLowerCase();
          const localMatches = state.customers.filter((c) => 
            c.name.toLowerCase().includes(searchLower) || 
            c.phone.toLowerCase().includes(searchLower) ||
            (c.address && c.address.toLowerCase().includes(searchLower))
          );
          
          const apiPhones = new Set(apiData.map((c: any) => c.phone));
          const uniqueLocals = localMatches.filter((c) => !apiPhones.has(c.phone));
          data = [...uniqueLocals, ...apiData];
        }

        setCustomers((prev) => {
          const merged = append ? [...prev, ...data] : data;
          // Ensure uniqueness across the entire list just in case
          const seen = new Set();
          return merged.filter((c: any) => {
            const key = `${c.name}-${c.phone}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
        setHasMore(payload.hasMore ?? false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [state.customers]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchCustomers(query, 1, false);
    }, 150);
    return () => clearTimeout(delay);
  }, [fetchCustomers, query]);

  useEffect(() => {
    if (page > 1) {
      fetchCustomers(query, page, true);
    }
  }, [fetchCustomers, page, query]);

  const activeCustomer = state.draft.customer;

  const handleSelectCustomer = (customer: PosDraftCustomer) => {
    setCustomer(customer);
    router.push('/modules/pos/new-sale');
  };

  const handleSaveCustomer = () => {
    if (!name.trim()) {
      return;
    }

    const customer = {
      name: name.trim(),
      phone: phone.trim() || 'N/A',
      address: address.trim() || 'N/A',
      note: note.trim() || undefined,
    };

    addCustomer(customer);
    router.push('/modules/pos/new-sale');
  };

  return (
    <>
      <div className="pos-search-split pos-search-split-small">
        <div className="pos-search-field">
          <Search className="pos-search-icon" />
          <input onChange={(event) => setQuery(event.target.value)} placeholder="Search customer by name / phone..." value={query} />
        </div>
        <button className="button button-primary pos-customer-picker-button" type="button" onClick={() => setShowAddForm((value) => !value)}>
          {showAddForm ? <X /> : <Plus />}
        </button>
      </div>

      <div className="pos-settings-actions" style={{ justifyContent: 'flex-start', marginTop: '12px' }}>
        <ButtonLink href="/modules/customers" icon={UserRound} variant="secondary">
          Manage Customers
        </ButtonLink>
      </div>

      {showAddForm ? (
        <article className="panel pos-panel pos-customer-add-panel">
          <h2>Add Customer</h2>
          <div className="pos-form-block pos-customer-add-form">
            <label className="pos-form-group">
              <strong>Name</strong>
              <input onChange={(event) => setName(event.target.value)} placeholder="Customer name" value={name} />
            </label>
            <label className="pos-form-group">
              <strong>Phone</strong>
              <input onChange={(event) => setPhone(event.target.value)} placeholder="0300-1234567" value={phone} />
            </label>
            <label className="pos-form-group">
              <strong>Address</strong>
              <input onChange={(event) => setAddress(event.target.value)} placeholder="12-A, Main Market, Karachi" value={address} />
            </label>
            <label className="pos-form-group">
              <strong>Note</strong>
              <input onChange={(event) => setNote(event.target.value)} placeholder="Optional note" value={note} />
            </label>
          </div>
          <div className="pos-settings-actions">
            <button className="button button-secondary" type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button className="button button-primary" type="button" onClick={handleSaveCustomer}>
              <Plus className="button-icon" />
              <span>Save Customer</span>
            </button>
          </div>
        </article>
      ) : null}

      <div className="pos-customer-list">
        {customers.map((customer) => {
          const isActive =
            activeCustomer.name === customer.name &&
            activeCustomer.phone === customer.phone &&
            activeCustomer.address === customer.address;

          return (
            <button
              className={`pos-customer-item${isActive ? ' pos-customer-item-active' : ''}`}
              key={`${customer.name}-${customer.phone}`}
              type="button"
              onClick={() => handleSelectCustomer(customer)}
            >
              <div className="pos-customer-avatar" aria-hidden="true">
                <UserRound />
              </div>

              <div className="pos-customer-copy">
                <strong>{customer.name}</strong>
                <span>{customer.note ?? customer.phone}</span>
              </div>

              <div className="pos-customer-meta">
                <span>{customer.phone === 'N/A' ? 'N/A' : customer.phone}</span>
                {customer.address !== 'N/A' ? <span className="pos-customer-address">{customer.address}</span> : null}
              </div>
            </button>
          );
        })}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', margin: '20px 0', color: 'var(--text-muted)' }}>
          Loading customers...
        </div>
      )}

      {hasMore && !loading && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setPage((p) => p + 1)}
          >
            Load More Customers
          </button>
        </div>
      )}
    </>
  );
}

export function PosBarcodeScannerWorkspace() {
  const router = useRouter();
  const { state, addMedicine } = usePosStore();
  const [barcode, setBarcode] = useState('');
  const [message, setMessage] = useState('');
  const posDisabled = !state.settings.enablePos;

  const handleScan = async () => {
    if (posDisabled) {
      setMessage('POS is disabled from settings.');
      return;
    }

    const search = barcode.trim().toLowerCase();
    if (!search) {
      setMessage('Please enter a barcode.');
      return;
    }

    setMessage('Searching medicine...');
    try {
      const response = await fetch(`/api/modules/inventory?search=${encodeURIComponent(search)}&limit=5`, { cache: 'no-store' });
      if (!response.ok) {
        setMessage('Error searching barcode.');
        return;
      }
      const payload = await response.json();
      const items = payload.data || [];
      if (items.length === 0) {
        setMessage('Medicine not found for this barcode.');
        return;
      }

      const item = items[0];
      const medicine = {
        id: item.id,
        name: item.medicineName?.trim() ?? 'Unnamed Medicine',
        barcode: `MED-${String(item.id).padStart(4, '0')}`,
        category: item.category?.trim() || item.genericName?.trim() || 'General',
        unit: item.unit?.trim() || 'Item',
        price: Number(item.price) || 0,
        stock: Number(item.stock) || 0,
      };

      if (medicine.stock <= 0) {
        setMessage('Medicine is out of stock.');
        return;
      }

      addMedicine(medicine);
      setMessage(`Added ${medicine.name} to cart.`);
      setBarcode('');
      router.push('/modules/pos/new-sale');
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to inventory server.');
    }
  };

  return (
    <article className="panel pos-panel pos-scanner-card">
      <div className="pos-scanner-frame">
        <span className="pos-scanner-corner pos-scanner-corner-top-left" />
        <span className="pos-scanner-corner pos-scanner-corner-top-right" />
        <span className="pos-scanner-corner pos-scanner-corner-bottom-left" />
        <span className="pos-scanner-corner pos-scanner-corner-bottom-right" />

        <div className="pos-barcode" aria-hidden="true">
          {barcodeBars.map((height, index) => (
            <span className="pos-barcode-bar" key={`${height}-${index}`} style={{ height: `${height}px` }} />
          ))}
        </div>

        <div className="pos-scanner-line" />
      </div>

      <div className="pos-scanner-caption">Place barcode under the scanner</div>

      <div className="pos-manual-block">
        <h3>Or enter barcode manually</h3>
        <div className="pos-manual-row">
          <input
            disabled={posDisabled}
            onChange={(event) => setBarcode(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleScan()}
            value={barcode}
          />
          <button type="button" aria-label="Submit barcode" disabled={posDisabled} onClick={handleScan}>
            <ArrowRight />
          </button>
        </div>
        {message ? <div className="pos-scanner-status">{message}</div> : null}
      </div>
    </article>
  );
}

export function PosHoldSaleWorkspace() {
  const router = useRouter();
  const { state, restoreHeldSale, deleteHeldSale, clearHeldSales } = usePosStore();
  const [query, setQuery] = useState('');

  const rows = state.heldSales.filter((sale) => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return true;
    }

    return [sale.invoice, sale.customer.name, sale.customer.phone, sale.customer.address]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));
  });

  const handleRestore = (invoice: string) => {
    restoreHeldSale(invoice);
    router.push('/modules/pos/new-sale');
  };

  return (
    <>
      <div className="pos-tab-row">
        <button className="pos-tab pos-tab-active" type="button">
          On Hold ({state.heldSales.length})
        </button>
        <button className="pos-tab" type="button" onClick={() => router.push('/modules/pos/sales-history')}>
          Completed (Today)
        </button>
      </div>

      <div className="pos-search-row">
        <Search className="pos-search-icon" />
        <input onChange={(event) => setQuery(event.target.value)} placeholder="Search hold sale..." value={query} />
      </div>

      <article className="panel pos-panel pos-table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice No.</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="pos-cart-empty" colSpan={7}>
                  No held sales found.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.invoice}>
                  <td>{index + 1}</td>
                  <td>
                    <strong className="pos-table-link">{row.invoice}</strong>
                  </td>
                  <td>{row.customer.name}</td>
                  <td>{row.itemsCount}</td>
                  <td>{moneyLabel(row.total)}</td>
                  <td>{splitCreatedAt(row.createdAt).time}</td>
                  <td>
                    <div className="pos-row-actions">
                      <button className="icon-button" type="button" title="View" onClick={() => handleRestore(row.invoice)}>
                        <Eye className="icon-button-icon" />
                      </button>
                      <button className="icon-button icon-button-danger" type="button" title="Delete" onClick={() => deleteHeldSale(row.invoice)}>
                        <Trash2 className="icon-button-icon" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>

      <div className="pos-footer-actions">
        <button className="button button-outline" type="button" onClick={clearHeldSales}>
          <Trash2 className="button-icon" />
          <span>Clear All</span>
        </button>
        <Link className="button button-primary" href="/modules/pos/new-sale">
          <Plus className="button-icon" />
          <span>New Sale</span>
        </Link>
      </div>
    </>
  );
}

export function PosSalesHistoryWorkspace() {
  const router = useRouter();
  const { state, setLastCompletedSale } = usePosStore();
  const [query, setQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | PosPaymentMethod>('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const rows = state.completedSales.filter((sale) => {
    const search = query.trim().toLowerCase();
    if (paymentFilter !== 'All' && sale.paymentMethod !== paymentFilter) {
      return false;
    }
    if (!search) {
      return true;
    }

    return [sale.invoice, sale.customer.name, sale.paymentMethod, sale.createdAt]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));
  });

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(rows.length, currentPage * pageSize);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showPagination = pageCount > 1;
  const handleQueryChange = (event: { target: { value: string } }) => {
    setQuery(event.target.value);
    setPage(1);
  };

  const handlePrint = (sale: PosSaleRecord) => {
    setLastCompletedSale(sale);
    router.push('/modules/pos/invoice-preview?print=1');
  };

  return (
    <>
      <div className="pos-history-toolbar">
        <div className="pos-search-row">
          <Search className="pos-search-icon" />
          <input onChange={handleQueryChange} placeholder="Search invoice / customer..." value={query} />
        </div>

        <div className="pos-history-filter-wrap">
          <button className="button button-secondary pos-filter-button" type="button" onClick={() => setFilterOpen((current) => !current)}>
            <Filter className="button-icon" />
            <span>{paymentFilter === 'All' ? 'Filter' : paymentFilter}</span>
          </button>
          {filterOpen ? (
            <div className="module-panel-action-menu pos-history-filter-menu" role="menu">
              {(['All', 'Cash', 'Bank Transfer', 'Card', 'JazzCash', 'EasyPaisa'] as Array<'All' | PosPaymentMethod>).map((method) => (
                <button
                  className={paymentFilter === method ? 'active' : ''}
                  key={method}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPaymentFilter(method);
                    setFilterOpen(false);
                    setPage(1);
                  }}
                >
                  {method}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <article className="panel pos-panel pos-table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice No.</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Date &amp; Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className="pos-cart-empty" colSpan={7}>
                  No completed sales found.
                </td>
              </tr>
            ) : (
              pageRows.map((row, index) => (
                <tr key={row.invoice}>
                  <td>{startIndex + index}</td>
                  <td>
                    <strong className="pos-table-link">{row.invoice}</strong>
                  </td>
                  <td>{row.customer.name}</td>
                  <td>{moneyLabel(row.total)}</td>
                  <td>{row.paymentMethod}</td>
                  <td>{row.createdAt}</td>
                  <td>
                    <div className="pos-row-actions">
                      <button className="icon-button" type="button" title="Print Receipt" onClick={() => handlePrint(row)}>
                        <Printer className="icon-button-icon" />
                      </button>
                      <button
                        className="icon-button"
                        style={{ color: '#dc2626' }}
                        type="button"
                        title="Return / Exchange"
                        onClick={() => router.push(`/modules/pos/return-exchange?invoice=${encodeURIComponent(row.invoice)}`)}
                      >
                        <RotateCcw className="icon-button-icon" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pos-pagination-wrap">
          <div className="pos-pagination-info">
            {rows.length === 0 ? 'Showing 0 entries' : `Showing ${startIndex} to ${endIndex} of ${rows.length} entries`}
          </div>
          {showPagination ? (
            <div className="pos-pagination">
              <button className="button button-secondary pos-pagination-button" type="button" title="Previous" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
                <button
                  className={`button pos-pagination-button${value === currentPage ? ' pos-pagination-button-active' : ' button-secondary'}`}
                  key={value}
                  type="button"
                  onClick={() => setPage(value)}
                >
                  {value}
                </button>
              ))}
              <button className="button button-secondary pos-pagination-button" type="button" title="Next" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
                <ChevronRight />
              </button>
            </div>
          ) : null}
        </div>
      </article>
    </>
  );
}

const barcodeBars = [96, 136, 88, 158, 92, 146, 104, 162, 84, 150, 100, 142, 90, 168, 94, 154, 86, 160];
