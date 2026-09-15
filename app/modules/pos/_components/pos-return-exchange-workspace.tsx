'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  DollarSign,
  Eye,
  Filter,
  Package,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { PosMetricGrid, PosPanel } from '@/components/pos-section';
import { posMedicineCatalog } from '@/lib/pos-catalog';
import {
  type PosCustomer,
  type PosExchangeItem,
  type PosMetric,
  type PosReturnItem,
  type PosReturnReason,
  type PosReturnExchangeRecord,
} from '@/lib/pos-data';
import {
  formatInvoiceNumber,
  formatMoney,
  formatReturnNumber,
  usePosStore,
  type PosCartLine,
  type PosPaymentMethod,
  type PosSaleRecord,
  type PosSettings,
} from '@/lib/pos-state';
import { readSystemSettings } from '@/lib/core-settings';
import { readAuthSession } from '@/lib/auth-session';
import { syncInventoryAfterReturnExchange } from './pos-payment-helpers';

type CatalogMedicine = (typeof posMedicineCatalog)[number];

const RETURN_REASONS: PosReturnReason[] = [
  'Defective / Damaged',
  'Expired Medicine',
  'Wrong Item / Customer Mind Change',
  'Doctor Prescription Changed',
  'Adverse / Allergic Reaction',
  'Excess Quantity',
  'Other',
];

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

function buildReturnReceiptHtml(record: PosReturnExchangeRecord, settings: PosSettings) {
  const sysSettings = readSystemSettings();
  const session = readAuthSession();
  const userName = session ? session.email.split('@')[0] : 'Admin';

  const returnedRows = record.returnedItems
    .map(
      (item) => `
        <tr class="product-row">
          <td colspan="4">${escapeHtml(item.name.toUpperCase())}</td>
        </tr>
        <tr class="detail-row">
          <td class="qty">${item.returnQty} ${escapeHtml(item.unit)}</td>
          <td class="rate">${formatMoney(item.price)}</td>
          <td class="reason">${escapeHtml(item.reason)}</td>
          <td class="total">-${formatMoney(item.refundTotal)}</td>
        </tr>
      `,
    )
    .join('');

  const exchangeRows =
    record.exchangeItems.length > 0
      ? record.exchangeItems
          .map(
            (item) => `
        <tr class="product-row">
          <td colspan="4">${escapeHtml(item.name.toUpperCase())}</td>
        </tr>
        <tr class="detail-row">
          <td class="qty">${item.qty} ${escapeHtml(item.unit)}</td>
          <td class="rate">${formatMoney(item.price)}</td>
          <td class="disc">${item.lineDiscount > 0 ? formatMoney(item.lineDiscount) : '-'}</td>
          <td class="total">+${formatMoney(item.price * item.qty - item.lineDiscount)}</td>
        </tr>
      `,
          )
          .join('')
      : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(record.returnNumber)}</title>
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
        font-size: 36px;
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
        margin: 0 0 5px;
        color: #777;
      }
      .address {
        font-size: 9px;
        font-weight: 700;
        line-height: 1.3;
        margin: 0;
        text-transform: uppercase;
      }
      .receipt-title {
        font-size: 11px;
        font-weight: 800;
        margin: 6px 0 3px;
        text-align: center;
        background: #eee;
        padding: 2px 0;
      }
      .rule {
        border-top: 1px dashed #111;
        height: 0;
        margin: 4px 0;
      }
      .meta {
        display: flex;
        justify-content: space-between;
        gap: 4px;
        font-size: 9px;
        line-height: 1.35;
      }
      .meta .right {
        text-align: right;
      }
      .meta strong {
        font-weight: 800;
      }
      .items, .summary, .settle-box {
        width: 100%;
        border-collapse: collapse;
        font-size: 9px;
      }
      .items th {
        text-align: left;
        font-size: 9px;
        padding: 2px 0;
        border-bottom: 1px dashed #111;
      }
      .section-heading {
        font-size: 10px;
        font-weight: 800;
        padding: 4px 0 2px;
        text-transform: uppercase;
      }
      .product-row td {
        padding: 4px 0 1px;
        font-weight: 800;
        word-break: break-word;
      }
      .detail-row td {
        padding: 0 0 3px;
      }
      .qty { width: 14mm; text-align: left; }
      .rate { text-align: right; width: 16mm; }
      .reason, .disc { text-align: center; }
      .total { text-align: right; width: 18mm; font-weight: 700; }
      .summary {
        margin-top: 4px;
      }
      .summary td {
        padding: 1px 0;
      }
      .summary td:last-child {
        text-align: right;
      }
      .settle-box {
        border: 1px solid #111;
        margin-top: 6px;
      }
      .settle-box td {
        padding: 2px 4px;
      }
      .settle-box td:last-child {
        text-align: right;
      }
      .settle-box .grand td {
        font-weight: 800;
        font-size: 10px;
      }
      .foot {
        margin-top: 10px;
        font-size: 9px;
        text-align: center;
        line-height: 1.4;
      }
      .thanks {
        margin-top: 14px;
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
      <div class="receipt-title">${record.type === 'Exchange' ? 'RETURN & EXCHANGE VOUCHER' : 'RETURN / REFUND VOUCHER'}</div>
      <div class="rule"></div>
      <div class="meta">
        <div>
          <div>Voucher No: <strong>${escapeHtml(record.returnNumber)}</strong></div>
          <div>Orig. Invoice: <strong>${escapeHtml(record.originalInvoice)}</strong></div>
          <div>Customer: ${escapeHtml(record.customer.name.toUpperCase())}</div>
          <div>Phone: ${escapeHtml(record.customer.phone)}</div>
        </div>
        <div class="right">
          <div>Date: ${escapeHtml(record.createdAt)}</div>
          <div>Cashier: ${escapeHtml(userName)}</div>
          <div>Type: <strong>${escapeHtml(record.type.toUpperCase())}</strong></div>
        </div>
      </div>
      <div class="rule"></div>
      <div class="section-heading">[RETURNED ITEMS]</div>
      <table class="items">
        <thead>
          <tr>
            <th>Qty</th>
            <th class="rate">Rate</th>
            <th class="reason">Reason</th>
            <th class="total">Refund</th>
          </tr>
        </thead>
        <tbody>${returnedRows}</tbody>
      </table>

      ${
        record.exchangeItems.length > 0
          ? `
      <div class="rule"></div>
      <div class="section-heading">[EXCHANGED ITEMS]</div>
      <table class="items">
        <thead>
          <tr>
            <th>Qty</th>
            <th class="rate">Rate</th>
            <th class="disc">Disc</th>
            <th class="total">Amount</th>
          </tr>
        </thead>
        <tbody>${exchangeRows}</tbody>
      </table>
      `
          : ''
      }

      <div class="rule"></div>
      <table class="summary">
        <tr><td>Total Returned Value:</td><td>PKR ${formatMoney(record.totalReturnAmount)}</td></tr>
        ${record.totalExchangeAmount > 0 ? `<tr><td>Total Exchange Value:</td><td>PKR ${formatMoney(record.totalExchangeAmount)}</td></tr>` : ''}
      </table>

      <table class="settle-box">
        <tr class="grand">
          <td>${record.settlementType === 'Customer Paid' ? 'Net Paid By Customer' : record.settlementType === 'Refund' ? 'Net Refund To Customer' : 'Settlement'}</td>
          <td>PKR ${formatMoney(Math.abs(record.netAmount))}</td>
        </tr>
        <tr><td>Payment / Refund Mode:</td><td>${escapeHtml(record.paymentMethod)}</td></tr>
        ${record.notes ? `<tr><td>Notes:</td><td>${escapeHtml(record.notes)}</td></tr>` : ''}
      </table>

      <div class="rule"></div>
      <div class="foot">
        <div>"Original Receipt / Voucher required for any future query"</div>
        <div>"Medicines once exchanged cannot be re-exchanged"</div>
        <div class="thanks">THANK YOU FOR YOUR PATRONAGE</div>
      </div>
    </div>
  </body>
</html>`;
}

function printReturnReceipt(record: PosReturnExchangeRecord, settings: PosSettings) {
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.style.opacity = '0';
  frame.setAttribute('aria-hidden', 'true');
  frame.srcdoc = buildReturnReceiptHtml(record, settings);
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

export function PosReturnExchangeWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInvoiceParam = searchParams.get('invoice') || '';

  const { state, processReturnExchange } = usePosStore();
  const [activeTab, setActiveTab] = useState<'process' | 'history'>('process');

  // Search & invoice selection state
  const [invoiceQuery, setInvoiceQuery] = useState(initialInvoiceParam);
  const [selectedSale, setSelectedSale] = useState<PosSaleRecord | null>(null);

  // Return items draft state
  const [returnItems, setReturnItems] = useState<PosReturnItem[]>([]);

  // Exchange items draft state
  const [exchangeSearchQuery, setExchangeSearchQuery] = useState('');
  const [exchangeMatches, setExchangeMatches] = useState<CatalogMedicine[]>([]);
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [exchangeItems, setExchangeItems] = useState<PosExchangeItem[]>([]);

  // Settlement draft state
  const [settlementMethod, setSettlementMethod] = useState<PosPaymentMethod>('Cash');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success / Receipt Modal
  const [processedRecord, setProcessedRecord] = useState<PosReturnExchangeRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<PosReturnExchangeRecord | null>(null);

  // History Tab State
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'All' | 'Return' | 'Exchange'>('All');
  const [historyPage, setHistoryPage] = useState(1);
  const pageSize = 8;

  // Load selected sale into return items state
  const handleSelectSale = useCallback((sale: PosSaleRecord) => {
    setSelectedSale(sale);
    setInvoiceQuery(sale.invoice);
    setErrorMessage('');

    // Check previously returned items for this invoice
    const previousReturnsOnInvoice = state.returnsAndExchanges.filter(
      (r) => r.originalInvoice.toLowerCase() === sale.invoice.toLowerCase(),
    );

    const alreadyReturnedMap = new Map<string, number>();
    previousReturnsOnInvoice.forEach((rec) => {
      rec.returnedItems.forEach((it) => {
        const key = it.name.trim().toLowerCase();
        alreadyReturnedMap.set(key, (alreadyReturnedMap.get(key) ?? 0) + it.returnQty);
      });
    });

    const lines: PosReturnItem[] = sale.items.map((item) => {
      const key = item.name.trim().toLowerCase();
      const prevQty = alreadyReturnedMap.get(key) ?? 0;
      const availableToReturn = Math.max(0, item.qty - prevQty);
      return {
        medicineId: item.medicineId,
        name: item.name,
        barcode: item.barcode,
        category: item.category,
        unit: item.unit,
        price: item.price,
        soldQty: item.qty,
        alreadyReturnedQty: prevQty,
        returnQty: 0,
        lineDiscount: item.lineDiscount,
        refundTotal: 0,
        reason: 'Wrong Item / Customer Mind Change',
        restock: true,
      };
    });

    setReturnItems(lines);
    setExchangeItems([]);
    setNotes('');
  }, [state.returnsAndExchanges]);

  // Auto-select invoice if passed in query param
  useEffect(() => {
    if (initialInvoiceParam) {
      const match = state.completedSales.find(
        (sale) => sale.invoice.trim().toLowerCase() === initialInvoiceParam.trim().toLowerCase(),
      );
      if (match) {
        handleSelectSale(match);
      }
    }
  }, [handleSelectSale, initialInvoiceParam, state.completedSales]);

  // Invoice matches for dropdown
  const filteredSales = useMemo(() => {
    const q = invoiceQuery.trim().toLowerCase();
    if (!q) return state.completedSales.slice(0, 8);
    return state.completedSales
      .filter(
        (sale) =>
          sale.invoice.toLowerCase().includes(q) ||
          sale.customer.name.toLowerCase().includes(q) ||
          (sale.customer.phone && sale.customer.phone.toLowerCase().includes(q)),
      )
      .slice(0, 10);
  }, [invoiceQuery, state.completedSales]);

  const handleUpdateReturnQty = (index: number, qty: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const maxAvailable = Math.max(0, item.soldQty - item.alreadyReturnedQty);
        const safeQty = Math.max(0, Math.min(maxAvailable, Math.floor(qty)));
        const unitDiscount = item.soldQty > 0 ? item.lineDiscount / item.soldQty : 0;
        const refundTotal = safeQty * Math.max(0, item.price - unitDiscount);
        return {
          ...item,
          returnQty: safeQty,
          refundTotal,
        };
      }),
    );
  };

  const handleUpdateReturnReason = (index: number, reason: PosReturnReason) => {
    setReturnItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, reason } : item)),
    );
  };

  const handleToggleRestock = (index: number, restock: boolean) => {
    setReturnItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, restock } : item)),
    );
  };

  // Live exchange search
  useEffect(() => {
    const q = exchangeSearchQuery.trim();
    if (!q) {
      setExchangeMatches([]);
      setExchangeLoading(false);
      return;
    }

    const controller = new AbortController();
    const delay = setTimeout(async () => {
      setExchangeLoading(true);
      try {
        const res = await fetch(`/api/modules/inventory?search=${encodeURIComponent(q)}&limit=6`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (res.ok) {
          const payload = await res.json();
          const items = (payload.data ?? []).map((m: any) => ({
            id: m.id,
            name: m.medicineName?.trim() ?? 'Unnamed Medicine',
            barcode: `MED-${String(m.id).padStart(4, '0')}`,
            category: m.category?.trim() || m.genericName?.trim() || 'General',
            unit: m.unit?.trim() || 'Item',
            price: Number(m.price) || 0,
            stock: Number(m.stock) || 0,
          }));
          setExchangeMatches(items);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setExchangeLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [exchangeSearchQuery]);

  const handleAddExchangeItem = (med: CatalogMedicine) => {
    if (med.stock <= 0) return;

    setExchangeItems((prev) => {
      const exist = prev.find((item) => item.medicineId === med.id);
      if (exist) {
        return prev.map((item) =>
          item.medicineId === med.id ? { ...item, qty: Math.min(med.stock, item.qty + 1) } : item,
        );
      }
      return [
        ...prev,
        {
          id: `exc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          medicineId: med.id,
          name: med.name,
          barcode: med.barcode,
          category: med.category,
          unit: med.unit,
          price: med.price,
          qty: 1,
          lineDiscount: 0,
          stock: med.stock,
        },
      ];
    });

    setExchangeSearchQuery('');
    setExchangeMatches([]);
  };

  const handleUpdateExchangeQty = (id: string, qty: number) => {
    setExchangeItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const safe = Math.max(1, Math.min(item.stock > 0 ? item.stock : 999, Math.floor(qty)));
        return { ...item, qty: safe };
      }),
    );
  };

  const handleUpdateExchangeDiscount = (id: string, discount: number) => {
    setExchangeItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, lineDiscount: Math.max(0, discount) } : item)),
    );
  };

  const handleRemoveExchangeItem = (id: string) => {
    setExchangeItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations
  const activeReturnLines = useMemo(() => returnItems.filter((i) => i.returnQty > 0), [returnItems]);
  const totalReturnAmount = useMemo(
    () => activeReturnLines.reduce((sum, item) => sum + item.refundTotal, 0),
    [activeReturnLines],
  );

  const totalExchangeAmount = useMemo(
    () =>
      exchangeItems.reduce((sum, item) => sum + Math.max(0, item.price * item.qty - item.lineDiscount), 0),
    [exchangeItems],
  );

  const netBalance = totalExchangeAmount - totalReturnAmount;
  const isExchange = exchangeItems.length > 0;
  const settlementType =
    netBalance > 0 ? 'Customer Paid' : netBalance < 0 ? 'Refund' : 'Even Exchange';

  const changeReturn =
    settlementType === 'Customer Paid' && settlementMethod === 'Cash' && amountReceived > netBalance
      ? amountReceived - netBalance
      : 0;

  // Process transaction
  const handleProcessTransaction = async () => {
    if (!selectedSale) {
      setErrorMessage('Please select a valid completed invoice first.');
      return;
    }

    if (activeReturnLines.length === 0) {
      setErrorMessage('Please specify return quantity for at least one medicine item.');
      return;
    }

    setProcessing(true);
    setErrorMessage('');

    try {
      // 1. Sync inventory
      const syncRes = await syncInventoryAfterReturnExchange(
        activeReturnLines.map((item) => ({
          medicineId: item.medicineId,
          name: item.name,
          returnQty: item.returnQty,
          restock: item.restock,
        })),
        exchangeItems.map((item) => ({
          medicineId: item.medicineId,
          name: item.name,
          qty: item.qty,
        })),
      );

      if (!syncRes.ok) {
        setErrorMessage(syncRes.message || 'Inventory synchronization failed.');
        setProcessing(false);
        return;
      }

      // 2. Build record
      const returnNumber = formatReturnNumber(state.nextReturnNumber, isExchange ? 'Exchange' : 'Return');
      const record: PosReturnExchangeRecord = {
        id: `ret-exc-${Date.now()}`,
        returnNumber,
        type: isExchange ? 'Exchange' : 'Return',
        originalInvoice: selectedSale.invoice,
        originalSaleDate: selectedSale.createdAt,
        customer: selectedSale.customer,
        returnedItems: activeReturnLines.map((item) => ({ ...item })),
        exchangeItems: exchangeItems.map((item) => ({ ...item })),
        totalReturnAmount,
        totalExchangeAmount,
        netAmount: netBalance,
        settlementType,
        paymentMethod: settlementMethod,
        notes: notes.trim(),
        createdAt:
          new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }) +
          ', ' +
          new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        status: 'Completed',
      };

      // 3. Commit to POS store
      processReturnExchange(record);
      setProcessedRecord(record);

      // Auto print receipt if enabled
      if (state.settings.autoPrintReceipt) {
        printReturnReceipt(record, state.settings);
      }

      // Reset form
      setSelectedSale(null);
      setInvoiceQuery('');
      setReturnItems([]);
      setExchangeItems([]);
      setNotes('');
      setAmountReceived(0);
    } catch (err) {
      console.error(err);
      setErrorMessage('An unexpected error occurred while processing return/exchange.');
    } finally {
      setProcessing(false);
    }
  };

  // Metrics for Top Bar
  const metrics: PosMetric[] = useMemo(() => {
    const totalReturnsCount = state.returnsAndExchanges.filter((r) => r.type === 'Return').length;
    const totalExchangesCount = state.returnsAndExchanges.filter((r) => r.type === 'Exchange').length;
    const totalRefundsValue = state.returnsAndExchanges
      .filter((r) => r.settlementType === 'Refund')
      .reduce((sum, r) => sum + Math.abs(r.netAmount), 0);
    const totalExchangeNetSales = state.returnsAndExchanges
      .filter((r) => r.settlementType === 'Customer Paid')
      .reduce((sum, r) => sum + r.netAmount, 0);

    return [
      {
        label: 'Total Returns',
        value: `${totalReturnsCount} Orders`,
        tone: 'orange',
        icon: RotateCcw,
      },
      {
        label: 'Total Exchanges',
        value: `${totalExchangesCount} Orders`,
        tone: 'blue',
        icon: RefreshCw,
      },
      {
        label: 'Total Refunds Paid',
        value: `PKR ${formatMoney(totalRefundsValue)}`,
        tone: 'purple',
        icon: CircleDollarSign,
      },
      {
        label: 'Exchange Net Collected',
        value: `PKR ${formatMoney(totalExchangeNetSales)}`,
        tone: 'green',
        icon: ArrowLeftRight,
      },
    ];
  }, [state.returnsAndExchanges]);

  // History Tab Filtered Rows & Pagination
  const historyRows = useMemo(() => {
    return state.returnsAndExchanges.filter((record) => {
      const q = historySearch.trim().toLowerCase();
      if (historyTypeFilter !== 'All' && record.type !== historyTypeFilter) {
        return false;
      }
      if (!q) return true;
      return (
        record.returnNumber.toLowerCase().includes(q) ||
        record.originalInvoice.toLowerCase().includes(q) ||
        record.customer.name.toLowerCase().includes(q) ||
        (record.customer.phone && record.customer.phone.toLowerCase().includes(q))
      );
    });
  }, [state.returnsAndExchanges, historySearch, historyTypeFilter]);

  const historyPageCount = Math.max(1, Math.ceil(historyRows.length / pageSize));
  const currentHistoryPage = Math.min(historyPage, historyPageCount);
  const startHistIndex = historyRows.length === 0 ? 0 : (currentHistoryPage - 1) * pageSize + 1;
  const endHistIndex = Math.min(historyRows.length, currentHistoryPage * pageSize);
  const pagedHistoryRows = historyRows.slice(
    (currentHistoryPage - 1) * pageSize,
    currentHistoryPage * pageSize,
  );

  return (
    <>
      <PosMetricGrid items={metrics} />

      <div className="pos-tab-row" style={{ marginTop: '16px', marginBottom: '20px' }}>
        <button
          className={`pos-tab${activeTab === 'process' ? ' pos-tab-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('process')}
        >
          <RotateCcw style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
          Process Return / Exchange
        </button>
        <button
          className={`pos-tab${activeTab === 'history' ? ' pos-tab-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('history')}
        >
          <ClipboardList style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
          Return &amp; Exchange History ({state.returnsAndExchanges.length})
        </button>
      </div>

      {activeTab === 'process' && (
        <section className="pos-sale-layout">
          <div className="pos-stack">
            {/* Step 1: Invoice Lookup */}
            <article className="panel pos-panel">
              <div className="panel-title-row">
                <div>
                  <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search style={{ width: '20px', height: '20px', color: 'var(--primary)' }} />
                    Step 1: Select Completed Invoice
                  </h2>
                  <p className="pos-panel-description">
                    Search and choose the original sale invoice to return or exchange items.
                  </p>
                </div>
                {selectedSale && (
                  <button
                    className="button button-outline"
                    type="button"
                    onClick={() => {
                      setSelectedSale(null);
                      setInvoiceQuery('');
                      setReturnItems([]);
                      setExchangeItems([]);
                    }}
                  >
                    Change Invoice
                  </button>
                )}
              </div>

              {!selectedSale ? (
                <div className="pos-search-shell" style={{ marginTop: '12px' }}>
                  <div className="pos-search-field">
                    <Search className="pos-search-icon" />
                    <input
                      aria-label="Search invoice number or customer name"
                      onChange={(e) => setInvoiceQuery(e.target.value)}
                      placeholder="Type invoice no (e.g. INV-00001) or customer name / phone..."
                      value={invoiceQuery}
                    />
                  </div>

                  {filteredSales.length > 0 && (
                    <div className="pos-search-dropdown" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {filteredSales.map((sale) => (
                        <div
                          className="pos-search-result"
                          key={sale.invoice}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSelectSale(sale)}
                        >
                          <div className="pos-search-result-copy">
                            <strong style={{ color: 'var(--primary)' }}>{sale.invoice}</strong>
                            <span>
                              {sale.customer.name} {sale.customer.phone !== 'N/A' ? `(${sale.customer.phone})` : ''} • {sale.itemsCount} items • {sale.createdAt}
                            </span>
                          </div>
                          <div className="pos-search-result-meta">
                            <strong>PKR {formatMoney(sale.total)}</strong>
                            <span className="status-badge status-active">{sale.paymentMethod}</span>
                          </div>
                          <button className="button button-primary" type="button" onClick={() => handleSelectSale(sale)}>
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginTop: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Invoice No</span>
                    <strong style={{ display: 'block', fontSize: '16px', color: 'var(--primary)' }}>{selectedSale.invoice}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Customer</span>
                    <strong style={{ display: 'block', fontSize: '15px' }}>{selectedSale.customer.name}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{selectedSale.customer.phone}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Date &amp; Time</span>
                    <strong style={{ display: 'block', fontSize: '13px' }}>{selectedSale.createdAt}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Original Paid</span>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#16a34a' }}>PKR {formatMoney(selectedSale.total)}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>via {selectedSale.paymentMethod}</span>
                  </div>
                </div>
              )}
            </article>

            {/* Step 2: Return Items Table */}
            {selectedSale && (
              <article className="panel pos-panel pos-table-panel">
                <div className="panel-title-row">
                  <div>
                    <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RotateCcw style={{ width: '20px', height: '20px', color: '#ef4444' }} />
                      Step 2: Choose Items to Return
                    </h2>
                    <p className="pos-panel-description">
                      Enter quantity to return, select reason, and decide whether to restock medicine.
                    </p>
                  </div>
                  <div className="pos-summary-badge" style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 14px', borderRadius: '8px', fontWeight: 800 }}>
                    Total Refund: PKR {formatMoney(totalReturnAmount)}
                  </div>
                </div>

                <table className="data-table" style={{ marginTop: '12px' }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Medicine Name</th>
                      <th>Sold Qty</th>
                      <th>Avail. to Return</th>
                      <th style={{ minWidth: '100px' }}>Return Qty</th>
                      <th>Unit Rate</th>
                      <th>Refund Amount</th>
                      <th style={{ minWidth: '170px' }}>Return Reason</th>
                      <th>Restock Stock?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item, index) => {
                      const maxAvailable = Math.max(0, item.soldQty - item.alreadyReturnedQty);
                      const isSelected = item.returnQty > 0;

                      return (
                        <tr key={`${item.name}-${index}`} style={{ background: isSelected ? '#fff9f9' : undefined }}>
                          <td>{index + 1}</td>
                          <td>
                            <strong className="pos-table-link">{item.name}</strong>
                            <div className="pos-table-subtitle">
                              {item.barcode} • {item.category} • {item.unit}
                            </div>
                          </td>
                          <td><strong>{item.soldQty}</strong></td>
                          <td>
                            <span style={{ color: maxAvailable > 0 ? '#16a34a' : '#ef4444', fontWeight: 700 }}>
                              {maxAvailable} {item.alreadyReturnedQty > 0 ? `(${item.alreadyReturnedQty} prev. returned)` : ''}
                            </span>
                          </td>
                          <td>
                            <input
                              aria-label={`${item.name} return quantity`}
                              className="pos-table-input pos-table-qty"
                              disabled={maxAvailable <= 0}
                              inputMode="numeric"
                              max={maxAvailable}
                              min={0}
                              onChange={(e) => handleUpdateReturnQty(index, Number(e.target.value))}
                              type="number"
                              value={item.returnQty}
                              style={{ width: '80px', borderColor: isSelected ? '#ef4444' : undefined }}
                            />
                          </td>
                          <td>PKR {formatMoney(item.price)}</td>
                          <td>
                            <strong style={{ color: isSelected ? '#dc2626' : '#64748b' }}>
                              PKR {formatMoney(item.refundTotal)}
                            </strong>
                          </td>
                          <td>
                            <select
                              className="pos-select"
                              disabled={!isSelected}
                              onChange={(e) => handleUpdateReturnReason(index, e.target.value as PosReturnReason)}
                              value={item.reason}
                              style={{ fontSize: '12px', height: '36px', padding: '0 8px' }}
                            >
                              {RETURN_REASONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <label className="switch" style={{ margin: '0 auto' }}>
                              <input
                                checked={item.restock}
                                disabled={!isSelected}
                                onChange={(e) => handleToggleRestock(index, e.target.checked)}
                                type="checkbox"
                              />
                              <span />
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </article>
            )}

            {/* Step 3: Exchange Items (Optional) */}
            {selectedSale && activeReturnLines.length > 0 && (
              <article className="panel pos-panel pos-table-panel">
                <div className="panel-title-row">
                  <div>
                    <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                      Step 3: Exchange / Replacement Items (Optional)
                    </h2>
                    <p className="pos-panel-description">
                      Add new medicines from inventory if the customer wants to exchange for other items.
                    </p>
                  </div>
                  {exchangeItems.length > 0 && (
                    <div className="pos-summary-badge" style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 14px', borderRadius: '8px', fontWeight: 800 }}>
                      Exchange Total: PKR {formatMoney(totalExchangeAmount)}
                    </div>
                  )}
                </div>

                {/* Search Medicine for Exchange */}
                <div className="pos-search-shell" style={{ marginTop: '12px' }}>
                  <div className="pos-search-field">
                    <Search className="pos-search-icon" />
                    <input
                      aria-label="Search medicine for exchange"
                      onChange={(e) => setExchangeSearchQuery(e.target.value)}
                      placeholder="Search replacement medicine by name or barcode to add in exchange..."
                      value={exchangeSearchQuery}
                    />
                  </div>

                  {exchangeLoading ? (
                    <div className="pos-search-dropdown">
                      <div className="pos-search-empty">Searching catalog...</div>
                    </div>
                  ) : exchangeMatches.length > 0 ? (
                    <div className="pos-search-dropdown" role="listbox">
                      {exchangeMatches.map((med) => (
                        <div className="pos-search-result" key={med.id}>
                          <div className="pos-search-result-copy">
                            <strong>{med.name}</strong>
                            <span>{med.category} • {med.barcode} • {med.unit}</span>
                          </div>
                          <div className="pos-search-result-meta">
                            <span>{med.stock} in stock</span>
                            <strong>PKR {formatMoney(med.price)}</strong>
                          </div>
                          <button
                            className="button button-primary"
                            disabled={med.stock <= 0}
                            type="button"
                            onClick={() => handleAddExchangeItem(med)}
                          >
                            <Plus style={{ width: '16px', height: '16px', marginRight: '4px' }} />
                            {med.stock > 0 ? 'Add to Exchange' : 'Out of Stock'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {exchangeItems.length > 0 ? (
                  <table className="data-table" style={{ marginTop: '16px' }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Exchange Medicine</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Discount</th>
                        <th>Total</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {exchangeItems.map((row, idx) => {
                        const lineTotal = row.price * row.qty - row.lineDiscount;
                        return (
                          <tr key={row.id}>
                            <td>{idx + 1}</td>
                            <td>
                              <strong className="pos-table-link">{row.name}</strong>
                              <div className="pos-table-subtitle">{row.barcode} • {row.category}</div>
                            </td>
                            <td>
                              <input
                                aria-label={`${row.name} quantity`}
                                className="pos-table-input pos-table-qty"
                                inputMode="numeric"
                                max={row.stock > 0 ? row.stock : 999}
                                min={1}
                                onChange={(e) => handleUpdateExchangeQty(row.id, Number(e.target.value))}
                                type="number"
                                value={row.qty}
                              />
                            </td>
                            <td>PKR {formatMoney(row.price)}</td>
                            <td>
                              <input
                                aria-label={`${row.name} discount`}
                                className="pos-table-input pos-table-discount"
                                inputMode="decimal"
                                min={0}
                                onChange={(e) => handleUpdateExchangeDiscount(row.id, Number(e.target.value))}
                                step="0.01"
                                type="number"
                                value={row.lineDiscount}
                              />
                            </td>
                            <td><strong>PKR {formatMoney(lineTotal)}</strong></td>
                            <td>
                              <button
                                className="icon-button icon-button-danger"
                                title="Remove exchange item"
                                type="button"
                                onClick={() => handleRemoveExchangeItem(row.id)}
                              >
                                <X className="icon-button-icon" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '18px', color: '#64748b', fontSize: '13px', background: '#f8fafc', borderRadius: '8px', marginTop: '12px' }}>
                    No exchange items added yet. Search a medicine above if customer wants replacement items, or proceed directly with return refund.
                  </div>
                )}
              </article>
            )}

            {/* Notes */}
            {selectedSale && activeReturnLines.length > 0 && (
              <div className="pos-form-block">
                <div className="pos-form-group">
                  <strong>Notes / Remarks (Optional)</strong>
                  <textarea
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter reason or additional details regarding this return/exchange transaction..."
                    value={notes}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Financial Summary & Action */}
          {selectedSale && activeReturnLines.length > 0 && (
            <div style={{ display: 'grid', gap: '20px', alignContent: 'start' }}>
              <article className="panel pos-panel pos-summary-card">
                <h2>Settlement Summary</h2>

                <div className="pos-summary-row" style={{ marginTop: '16px' }}>
                  <span>Total Return Value</span>
                  <strong className="pos-summary-danger">-PKR {formatMoney(totalReturnAmount)}</strong>
                </div>

                <div className="pos-summary-row">
                  <span>Total Exchange Value</span>
                  <strong style={{ color: '#2563eb' }}>+PKR {formatMoney(totalExchangeAmount)}</strong>
                </div>

                <div className="pos-summary-divider" />

                <div className="pos-summary-row pos-summary-total">
                  <span>
                    {settlementType === 'Customer Paid'
                      ? 'Net Customer Payment'
                      : settlementType === 'Refund'
                        ? 'Net Refund to Customer'
                        : 'Even Exchange'}
                  </span>
                  <strong
                    className={
                      settlementType === 'Customer Paid'
                        ? 'pos-summary-success'
                        : settlementType === 'Refund'
                          ? 'pos-summary-danger'
                          : 'pos-summary-accent'
                    }
                    style={{ fontSize: '24px' }}
                  >
                    PKR {formatMoney(Math.abs(netBalance))}
                  </strong>
                </div>

                {/* Settlement Method */}
                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '8px', color: '#1e293b' }}>
                    {settlementType === 'Refund' ? 'Refund Mode' : 'Payment Method'}
                  </label>
                  <select
                    className="pos-select"
                    onChange={(e) => setSettlementMethod(e.target.value as PosPaymentMethod)}
                    value={settlementMethod}
                    style={{ width: '100%', height: '46px', fontWeight: 700 }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                  </select>
                </div>

                {settlementType === 'Customer Paid' && settlementMethod === 'Cash' && (
                  <div style={{ marginTop: '14px', display: 'grid', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                      Cash Received (PKR)
                    </label>
                    <input
                      className="pos-table-input"
                      inputMode="decimal"
                      min={0}
                      onChange={(e) => setAmountReceived(Number(e.target.value))}
                      placeholder="e.g. 1000"
                      type="number"
                      value={amountReceived > 0 ? amountReceived : ''}
                      style={{ height: '46px', fontSize: '16px', fontWeight: 700 }}
                    />
                    {amountReceived >= netBalance && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '14px' }}>
                        <span>Change Return:</span>
                        <strong style={{ color: '#16a34a', fontSize: '16px' }}>PKR {formatMoney(changeReturn)}</strong>
                      </div>
                    )}
                  </div>
                )}

                {errorMessage && (
                  <div className="pos-payment-alert" style={{ marginTop: '16px' }}>
                    {errorMessage}
                  </div>
                )}

                <div style={{ marginTop: '24px' }}>
                  <button
                    className="button button-primary"
                    disabled={processing}
                    style={{
                      width: '100%',
                      minHeight: '56px',
                      fontSize: '16px',
                      fontWeight: 800,
                      justifyContent: 'center',
                      background: isExchange
                        ? 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)'
                        : 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                    }}
                    type="button"
                    onClick={handleProcessTransaction}
                  >
                    {processing ? (
                      'Processing...'
                    ) : (
                      <>
                        <CheckCircle2 style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        {isExchange ? 'Complete Return & Exchange' : 'Process Return & Refund'}
                      </>
                    )}
                  </button>
                </div>
              </article>
            </div>
          )}
        </section>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <>
          <div className="pos-history-toolbar">
            <div className="pos-search-row">
              <Search className="pos-search-icon" />
              <input
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                placeholder="Search Return ID, Original Invoice, or Customer..."
                value={historySearch}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {(['All', 'Return', 'Exchange'] as const).map((t) => (
                <button
                  className={`button${historyTypeFilter === t ? ' button-primary' : ' button-secondary'}`}
                  key={t}
                  type="button"
                  onClick={() => {
                    setHistoryTypeFilter(t);
                    setHistoryPage(1);
                  }}
                >
                  {t === 'All' ? 'All Transactions' : t === 'Return' ? 'Returns Only' : 'Exchanges Only'}
                </button>
              ))}
            </div>
          </div>

          <article className="panel pos-panel pos-table-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Return / Exc ID</th>
                  <th>Orig. Invoice</th>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Return Amount</th>
                  <th>Exchange Amount</th>
                  <th>Net Settlement</th>
                  <th>Date &amp; Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedHistoryRows.length === 0 ? (
                  <tr>
                    <td className="pos-cart-empty" colSpan={10}>
                      No return or exchange records found.
                    </td>
                  </tr>
                ) : (
                  pagedHistoryRows.map((row, index) => (
                    <tr key={row.id}>
                      <td>{startHistIndex + index}</td>
                      <td>
                        <strong className="pos-table-link">{row.returnNumber}</strong>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.originalInvoice}</span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${row.type === 'Exchange' ? 'status-active' : 'status-danger'}`}
                          style={{
                            background: row.type === 'Exchange' ? '#dbeafe' : '#fee2e2',
                            color: row.type === 'Exchange' ? '#1e40af' : '#991b1b',
                          }}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td>
                        <strong>{row.customer.name}</strong>
                        {row.customer.phone !== 'N/A' && <div style={{ fontSize: '11px', color: '#64748b' }}>{row.customer.phone}</div>}
                      </td>
                      <td>
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>PKR {formatMoney(row.totalReturnAmount)}</span>
                      </td>
                      <td>
                        <span style={{ color: '#2563eb', fontWeight: 700 }}>
                          {row.totalExchangeAmount > 0 ? `PKR ${formatMoney(row.totalExchangeAmount)}` : '-'}
                        </span>
                      </td>
                      <td>
                        <strong
                          style={{
                            color:
                              row.settlementType === 'Customer Paid'
                                ? '#16a34a'
                                : row.settlementType === 'Refund'
                                  ? '#dc2626'
                                  : '#475569',
                          }}
                        >
                          {row.settlementType === 'Customer Paid'
                            ? `+PKR ${formatMoney(row.netAmount)}`
                            : row.settlementType === 'Refund'
                              ? `-PKR ${formatMoney(Math.abs(row.netAmount))}`
                              : 'Even (PKR 0.00)'}
                        </strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>via {row.paymentMethod}</div>
                      </td>
                      <td style={{ fontSize: '12px' }}>{row.createdAt}</td>
                      <td>
                        <div className="pos-row-actions">
                          <button
                            className="icon-button"
                            title="View Voucher Details"
                            type="button"
                            onClick={() => setViewingRecord(row)}
                          >
                            <Eye className="icon-button-icon" />
                          </button>
                          <button
                            className="icon-button"
                            title="Print Voucher Receipt"
                            type="button"
                            onClick={() => printReturnReceipt(row, state.settings)}
                          >
                            <Printer className="icon-button-icon" />
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
                {historyRows.length === 0
                  ? 'Showing 0 entries'
                  : `Showing ${startHistIndex} to ${endHistIndex} of ${historyRows.length} entries`}
              </div>
              {historyPageCount > 1 && (
                <div className="pos-pagination">
                  <button
                    className="button button-secondary pos-pagination-button"
                    disabled={currentHistoryPage === 1}
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft />
                  </button>
                  {Array.from({ length: historyPageCount }, (_, i) => i + 1).map((p) => (
                    <button
                      className={`button pos-pagination-button${p === currentHistoryPage ? ' pos-pagination-button-active' : ' button-secondary'}`}
                      key={p}
                      type="button"
                      onClick={() => setHistoryPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="button button-secondary pos-pagination-button"
                    disabled={currentHistoryPage === historyPageCount}
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.min(historyPageCount, p + 1))}
                  >
                    <ChevronRight />
                  </button>
                </div>
              )}
            </div>
          </article>
        </>
      )}

      {/* Transaction Success / Receipt Modal */}
      {(processedRecord || viewingRecord) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            className="panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              background: '#fff',
            }}
          >
            {(() => {
              const active = processedRecord || viewingRecord;
              if (!active) return null;

              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: active.type === 'Exchange' ? '#dbeafe' : '#fee2e2', display: 'grid', placeItems: 'center', color: active.type === 'Exchange' ? '#2563eb' : '#dc2626' }}>
                        {active.type === 'Exchange' ? <RefreshCw style={{ width: '22px', height: '22px' }} /> : <RotateCcw style={{ width: '22px', height: '22px' }} />}
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '18px' }}>
                          {active.type === 'Exchange' ? 'Return & Exchange Voucher' : 'Return / Refund Voucher'}
                        </h2>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{active.returnNumber} • Orig: {active.originalInvoice}</span>
                      </div>
                    </div>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => {
                        setProcessedRecord(null);
                        setViewingRecord(null);
                      }}
                    >
                      <X />
                    </button>
                  </div>

                  {processedRecord && (
                    <div style={{ margin: '16px 0', padding: '12px 16px', borderRadius: '10px', background: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 style={{ width: '18px', height: '18px' }} />
                      Transaction completed &amp; inventory successfully updated!
                    </div>
                  )}

                  {/* Voucher Summary */}
                  <div style={{ marginTop: '16px', display: 'grid', gap: '12px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
                      <span style={{ color: '#64748b' }}>Customer:</span>
                      <strong>{active.customer.name} ({active.customer.phone})</strong>
                    </div>

                    {/* Returned Items */}
                    <div>
                      <strong style={{ display: 'block', marginBottom: '6px', color: '#991b1b', fontSize: '12px', textTransform: 'uppercase' }}>
                        Returned Items ({active.returnedItems.length})
                      </strong>
                      <div style={{ border: '1px solid #fee2e2', borderRadius: '8px', overflow: 'hidden' }}>
                        {active.returnedItems.map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: idx !== active.returnedItems.length - 1 ? '1px solid #fee2e2' : undefined, background: '#fff9f9' }}>
                            <div>
                              <strong>{it.name}</strong>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                Qty: {it.returnQty} {it.unit} @ PKR {formatMoney(it.price)} • {it.reason} {it.restock ? '• (Restocked)' : ''}
                              </div>
                            </div>
                            <strong style={{ color: '#dc2626' }}>-PKR {formatMoney(it.refundTotal)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exchanged Items */}
                    {active.exchangeItems.length > 0 && (
                      <div>
                        <strong style={{ display: 'block', marginBottom: '6px', color: '#1e40af', fontSize: '12px', textTransform: 'uppercase' }}>
                          Exchanged Items ({active.exchangeItems.length})
                        </strong>
                        <div style={{ border: '1px solid #dbeafe', borderRadius: '8px', overflow: 'hidden' }}>
                          {active.exchangeItems.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: idx !== active.exchangeItems.length - 1 ? '1px solid #dbeafe' : undefined, background: '#f8fbff' }}>
                              <div>
                                <strong>{it.name}</strong>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Qty: {it.qty} {it.unit} @ PKR {formatMoney(it.price)}
                                </div>
                              </div>
                              <strong style={{ color: '#2563eb' }}>+PKR {formatMoney(it.price * it.qty - it.lineDiscount)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Financials */}
                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'grid', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Total Returned Amount:</span>
                        <strong style={{ color: '#dc2626' }}>PKR {formatMoney(active.totalReturnAmount)}</strong>
                      </div>
                      {active.totalExchangeAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Total Exchanged Amount:</span>
                          <strong style={{ color: '#2563eb' }}>PKR {formatMoney(active.totalExchangeAmount)}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f1f5f9', borderRadius: '8px', marginTop: '4px' }}>
                        <strong>
                          {active.settlementType === 'Customer Paid'
                            ? 'Net Amount Paid By Customer:'
                            : active.settlementType === 'Refund'
                              ? 'Net Amount Refunded To Customer:'
                              : 'Even Exchange Settlement:'}
                        </strong>
                        <strong style={{ fontSize: '15px', color: active.settlementType === 'Customer Paid' ? '#16a34a' : '#dc2626' }}>
                          PKR {formatMoney(Math.abs(active.netAmount))}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', padding: '0 4px' }}>
                        <span>Payment / Refund Mode:</span>
                        <strong>{active.paymentMethod}</strong>
                      </div>
                      {active.notes && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', padding: '0 4px' }}>
                          <span>Notes:</span>
                          <span>{active.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => {
                        setProcessedRecord(null);
                        setViewingRecord(null);
                      }}
                    >
                      Close
                    </button>
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() => printReturnReceipt(active, state.settings)}
                    >
                      <Printer style={{ width: '18px', height: '18px', marginRight: '6px' }} />
                      Print Voucher Receipt
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
