'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeDollarSign,
  Banknote,
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Eye,
  Filter,
  ImageUp,
  Key,
  ListOrdered,
  Loader2,
  PenLine,
  Plus,
  Printer,
  RotateCcw,
  Save,
  ScanSearch,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Truck,
  Warehouse,
} from 'lucide-react';
import { sampleInvoices, type SampleInvoice } from '@/lib/sample-invoices';
import { ButtonLink, IconButton, StatCard } from '@/components/ui';
import { ToneBadge, type ToneBadgeTone } from '@/components/tone-badge';
import {
  addDaysIso,
  calculateLineTotal,
  formatPurchaseCurrency,
  formatPurchaseCurrencyLabel,
  formatPurchaseDate,
  formatPurchaseDateTime,
  purchaseExpenseTypes,
  purchasePaymentMethods,
  purchaseQuickActions,
  purchaseReturnReasons,
  roundMoney,
  summarizePurchaseLineItem,
  type PurchaseLineItem,
  type PurchaseOrder,
  type PurchaseOrderStatus,
  type PurchasePaymentMethod,
  type PurchaseReturn,
  type PurchaseReturnLine,
  type PurchaseSupplierStatus,
} from '@/lib/purchase-data';
import { parsePurchaseOcrText, formatConfidence } from '@/lib/purchase-parser';
import {
  getPurchaseDashboardStats,
  getPurchaseOrderById,
  getPurchasePaymentSegments,
  getPurchaseTrendSeries,
  usePurchaseStore,
} from '@/lib/purchase-state';
import { syncReceivedPurchaseItems, syncReturnedPurchaseItems } from '@/lib/purchase-sync';

type StatusTone = 'success' | 'warning' | 'info' | 'danger';

const orderStatusTone: Record<PurchaseOrderStatus, StatusTone> = {
  Received: 'success',
  Partial: 'warning',
  Pending: 'info',
  Cancelled: 'danger',
};

const paymentTone: Record<PurchasePaymentMethod, ToneBadgeTone> = {
  Cash: 'success',
  Credit: 'warning',
  'Bank Transfer': 'info',
  Card: 'neutral',
  'Mobile Wallet': 'info',
};

type SupplierForm = {
  name: string;
  phone: string;
  email: string;
  city: string;
  contactPerson: string;
  notes: string;
  status: PurchaseSupplierStatus;
};

type ReceiveRow = {
  id: string;
  medicine: string;
  orderedQty: number;
  receivedBefore: number;
  remainingQty: number;
  receiveQty: number;
  batchNo: string;
  expiryDate: string;
  purchasePrice: number;
};

type InventoryStockItem = {
  id: number;
  medicineName: string;
  stock?: number;
};

function makeChartPoints(values: number[]) {
  const maxValue = Math.max(...values, 1);
  const width = 410;
  const height = 190;
  const leftPadding = 12;
  const rightPadding = 10;
  const topPadding = 12;
  const bottomPadding = 18;
  const chartHeight = height - topPadding - bottomPadding;
  const step = values.length > 1 ? (width - leftPadding - rightPadding) / (values.length - 1) : 0;

  const coords = values.map((value, index) => {
    const x = leftPadding + index * step;
    const y = height - bottomPadding - (value / maxValue) * chartHeight;
    return { x, y };
  });

  const line = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPath = [
    `M ${leftPadding},${height - bottomPadding}`,
    ...coords.map((point) => `L ${point.x},${point.y}`),
    `L ${width - rightPadding},${height - bottomPadding}`,
    'Z',
  ].join(' ');
  return { line, areaPath, coords, width, height };
}

function buildLegendPalette() {
  return ['#2563eb', '#6d28ff', '#f97316', '#10b981', '#0ea5e9'];
}

function orderedQty(item: PurchaseLineItem) {
  return Math.max(0, Math.floor(Number(item.qty) || 0));
}

function receivedQty(item: PurchaseLineItem) {
  if (item.receiveQty === undefined) {
    return orderedQty(item);
  }
  return Math.max(0, Math.floor(Number(item.receiveQty) || 0));
}

function priorReceivedQty(item: PurchaseLineItem) {
  return item.receiveQty === undefined ? 0 : Math.min(orderedQty(item), receivedQty(item));
}

function cleanMedicineName(item: PurchaseLineItem) {
  return item.medicine.trim() || 'Unnamed Item';
}

function normalizeLookupName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function findInventoryStockItem(items: InventoryStockItem[], name: string) {
  const normalized = normalizeLookupName(name);
  if (!normalized) {
    return null;
  }

  return (
    items.find((item) => normalizeLookupName(item.medicineName) === normalized) ??
    items.find((item) => {
      const candidate = normalizeLookupName(item.medicineName);
      return candidate.length > 2 && (candidate.includes(normalized) || normalized.includes(candidate));
    }) ??
    null
  );
}

function buildBatchNo(order: PurchaseOrder, index: number) {
  const sequence = Number(order.orderNo.replace(/[^0-9]/g, '')) || index + 1;
  return `B-${String(sequence + index).padStart(4, '0')}`;
}

function buildEditableRows(order: PurchaseOrder) {
  return order.items.map((item, index) => {
    const ordered = orderedQty(item);
    const receivedBefore = priorReceivedQty(item);
    const remainingQty = Math.max(0, ordered - receivedBefore);

    return {
      id: item.id,
      medicine: item.medicine,
      orderedQty: ordered,
      receivedBefore,
      remainingQty,
      receiveQty: remainingQty,
      batchNo: item.batchNo ?? buildBatchNo(order, index),
      expiryDate: item.expiryDate ?? addDaysIso(order.orderDate, 365 * 2),
      purchasePrice: item.purchasePrice,
    };
  });
}

function buildReturnRows(order: PurchaseOrder) {
  return order.items.map((item) => ({
    id: item.id,
    medicine: item.medicine,
    receivedQty: receivedQty(item),
    returnQty: 0,
    reason: 'Damaged' as const,
  }));
}

function buildRecentOrders(orders: PurchaseOrder[]) {
  return [...orders]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 5);
}

function buildFilteredOrders(orders: PurchaseOrder[], query: string, status: string, payment: string) {
  const search = query.trim().toLowerCase();
  return [...orders]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .filter((order) => {
      if (status !== 'All' && order.status !== status) {
        return false;
      }
      if (payment !== 'All' && order.paymentMethod !== payment) {
        return false;
      }
      if (!search) {
        return true;
      }

      return [
        order.orderNo,
        order.invoiceReference,
        order.supplierName,
        order.shipmentDate,
        order.notes,
        order.items.map((item) => item.medicine).join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
}

function statusTone(status: PurchaseOrderStatus) {
  return orderStatusTone[status];
}

function paymentLabelTone(method: PurchasePaymentMethod): ToneBadgeTone {
  return paymentTone[method];
}

function currentDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function dateWithCurrentTime(dateValue: string) {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${dateValue || currentDateInputValue()}T${hours}:${minutes}:${seconds}`;
}

function lineItemKey(item: PurchaseLineItem) {
  return item.id || `${item.medicine}-${item.pack}-${item.qty}`;
}

function itemsCount(order: PurchaseOrder) {
  return order.items.reduce((sum, item) => sum + orderedQty(item), 0);
}

function createEmptySupplierForm(): SupplierForm {
  return {
    name: '',
    phone: '',
    email: '',
    city: 'Karachi',
    contactPerson: '',
    notes: '',
    status: 'Active',
  };
}

function createEmptyExpenseForm() {
  return {
    type: purchaseExpenseTypes[0],
    amount: '',
    date: '2019-01-01',
    notes: '',
  };
}

function formatPercentValue(value: number) {
  return `${roundMoney(Number(value) || 0).toFixed(2)}%`;
}

function formatLineDate(value?: string) {
  return value ? formatPurchaseDate(value) : '-';
}

function escapeReceiptHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, (character) => {
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

function splitReceiptDateTime(value: string) {
  const fallback = new Date();
  const parsed = new Date(value);
  const date = Number.isNaN(parsed.getTime()) ? fallback : parsed;
  return {
    date: date.toLocaleDateString('en-US'),
    time: date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

function purchaseReceiptTimestamp(order: PurchaseOrder) {
  return order.updatedAt || order.receivedAt || order.createdAt || dateWithCurrentTime(order.orderDate);
}

function buildPurchaseReceiptHtml(order: PurchaseOrder) {
  const invoice = order.invoiceReference || order.orderNo;
  const { date, time } = splitReceiptDateTime(purchaseReceiptTimestamp(order));
  const received = order.total;
  const change = 0;
  const rows = order.items
    .map((item) => {
      const summary = summarizePurchaseLineItem(item);
      const totalQty = summary.totalQty || orderedQty(item);
      const discount = roundMoney((Number(item.discount) || 0) + (Number(item.prodDiscountAmount) || 0));
      const lineTotal = calculateLineTotal(item);
      const productMeta = [item.itemCode, item.pack].filter(Boolean).join(' | ');
      const productLabel = productMeta
        ? `${cleanMedicineName(item)} (${productMeta})`
        : cleanMedicineName(item);

      return `
        <tr class="product-row">
          <td colspan="5">${escapeReceiptHtml(productLabel.toUpperCase())}</td>
        </tr>
        <tr class="detail-row">
          <td></td>
          <td class="qty">${escapeReceiptHtml(totalQty)}</td>
          <td class="rate">${escapeReceiptHtml(formatPurchaseCurrency(item.purchasePrice))}</td>
          <td class="disc">${escapeReceiptHtml(formatPurchaseCurrency(discount))}</td>
          <td class="total">${escapeReceiptHtml(formatPurchaseCurrency(lineTotal))}</td>
        </tr>
      `;
    })
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeReceiptHtml(invoice)}</title>
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
      .qty {
        width: 10mm;
        text-align: center;
      }
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
        <p class="logo-name">MEDICAL STORE</p>
        <p class="address">SHOP # 2, NEAR NOOR HOSPITAL, BLOCK 19,</p>
        <p class="address">AL NOOR SOCIETY, KARACHI</p>
      </div>
      <div class="receipt-title">CUSTOMER INVOICE</div>
      <div class="rule"></div>
      <div class="meta">
        <div>
          <div>Invoice:</div>
          <div>Date:</div>
          <div>Time:</div>
          <div>User:</div>
          <div>Customer: WALK-IN CUSTOMER</div>
        </div>
        <div class="right">
          <div><strong>${escapeReceiptHtml(invoice)}</strong></div>
          <div>${escapeReceiptHtml(date)}</div>
          <div>${escapeReceiptHtml(time)}</div>
          <div>Admin User</div>
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
        <tr><td>Gross Total</td><td>${escapeReceiptHtml(formatPurchaseCurrency(order.subtotal))}</td></tr>
        <tr><td>Discount (PKR)</td><td>${escapeReceiptHtml(formatPurchaseCurrency(order.discountTotal))}</td></tr>
        <tr class="grand"><td>Grand Total</td><td>${escapeReceiptHtml(formatPurchaseCurrency(order.total))}</td></tr>
      </table>
      <table class="cash-box">
        <tr><td>Cash Received</td><td>${escapeReceiptHtml(formatPurchaseCurrency(received))}</td></tr>
        <tr><td>Change Return</td><td>${escapeReceiptHtml(formatPurchaseCurrency(change))}</td></tr>
      </table>
      <div class="rule"></div>
      <div class="foot">
        <div>"No Return Or Exchange Without Receipt"</div>
        <div>"No Exchange After 3 Days Of Purchase"</div>
        <div>"No Cash Refund"</div>
        <div class="thanks">THANK YOU FOR YOUR VISIT</div>
      </div>
    </div>
  </body>
</html>`;
}

function printPurchaseReceipt(order: PurchaseOrder) {
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.style.opacity = '0';
  frame.setAttribute('aria-hidden', 'true');
  frame.srcdoc = buildPurchaseReceiptHtml(order);
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

function PurchaseLineItemCard({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: PurchaseLineItem;
  index: number;
  onUpdate: (itemId: string, patch: Partial<PurchaseLineItem>) => void;
  onRemove: (itemId: string) => void;
}) {
  const summary = summarizePurchaseLineItem(item);
  const discountBase = summary.baseAmount;
  const taxableBase = Math.max(
    0,
    discountBase - Math.max(0, Number(item.discount) || 0) - Math.max(0, Number(item.prodDiscountAmount) || 0),
  );

  return (
    <article className="section-panel purchase-line-card">
      <div className="settings-heading purchase-line-heading">
        <div>
          <h3>
            Line {index + 1}: {item.medicine.trim() || 'New Item'}
          </h3>
          <p>Enter invoice line details, tax values and scheme data here.</p>
        </div>
        <button className="icon-button icon-button-danger" type="button" onClick={() => onRemove(item.id)} title="Remove item">
          <Trash2 className="icon-button-icon" />
        </button>
      </div>

      <div className="purchase-line-section">
        <div className="settings-heading purchase-line-subheading">
          <div>
            <h4>Item Details</h4>
          </div>
        </div>
        <div className="form-fields three-cols">
          <label>
            <span>Item Code</span>
            <input
              onChange={(event) => onUpdate(item.id, { itemCode: event.target.value })}
              placeholder="ITEM001"
              value={item.itemCode}
            />
          </label>
          <label>
            <span>Pack</span>
            <input
              onChange={(event) => onUpdate(item.id, { pack: event.target.value })}
              placeholder="10's"
              value={item.pack}
            />
          </label>
          <label className="field-span-full">
            <span>Medicine Name</span>
            <input
              onChange={(event) => onUpdate(item.id, { medicine: event.target.value })}
              placeholder="Type or select medicine"
              value={item.medicine}
            />
          </label>
          <label>
            <span>Batch Number</span>
            <input
              onChange={(event) => onUpdate(item.id, { batchNo: event.target.value })}
              placeholder="Batch"
              value={item.batchNo ?? ''}
            />
          </label>
          <label>
            <span>MFG Date</span>
            <input
              onChange={(event) => onUpdate(item.id, { mfgDate: event.target.value })}
              type="date"
              value={item.mfgDate ?? ''}
            />
          </label>
          <label>
            <span>Expiry Date</span>
            <input
              onChange={(event) => onUpdate(item.id, { expiryDate: event.target.value })}
              type="date"
              value={item.expiryDate ?? ''}
            />
          </label>
        </div>
      </div>

      <div className="purchase-line-section">
        <div className="settings-heading purchase-line-subheading">
          <div>
            <h4>Quantity and Rates</h4>
          </div>
        </div>
        <div className="form-fields three-cols">
          <label>
            <span>Purch Qty</span>
            <input
              min="0"
              onChange={(event) => onUpdate(item.id, { qty: Number(event.target.value) })}
              type="number"
              value={item.qty}
            />
            {item.qty <= 0 ? <small style={{ color: '#b91c1c', fontWeight: 800 }}>⚠️ Req</small> : null}
          </label>
          <label>
            <span>Bonus</span>
            <input
              min="0"
              onChange={(event) => onUpdate(item.id, { bonusQty: Number(event.target.value) })}
              type="number"
              value={item.bonusQty}
            />
          </label>
          <label>
            <span>Total Qty</span>
            <input readOnly value={summary.totalQty} />
          </label>
          <label>
            <span>Unit Price (Rate)</span>
            <input
              min="0"
              onChange={(event) => onUpdate(item.id, { purchasePrice: Number(event.target.value) })}
              step="0.01"
              type="number"
              value={item.purchasePrice}
            />
          </label>
          <label>
            <span>Disc %</span>
            <input
              min="0"
              onChange={(event) => {
                const discountPercent = Number(event.target.value);
                const discount = roundMoney(Math.max(0, discountBase) * Math.max(0, discountPercent) / 100);
                onUpdate(item.id, { discountPercent, discount });
              }}
              step="0.01"
              type="number"
              value={item.discountPercent}
            />
          </label>
          <label>
            <span>GST %</span>
            <input
              min="0"
              onChange={(event) => {
                const gstPercent = Number(event.target.value);
                const salesTaxAmount = roundMoney(taxableBase * Math.max(0, gstPercent) / 100);
                onUpdate(item.id, { gstPercent, salesTaxAmount });
              }}
              step="0.01"
              type="number"
              value={item.gstPercent}
            />
          </label>
          <label>
            <span>F.Tax %</span>
            <input
              min="0"
              onChange={(event) => onUpdate(item.id, { fTaxPercent: Number(event.target.value) })}
              step="0.01"
              type="number"
              value={item.fTaxPercent}
            />
          </label>
          <label>
            <span>Non-ATL %</span>
            <input
              min="0"
              onChange={(event) => onUpdate(item.id, { nonAtlPercent: Number(event.target.value) })}
              step="0.01"
              type="number"
              value={item.nonAtlPercent}
            />
          </label>
          <label>
            <span>Adv.T %</span>
            <input
              min="0"
              onChange={(event) => {
                const advTaxPercent = Number(event.target.value);
                const aiTaxAmount = roundMoney(taxableBase * Math.max(0, advTaxPercent) / 100);
                onUpdate(item.id, { advTaxPercent, aiTaxAmount });
              }}
              step="0.01"
              type="number"
              value={item.advTaxPercent}
            />
          </label>
          <label>
            <span>ATL Status</span>
            <select onChange={(event) => onUpdate(item.id, { atlStatus: event.target.value as PurchaseLineItem['atlStatus'] })} value={item.atlStatus}>
              <option value="ATL">ATL</option>
              <option value="Non-ATL">Non-ATL</option>
            </select>
          </label>
        </div>
      </div>

      <div className="purchase-line-section">
        <div className="settings-heading purchase-line-subheading">
          <div>
            <h4>Amounts and Scheme</h4>
          </div>
        </div>
        <div className="form-fields three-cols">
          <label>
            <span>Net Amount</span>
            <input readOnly value={formatPurchaseCurrency(summary.netAmount)} />
          </label>
          <label>
            <span>Eff. Cost / Unit</span>
            <input readOnly value={formatPurchaseCurrency(summary.effectiveCostPerUnit)} />
          </label>
          <label className="field-span-full">
            <span>Remarks / Scheme</span>
            <textarea
              onChange={(event) => onUpdate(item.id, { remarks: event.target.value })}
              placeholder="e.g. 10% Off"
              rows={2}
              value={item.remarks}
            />
          </label>
          <label>
            <span>TP Value</span>
            <input
              min="0"
              onChange={(event) => onUpdate(item.id, { tpValue: Number(event.target.value) })}
              step="0.01"
              type="number"
              value={item.tpValue}
            />
          </label>
          <label>
            <span>MRP Value</span>
            <input
              min="0"
              onChange={(event) => onUpdate(item.id, { mrpValue: Number(event.target.value) })}
              step="0.01"
              type="number"
              value={item.mrpValue}
            />
          </label>
          <label>
            <span>INV Disc Amt</span>
            <input
              min="0"
              onChange={(event) => {
                const discount = Number(event.target.value);
                const discountPercent = discountBase > 0 ? roundMoney((Math.max(0, discount) / discountBase) * 100) : 0;
                onUpdate(item.id, { discount, discountPercent });
              }}
              step="0.01"
              type="number"
              value={item.discount}
            />
          </label>
          <label>
            <span>Prod Disc Amt</span>
            <input
              min="0"
              onChange={(event) => onUpdate(item.id, { prodDiscountAmount: Number(event.target.value) })}
              step="0.01"
              type="number"
              value={item.prodDiscountAmount}
            />
          </label>
          <label>
            <span>S.Tax Amt</span>
            <input
              min="0"
              onChange={(event) => {
                const salesTaxAmount = Number(event.target.value);
                const gstPercent = taxableBase > 0 ? roundMoney((Math.max(0, salesTaxAmount) / taxableBase) * 100) : 0;
                onUpdate(item.id, { salesTaxAmount, gstPercent });
              }}
              step="0.01"
              type="number"
              value={item.salesTaxAmount}
            />
          </label>
          <label>
            <span>A.I Tax Amt</span>
            <input
              min="0"
              onChange={(event) => {
                const aiTaxAmount = Number(event.target.value);
                const advTaxPercent = taxableBase > 0 ? roundMoney((Math.max(0, aiTaxAmount) / taxableBase) * 100) : 0;
                onUpdate(item.id, { aiTaxAmount, advTaxPercent });
              }}
              step="0.01"
              type="number"
              value={item.aiTaxAmount}
            />
          </label>
        </div>
      </div>

      <div className="purchase-line-summary-row">
        <div>
          <span>Item Base</span>
          <strong>{formatPurchaseCurrency(summary.baseAmount)}</strong>
        </div>
        <div>
          <span>Discount Total</span>
          <strong>{formatPurchaseCurrency(summary.discountAmount)}</strong>
        </div>
        <div>
          <span>Tax Total</span>
          <strong>{formatPurchaseCurrency(summary.taxAmount)}</strong>
        </div>
        <div>
          <span>Summary Net</span>
          <strong>{formatPurchaseCurrency(summary.netAmount)}</strong>
        </div>
        <div>
          <span>Rates</span>
          <strong>{formatPercentValue(item.discountPercent)} / {formatPercentValue(item.gstPercent)}</strong>
        </div>
        <div>
          <span>Dates</span>
          <strong>{formatLineDate(item.mfgDate)} - {formatLineDate(item.expiryDate)}</strong>
        </div>
      </div>
    </article>
  );
}

export function PurchaseDashboardWorkspace() {
  const { state } = usePurchaseStore();
  const stats = getPurchaseDashboardStats(state);
  const trend = getPurchaseTrendSeries(state);
  const paymentSegments = getPurchasePaymentSegments(state);
  const chart = makeChartPoints(trend.map((point) => point.value));
  const recentOrders = buildRecentOrders(state.orders);
  const palette = buildLegendPalette();

  return (
    <>
      <section className="module-stats-grid">
        <StatCard
          icon={BadgeDollarSign}
          label="Total Purchases"
          tone="green"
          value={formatPurchaseCurrencyLabel(stats.totalPurchases)}
          link={{ href: '/modules/purchases/list', label: 'View all orders' }}
        />
        <StatCard
          icon={ListOrdered}
          label="Total Orders"
          tone="blue"
          value={stats.totalOrders}
          link={{ href: '/modules/purchases/list', label: 'Open order list' }}
        />
        <StatCard
          icon={Warehouse}
          label="Total Items"
          tone="purple"
          value={stats.totalItems}
          link={{ href: '/modules/purchases/receive', label: 'Receive stock' }}
        />
        <StatCard
          icon={Truck}
          label="Total Suppliers"
          tone="orange"
          value={stats.totalSuppliers}
          link={{ href: '/modules/purchases/suppliers', label: 'Manage suppliers' }}
        />
      </section>

      <section className="module-dashboard-grid">
        <article className="module-panel module-sales-panel">
          <PanelTitle title="Purchase Trend" action="Last 6 Months" />
          <div className="module-chart-wrap">
            <div className="module-chart-scale">
              <span>{formatPurchaseCurrencyLabel(Math.max(...trend.map((point) => point.value), 1))}</span>
              <span>{formatPurchaseCurrencyLabel(Math.max(...trend.map((point) => point.value), 1) * 0.75)}</span>
              <span>{formatPurchaseCurrencyLabel(Math.max(...trend.map((point) => point.value), 1) * 0.5)}</span>
              <span>{formatPurchaseCurrencyLabel(Math.max(...trend.map((point) => point.value), 1) * 0.25)}</span>
              <span>0</span>
            </div>
            <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Purchase trend chart">
              <defs>
                <linearGradient id="purchaseTrendFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3f18c9" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#3f18c9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={chart.areaPath} fill="url(#purchaseTrendFill)" />
              <polyline
                points={chart.line}
                fill="none"
                stroke="#3f18c9"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              {chart.coords.map((point, index) => (
                <circle cx={point.x} cy={point.y} fill="#3f18c9" key={`${point.x}-${point.y}`} r="3.8" />
              ))}
            </svg>
          </div>
          <div className="module-chart-dates">
            {trend.map((point) => (
              <span key={point.label}>{point.label}</span>
            ))}
          </div>
        </article>

        <article className="module-panel">
          <PanelTitle title="Payment Breakdown" action="Mix" />
          <div className="module-donut-row">
            <div
              className="module-donut"
              style={{
                background: `conic-gradient(${paymentSegments
                  .map((segment, index) => {
                    const start =
                      paymentSegments.slice(0, index).reduce((sum, previous) => sum + previous.value, 0) /
                      Math.max(paymentSegments.reduce((sum, segmentValue) => sum + segmentValue.value, 0), 1);
                    const end = start + segment.value / Math.max(paymentSegments.reduce((sum, segmentValue) => sum + segmentValue.value, 0), 1);
                    return `${palette[index % palette.length]} ${Math.round(start * 100)}% ${Math.round(end * 100)}%`;
                  })
                  .join(', ')})`,
              }}
            />
            <div className="module-donut-legend">
              {paymentSegments.map((segment, index) => (
                <div key={segment.label}>
                  <i style={{ background: palette[index % palette.length] }} />
                  <span>{segment.label}</span>
                  <strong>{formatPurchaseCurrency(segment.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="module-panel">
        <PanelTitle title="Recent Purchases" action="View all" />
        <table className="module-transactions-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Order No.</th>
              <th>Supplier</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order, index) => (
              <tr key={order.id}>
                <td>{index + 1}</td>
                <td>{order.orderNo}</td>
                <td>{order.supplierName}</td>
                <td>{formatPurchaseDate(order.orderDate)}</td>
                <td>{formatPurchaseCurrency(order.total)}</td>
                <td>
                  <ToneBadge tone={statusTone(order.status)}>{order.status}</ToneBadge>
                </td>
                <td>
                  <Link className="table-link" href={`/modules/purchases/details/${order.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="module-reports-panel">
        <div className="module-reports-head">
          <div>
            <h2>Fast Access</h2>
            <p>Jump into the purchase workflow.</p>
          </div>
          <Link className="module-reports-link" href="/modules/purchases/quick-actions">
            Open Actions
          </Link>
        </div>
        <div className="module-reports-grid">
          {purchaseQuickActions.slice(0, 3).map((item) => {
            const Icon = item.icon;
            return (
              <Link className="module-report-card" href={item.href} key={item.title}>
                <span className={`module-report-icon module-report-icon-${item.tone}`}>
                  <Icon />
                </span>
                <strong>{item.title}</strong>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

export function PurchaseOrderListWorkspace() {
  const router = useRouter();
  const { state, loadOrderIntoDraft, updateOrderStatus } = usePurchaseStore();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PurchaseOrderStatus>('All');
  const [paymentFilter, setPaymentFilter] = useState<'All' | PurchasePaymentMethod>('All');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const orders = useMemo(() => buildFilteredOrders(state.orders, query, statusFilter, paymentFilter), [
    state.orders,
    query,
    statusFilter,
    paymentFilter,
  ]);

  const pageCount = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleOrders = orders.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <>
      <section className="section-hero-inline-actions">
        <label className="search-box">
          <Search className="button-icon" />
          <input
            aria-label="Search purchase orders"
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
            placeholder="Search purchase orders..."
            value={query}
          />
        </label>

        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value as typeof statusFilter);
          }}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Partial">Partial</option>
          <option value="Received">Received</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(event) => {
            setPage(1);
            setPaymentFilter(event.target.value as typeof paymentFilter);
          }}
        >
          <option value="All">All Payments</option>
          {purchasePaymentMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>

        <ButtonLink href="/modules/purchases/new" icon={Plus} variant="primary">
          New Purchase Order
        </ButtonLink>
      </section>

      <section className="table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Order No.</th>
              <th>Invoice Ref.</th>
              <th>Supplier</th>
              <th>Shipment Date</th>
              <th>Order Date</th>
              <th>Amount (PKR)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center' }}>
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              visibleOrders.map((order, index) => (
                <tr key={order.id}>
                  <td>{(safePage - 1) * pageSize + index + 1}</td>
                  <td>
                    <strong className="table-link">{order.orderNo}</strong>
                  </td>
                  <td>{order.invoiceReference || '-'}</td>
                  <td>{order.supplierName}</td>
                  <td>{formatPurchaseDate(order.shipmentDate)}</td>
                  <td>{formatPurchaseDate(order.orderDate)}</td>
                  <td>{formatPurchaseCurrency(order.total)}</td>
                  <td>
                    <ToneBadge tone={statusTone(order.status)}>{order.status}</ToneBadge>
                  </td>
                  <td>
                    <div className="row-actions">
                      <IconButton href={`/modules/purchases/details/${order.id}`} icon={Eye} label="View order" />
                      <button
                        className="icon-button"
                        title="Edit order"
                        type="button"
                        onClick={() => {
                          loadOrderIntoDraft(order.id);
                          router.push('/modules/purchases/new');
                        }}
                      >
                        <PenLine className="icon-button-icon" />
                      </button>
                      {order.status !== 'Received' && order.status !== 'Cancelled' ? (
                        <IconButton href={`/modules/purchases/receive?order=${order.id}`} icon={Truck} label="Receive order" />
                      ) : null}
                      {order.status !== 'Cancelled' ? (
                        <button
                          className="icon-button icon-button-danger"
                          title="Cancel order"
                          type="button"
                          onClick={() => updateOrderStatus(order.id, 'Cancelled', { cancelledAt: new Date().toISOString() })}
                        >
                          <Trash2 className="icon-button-icon" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <div className="table-footer">
        <span>
          Showing {orders.length ? (safePage - 1) * pageSize + 1 : 0} to {Math.min(safePage * pageSize, orders.length)} of {orders.length} entries
        </span>
        <div className="pagination">
          <button aria-label="Previous page" disabled={safePage === 1} type="button" onClick={() => setPage((value) => Math.max(1, value - 1))}>
            <ChevronLeft />
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 5).map((pageNumber) => (
            <button
              className={safePage === pageNumber ? 'active' : ''}
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            aria-label="Next page"
            disabled={safePage === pageCount}
            type="button"
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </>
  );
}

export function PurchaseNewOrderWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    state,
    draftTotals,
    patchDraft,
    setDraftSupplier,
    addDraftItem,
    updateDraftItem,
    removeDraftItem,
    loadOrderIntoDraft,
    saveDraftAsOrder,
    resetDraft,
  } = usePurchaseStore();
  const [message, setMessage] = useState('');
  const loadedOrderRef = useRef<string | null>(null);
  const orderId = searchParams.get('order');
  const currentOrder = state.draft.editingOrderId ? getPurchaseOrderById(state, state.draft.editingOrderId) : null;
  const targetOrderId = currentOrder?.id ?? (state.draft.editingOrderId ? state.draft.editingOrderId : `purchase-${state.nextOrderSequence}`);

  useEffect(() => {
    if (!orderId || loadedOrderRef.current === orderId) {
      return;
    }

    loadedOrderRef.current = orderId;
    loadOrderIntoDraft(orderId);
  }, [orderId, loadOrderIntoDraft]);

  const supplierOptions = state.suppliers.map((supplier) => ({
    id: supplier.id,
    name: supplier.name,
  }));

  const handleSave = () => {
    const items = state.draft.items.filter((item) => item.medicine.trim() && item.qty > 0);
    if (!state.draft.supplierName.trim()) {
      setMessage('Please select or type a supplier first.');
      return;
    }
    if (!items.length) {
      setMessage('Please add at least one medicine item with quantity.');
      return;
    }

    saveDraftAsOrder();
    setMessage('Purchase order saved successfully.');
    router.push(`/modules/purchases/details/${targetOrderId}`);
  };

  return (
    <div className="backup-create-grid">
      <section className="section-panel backup-create-form">
        <div className="settings-heading">
          <h2>{state.draft.editingOrderId ? 'Edit Purchase Order' : 'Create Purchase Order'}</h2>
          <ToneBadge tone={state.draft.source === 'OCR' ? 'warning' : 'primary'}>
            {state.draft.source === 'OCR' ? 'OCR Draft' : 'Manual Draft'}
          </ToneBadge>
        </div>

        <div className="form-fields three-cols">
          <label className="field-span-full">
            <span>Supplier Entity / Choose Supplier</span>
            <select
              value={state.draft.supplierId ?? ''}
              onChange={(event) => {
                const selectedId = Number(event.target.value);
                const supplier = supplierOptions.find((item) => item.id === selectedId) ?? null;
                setDraftSupplier(supplier?.id ?? null, supplier?.name ?? state.draft.supplierName);
              }}
            >
              <option value="">Choose Supplier</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-span-full">
            <span>Supplier Entity</span>
            <input
              onChange={(event) => setDraftSupplier(null, event.target.value)}
              placeholder="Type or create supplier..."
              value={state.draft.supplierName}
            />
          </label>
          <label>
            <span>Invoice Reference</span>
            <input
              onChange={(event) => patchDraft({ invoiceReference: event.target.value })}
              placeholder="e.g. INV-2024-001"
              value={state.draft.invoiceReference}
            />
          </label>
          <label>
            <span>Shipment Date</span>
            <input onChange={(event) => patchDraft({ shipmentDate: event.target.value })} type="date" value={state.draft.shipmentDate} />
          </label>
          <label>
            <span>Order Date</span>
            <input onChange={(event) => patchDraft({ orderDate: event.target.value })} type="date" value={state.draft.orderDate} />
          </label>
          <label>
            <span>Expected Date</span>
            <input
              onChange={(event) => patchDraft({ expectedDate: event.target.value })}
              type="date"
              value={state.draft.expectedDate}
            />
          </label>
          <label className="field-span-full">
            <span>Payment Method</span>
            <select
              value={state.draft.paymentMethod}
              onChange={(event) => patchDraft({ paymentMethod: event.target.value as PurchasePaymentMethod })}
            >
              {purchasePaymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
          <label className="field-span-full">
            <span>Notes (Optional)</span>
            <textarea
              onChange={(event) => patchDraft({ notes: event.target.value })}
              placeholder="Add notes here..."
              rows={4}
              value={state.draft.notes}
            />
          </label>
        </div>

        <div className="settings-heading">
          <div>
            <h2>Inventory Line Items</h2>
            <p>Total Items: {draftTotals.itemCount}</p>
          </div>
          <div className="row-actions">
            <ButtonLink href="/modules/purchases/ocr" icon={ScanSearch} variant="secondary">
              OCR Auto Fill
            </ButtonLink>
            <button className="button button-outline" type="button" onClick={() => addDraftItem()}>
              <Plus className="button-icon" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        <div className="purchase-line-list">
          {state.draft.items.map((item, index) => (
            <PurchaseLineItemCard
              index={index}
              item={item}
              key={lineItemKey(item)}
              onRemove={removeDraftItem}
              onUpdate={updateDraftItem}
            />
          ))}
        </div>

        <div className="backup-create-actions">
          <button className="button button-ghost" type="button" onClick={() => {
            resetDraft();
            setMessage('Draft cleared.');
          }}>
            Cancel
          </button>
          <button className="button button-primary" type="button" onClick={handleSave}>
            <Save className="button-icon" />
            <span>Save Order</span>
          </button>
        </div>

        {message ? <div className="backup-note-box"><strong>Status</strong><p>{message}</p></div> : null}
      </section>

      <aside className="section-panel backup-summary-panel">
        <div className="section-heading">
          <div>
            <h2>Order Summary</h2>
          </div>
        </div>

        <div className="backup-info-list">
          <div className="backup-info-row">
            <span>Invoice Ref.</span>
            <strong>{state.draft.invoiceReference || 'Auto generated'}</strong>
          </div>
          <div className="backup-info-row">
            <span>Shipment Date</span>
            <strong>{formatPurchaseDate(state.draft.shipmentDate)}</strong>
          </div>
          <div className="backup-info-row">
            <span>Draft Items</span>
            <strong>{draftTotals.itemCount}</strong>
          </div>
          <div className="backup-info-row">
            <span>Subtotal</span>
            <strong>{formatPurchaseCurrencyLabel(draftTotals.subtotal)}</strong>
          </div>
          <div className="backup-info-row">
            <span>Discount</span>
            <strong>{formatPurchaseCurrencyLabel(draftTotals.discountTotal)}</strong>
          </div>
          <div className="backup-info-row">
            <span>Total</span>
            <strong>{formatPurchaseCurrencyLabel(draftTotals.total)}</strong>
          </div>
          <div className="backup-info-row">
            <span>Draft Mode</span>
            <strong>{state.draft.source}</strong>
          </div>
          <div className="backup-info-row">
            <span>Next Order No.</span>
            <strong>{state.draft.editingOrderId ? currentOrder?.orderNo ?? 'N/A' : `PO-${String(state.nextOrderSequence).padStart(5, '0')}`}</strong>
          </div>
          {state.draft.source === 'OCR' ? (
            <>
              <div className="backup-info-row">
                <span>OCR Confidence</span>
                <strong>{formatConfidence(state.draft.ocrConfidence)}</strong>
              </div>
              <div className="backup-info-row">
                <span>OCR File</span>
                <strong>{state.draft.ocrFileName || 'Uploaded image'}</strong>
              </div>
            </>
          ) : null}
        </div>

        <div className="backup-note-box">
          <strong>Tip</strong>
          <p>Blank rows are ignored when you save the order.</p>
          <p>Use OCR when you want the image to auto-fill the draft first.</p>
        </div>
      </aside>
    </div>
  );
}

export function PurchaseOrderDetailsWorkspace({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { state, loadOrderIntoDraft, updateOrderStatus } = usePurchaseStore();
  const order = getPurchaseOrderById(state, orderId);

  if (!order) {
    return (
      <section className="section-panel">
        <h2>Order not found</h2>
        <p>The requested purchase order does not exist anymore.</p>
        <ButtonLink href="/modules/purchases/list" icon={ArrowLeft} variant="secondary">
          Back to list
        </ButtonLink>
      </section>
    );
  }

  const totalItems = itemsCount(order);

  return (
    <>
      <div className="backup-detail-grid">
        <section className="section-panel backup-summary-panel">
          <div className="section-heading">
            <div>
              <h2>Order Information</h2>
            </div>
          </div>

          <div className="backup-info-list">
            <div className="backup-info-row">
              <span>Order No.</span>
              <strong>{order.orderNo}</strong>
            </div>
            <div className="backup-info-row">
              <span>Invoice Ref.</span>
              <strong>{order.invoiceReference || '-'}</strong>
            </div>
            <div className="backup-info-row">
              <span>Supplier</span>
              <strong>{order.supplierName}</strong>
            </div>
            <div className="backup-info-row">
              <span>Shipment Date</span>
              <strong>{formatPurchaseDate(order.shipmentDate)}</strong>
            </div>
            <div className="backup-info-row">
              <span>Order Date</span>
              <strong>{formatPurchaseDate(order.orderDate)}</strong>
            </div>
            <div className="backup-info-row">
              <span>Expected Date</span>
              <strong>{formatPurchaseDate(order.expectedDate)}</strong>
            </div>
            <div className="backup-info-row">
              <span>Payment Method</span>
              <strong>
                <ToneBadge tone={paymentLabelTone(order.paymentMethod)}>{order.paymentMethod}</ToneBadge>
              </strong>
            </div>
            <div className="backup-info-row">
              <span>Status</span>
              <strong>
                <ToneBadge tone={statusTone(order.status)}>{order.status}</ToneBadge>
              </strong>
            </div>
            <div className="backup-info-row">
              <span>Items</span>
              <strong>{totalItems}</strong>
            </div>
            <div className="backup-info-row">
              <span>Total Amount</span>
              <strong>{formatPurchaseCurrencyLabel(order.total)}</strong>
            </div>
            <div className="backup-info-row">
              <span>Notes</span>
              <strong>{order.notes || '-'}</strong>
            </div>
          </div>

          <div className="backup-note-box">
            <strong>Order History</strong>
            <p>Created {formatPurchaseDateTime(order.createdAt)}</p>
            <p>Last updated {formatPurchaseDateTime(order.updatedAt)}</p>
          </div>
        </section>

        <section className="section-panel">
          <div className="section-heading">
            <div>
              <h2>Items</h2>
            </div>
          </div>

          <section className="table-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Medicine</th>
                  <th>Qty</th>
                  <th>Bonus</th>
                  <th>Total Qty</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Tax</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={lineItemKey(item)}>
                    <td>{item.itemCode || '-'}</td>
                    <td>
                      <strong>{cleanMedicineName(item)}</strong>
                      <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
                        {item.pack || '-'} | Batch {item.batchNo || '-'}
                      </div>
                    </td>
                    <td>{orderedQty(item)}</td>
                    <td>{item.bonusQty}</td>
                    <td>{summarizePurchaseLineItem(item).totalQty}</td>
                    <td>{formatPurchaseCurrency(item.purchasePrice)}</td>
                    <td>{formatPurchaseCurrency(item.discount + item.prodDiscountAmount)}</td>
                    <td>{formatPurchaseCurrency(item.salesTaxAmount + item.aiTaxAmount)}</td>
                    <td>{formatPurchaseCurrency(calculateLineTotal(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="backup-info-list" style={{ marginTop: '18px' }}>
            <div className="backup-info-row">
              <span>Subtotal</span>
              <strong>{formatPurchaseCurrencyLabel(order.subtotal)}</strong>
            </div>
            <div className="backup-info-row">
              <span>Discount</span>
              <strong>{formatPurchaseCurrencyLabel(order.discountTotal)}</strong>
            </div>
            <div className="backup-info-row">
              <span>Total</span>
              <strong>{formatPurchaseCurrencyLabel(order.total)}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="backup-create-actions">
        <button
          className="button button-outline"
          type="button"
          onClick={() => {
            loadOrderIntoDraft(order.id);
            router.push('/modules/purchases/new');
          }}
        >
          <PenLine className="button-icon" />
          <span>Edit Order</span>
        </button>
        <ButtonLink href={`/modules/purchases/receive?order=${order.id}`} icon={Truck} variant="success">
          Mark as Received
        </ButtonLink>
        <button
          className="button button-danger"
          type="button"
          onClick={() => updateOrderStatus(order.id, 'Cancelled', { cancelledAt: new Date().toISOString() })}
        >
          <ShieldAlert className="button-icon" />
          <span>Cancel Order</span>
        </button>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => printPurchaseReceipt(order)}
        >
          <Printer className="button-icon" />
          <span>Print</span>
        </button>
      </div>
    </>
  );
}

export function PurchaseReceiveWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, updateOrderStatus } = usePurchaseStore();
  const searchOrderId = searchParams.get('order') ?? '';
  const [orderId, setOrderId] = useState(searchOrderId);
  const [receiveDate, setReceiveDate] = useState('2019-01-01');

  useEffect(() => {
    setReceiveDate(currentDateInputValue());
  }, []);
  const receiveOrders = state.orders.filter((order) => order.status === 'Pending' || order.status === 'Partial');
  const firstReceiveOrderId = receiveOrders[0]?.id ?? '';
  const selectedOrderId = orderId || searchOrderId || firstReceiveOrderId;
  const selectedOrder = getPurchaseOrderById(state, selectedOrderId) ?? null;
  const rowsOrderRef = useRef<string | null>(null);
  const [rows, setRows] = useState<ReceiveRow[]>(
    () => (selectedOrder ? buildEditableRows(selectedOrder) : []),
  );
  const [inventoryItems, setInventoryItems] = useState<InventoryStockItem[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadInventory() {
      try {
        const response = await fetch('/api/modules/inventory', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { data?: InventoryStockItem[] };
        if (!cancelled) {
          setInventoryItems(Array.isArray(payload.data) ? payload.data : []);
        }
      } catch {
        if (!cancelled) {
          setInventoryItems([]);
        }
      }
    }

    void loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedOrder) {
      if (rowsOrderRef.current !== null) {
        rowsOrderRef.current = null;
        setRows([]);
      }
      return;
    }

    if (rowsOrderRef.current !== selectedOrder.id) {
      rowsOrderRef.current = selectedOrder.id;
      setRows(buildEditableRows(selectedOrder));
    }
  }, [selectedOrder]);

  const handleRowChange = (itemId: string, patch: Partial<ReceiveRow>) => {
    setRows((current) => current.map((row) => (row.id === itemId ? { ...row, ...patch } : row)));
  };

  const handleComplete = async () => {
    if (!selectedOrder) {
      setMessage('Please choose a purchase order first.');
      return;
    }

    const validRows = rows.filter((row) => Math.max(0, Math.floor(Number(row.receiveQty) || 0)) > 0);
    if (!validRows.length) {
      setMessage('Please enter receive quantity for at least one item.');
      return;
    }

    const overReceived = validRows.find((row) => row.receiveQty > row.remainingQty);
    if (overReceived) {
      setMessage(`${overReceived.medicine} receive quantity remaining stock se zyada hai.`);
      return;
    }

    const itemsToSync = selectedOrder.items.flatMap((item) => {
      const row = validRows.find((entry) => entry.id === item.id);
      if (!row) {
        return [];
      }

      return [
        {
          ...item,
          receiveQty: row.receiveQty,
          batchNo: row.batchNo,
          expiryDate: row.expiryDate,
        },
      ];
    });

    if (!itemsToSync.length) {
      setMessage('No matching purchase items were found to receive.');
      return;
    }

    try {
      const syncResult = await syncReceivedPurchaseItems({
        order: selectedOrder,
        items: itemsToSync,
        receiveDate,
      });

      const nextStatus: PurchaseOrderStatus =
        selectedOrder.items.every((item) => {
          const row = validRows.find((entry) => entry.id === item.id);
          const cumulativeReceived = row ? row.receivedBefore + row.receiveQty : priorReceivedQty(item);
          return cumulativeReceived >= orderedQty(item);
        }) ? 'Received' : 'Partial';

      updateOrderStatus(selectedOrder.id, nextStatus, {
        receivedAt: dateWithCurrentTime(receiveDate),
        items: selectedOrder.items.map((item) => {
          const row = validRows.find((entry) => entry.id === item.id);
          if (!row) {
            return item;
          }

          return {
            ...item,
            receiveQty: row.receivedBefore + row.receiveQty,
            batchNo: row.batchNo,
            expiryDate: row.expiryDate,
          };
        }),
      });

      setMessage(`Inventory synced. Updated ${syncResult.updated}, created ${syncResult.created}, batches ${syncResult.batches}.`);
      setInventoryItems((current) =>
        rows.reduce((items, row) => {
          const received = Math.max(0, Math.floor(Number(row.receiveQty) || 0));
          if (!received) {
            return items;
          }

          const existing = findInventoryStockItem(items, row.medicine);
          if (!existing) {
            return [
              ...items,
              {
                id: Math.max(0, ...items.map((item) => item.id)) + 1,
                medicineName: row.medicine,
                stock: received,
              },
            ];
          }

          return items.map((item) =>
            item.id === existing.id
              ? {
                  ...item,
                  stock: Math.max(0, Number(item.stock) || 0) + received,
                }
              : item,
          );
        }, current),
      );
      router.push(`/modules/purchases/details/${selectedOrder.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to complete receive.');
    }
  };

  return (
    <div className="backup-create-grid">
      <section className="section-panel backup-create-form">
        <div className="form-fields two-cols">
          <label>
            <span>Order No.</span>
            <select
              value={selectedOrderId}
              onChange={(event) => {
                const nextOrderId = event.target.value;
                const nextOrder = getPurchaseOrderById(state, nextOrderId) ?? null;
                setOrderId(nextOrderId);
                rowsOrderRef.current = nextOrder?.id ?? null;
                setRows(nextOrder ? buildEditableRows(nextOrder) : []);
              }}
            >
              <option value="">Select Order</option>
              {receiveOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNo} - {order.supplierName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Receive Date</span>
            <input onChange={(event) => setReceiveDate(event.target.value)} type="date" value={receiveDate} />
          </label>
        </div>

        <div className="settings-heading">
          <h2>Receive Items</h2>
          <ToneBadge tone={selectedOrder ? 'success' : 'warning'}>{selectedOrder ? selectedOrder.status : 'No Order Selected'}</ToneBadge>
        </div>

        <section className="table-panel">
          <table className="data-table purchase-item-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Current Stock</th>
                <th>Ordered Qty</th>
                <th>Already Received</th>
                <th>Remaining</th>
                <th>Receive Qty</th>
                <th>After Receive</th>
                <th>Batch No.</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const inventoryItem = findInventoryStockItem(inventoryItems, row.medicine);
                const currentStock = Math.max(0, Number(inventoryItem?.stock) || 0);
                const receiveQty = Math.max(0, Math.floor(Number(row.receiveQty) || 0));
                const afterReceive = currentStock + receiveQty;

                return (
                  <tr key={row.id}>
                    <td>{row.medicine}</td>
                    <td>
                      {inventoryItem ? currentStock : (
                        <span style={{ color: 'var(--muted)', fontWeight: 800 }}>New</span>
                      )}
                    </td>
                    <td>{row.orderedQty}</td>
                    <td>{row.receivedBefore}</td>
                    <td>{row.remainingQty}</td>
                    <td>
                      <input
                        className="purchase-table-input"
                        disabled={row.remainingQty <= 0}
                        max={row.remainingQty}
                        min="0"
                        onChange={(event) => handleRowChange(row.id, { receiveQty: Number(event.target.value) })}
                        type="number"
                        value={row.receiveQty}
                      />
                    </td>
                    <td>
                      <strong>{afterReceive}</strong>
                    </td>
                    <td>
                      <input
                        className="purchase-table-input"
                        onChange={(event) => handleRowChange(row.id, { batchNo: event.target.value })}
                        value={row.batchNo}
                      />
                    </td>
                    <td>
                      <input
                        className="purchase-table-input"
                        onChange={(event) => handleRowChange(row.id, { expiryDate: event.target.value })}
                        type="date"
                        value={row.expiryDate}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <div className="backup-create-actions">
          <ButtonLink href="/modules/purchases/list" icon={ListOrdered} variant="ghost">
            Cancel
          </ButtonLink>
          <button className="button button-primary" type="button" onClick={handleComplete}>
            <CircleCheck className="button-icon" />
            <span>Complete Receive</span>
          </button>
        </div>

        {message ? (
          <div className="backup-note-box">
            <strong>Status</strong>
            <p>{message}</p>
          </div>
        ) : null}
      </section>

      <aside className="section-panel backup-summary-panel">
        <div className="section-heading">
          <div>
            <h2>Receive Summary</h2>
          </div>
        </div>

        <div className="backup-info-list">
          <div className="backup-info-row">
            <span>Selected Order</span>
            <strong>{selectedOrder?.orderNo ?? '-'}</strong>
          </div>
          <div className="backup-info-row">
            <span>Supplier</span>
            <strong>{selectedOrder?.supplierName ?? '-'}</strong>
          </div>
          <div className="backup-info-row">
            <span>Pending Orders</span>
            <strong>{receiveOrders.length}</strong>
          </div>
          <div className="backup-info-row">
            <span>Receive Date</span>
            <strong>{formatPurchaseDate(receiveDate)}</strong>
          </div>
          <div className="backup-info-row">
            <span>Items</span>
            <strong>{rows.length}</strong>
          </div>
        </div>

        <div className="backup-note-box">
          <strong>Inventory Sync</strong>
          <p>Complete Receive par existing medicine quantity mein receive qty add hoti hai.</p>
          <p>Agar medicine inventory mein nahi hai to woh automatically new medicine ban jati hai.</p>
        </div>
      </aside>
    </div>
  );
}

export function PurchaseReturnsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, addReturn, updateOrderStatus } = usePurchaseStore();
  const searchOrderId = searchParams.get('order') ?? '';
  const [orderId, setOrderId] = useState(searchOrderId);
  const [returnDate, setReturnDate] = useState('2019-01-01');

  useEffect(() => {
    setReturnDate(currentDateInputValue());
  }, []);
  const returnOrders = state.orders.filter((order) => order.status === 'Received' || order.status === 'Partial');
  const firstReturnOrderId = returnOrders[0]?.id ?? '';
  const selectedOrderId = orderId || searchOrderId || firstReturnOrderId;
  const selectedOrder = getPurchaseOrderById(state, selectedOrderId) ?? null;
  const [rows, setRows] = useState<Array<{ id: string; medicine: string; receivedQty: number; returnQty: number; reason: PurchaseReturnLine['reason'] }>>(
    () => (selectedOrder ? buildReturnRows(selectedOrder) : []),
  );
  const [message, setMessage] = useState('');

  const handleRowChange = (itemId: string, patch: Partial<(typeof rows)[number]>) => {
    setRows((current) => current.map((row) => (row.id === itemId ? { ...row, ...patch } : row)));
  };

  const handleSubmit = async () => {
    if (!selectedOrder) {
      setMessage('Please choose a received purchase order first.');
      return;
    }

    const validRows = rows.filter((row) => Math.max(0, Math.floor(Number(row.returnQty) || 0)) > 0);
    if (!validRows.length) {
      setMessage('Please set return quantity for at least one item.');
      return;
    }

    try {
      await syncReturnedPurchaseItems({
        items: validRows.map((row) => ({
          medicine: row.medicine,
          returnQty: row.returnQty,
        })),
      });

      const record: Omit<PurchaseReturn, 'id'> = {
        orderId: selectedOrder.id,
        orderNo: selectedOrder.orderNo,
        returnDate,
        status: 'Submitted',
        notes: `Return generated for ${selectedOrder.orderNo}`,
        items: validRows.map((row) => ({
          id: row.id,
          medicine: row.medicine,
          receivedQty: row.receivedQty,
          returnQty: row.returnQty,
          reason: row.reason,
        })),
        totalReturned: validRows.reduce((sum, row) => sum + row.returnQty, 0),
      };

      addReturn(record);
      updateOrderStatus(selectedOrder.id, selectedOrder.status, { updatedAt: new Date().toISOString() });
      setMessage('Return submitted successfully.');
      router.push(`/modules/purchases/details/${selectedOrder.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit return.');
    }
  };

  return (
    <div className="backup-create-grid">
      <section className="section-panel backup-create-form">
        <div className="form-fields two-cols">
          <label>
            <span>Order No.</span>
            <select
              value={selectedOrderId}
              onChange={(event) => {
                const nextOrderId = event.target.value;
                const nextOrder = getPurchaseOrderById(state, nextOrderId) ?? null;
                setOrderId(nextOrderId);
                setRows(nextOrder ? buildReturnRows(nextOrder) : []);
              }}
            >
              <option value="">Select Order</option>
              {returnOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNo} - {order.supplierName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Return Date</span>
            <input onChange={(event) => setReturnDate(event.target.value)} type="date" value={returnDate} />
          </label>
        </div>

        <div className="settings-heading">
          <h2>Return Items</h2>
          <ToneBadge tone={selectedOrder ? 'warning' : 'info'}>{selectedOrder ? selectedOrder.status : 'No Order Selected'}</ToneBadge>
        </div>

        <section className="table-panel">
          <table className="data-table purchase-item-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Received Qty</th>
                <th>Return Qty</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.medicine}</td>
                  <td>{row.receivedQty}</td>
                  <td>
                    <input
                      className="purchase-table-input"
                      min="0"
                      onChange={(event) => handleRowChange(row.id, { returnQty: Number(event.target.value) })}
                      type="number"
                      value={row.returnQty}
                    />
                  </td>
                  <td>
                    <select
                      className="purchase-table-input"
                      onChange={(event) => handleRowChange(row.id, { reason: event.target.value as PurchaseReturnLine['reason'] })}
                      value={row.reason}
                    >
                      {purchaseReturnReasons.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="backup-create-actions">
          <ButtonLink href="/modules/purchases/list" icon={ListOrdered} variant="ghost">
            Cancel
          </ButtonLink>
          <button className="button button-primary" type="button" onClick={handleSubmit}>
            <RotateCcw className="button-icon" />
            <span>Submit Return</span>
          </button>
        </div>

        {message ? (
          <div className="backup-note-box">
            <strong>Status</strong>
            <p>{message}</p>
          </div>
        ) : null}
      </section>

      <aside className="section-panel backup-summary-panel">
        <div className="section-heading">
          <div>
            <h2>Return Summary</h2>
          </div>
        </div>

        <div className="backup-info-list">
          <div className="backup-info-row">
            <span>Selected Order</span>
            <strong>{selectedOrder?.orderNo ?? '-'}</strong>
          </div>
          <div className="backup-info-row">
            <span>Supplier</span>
            <strong>{selectedOrder?.supplierName ?? '-'}</strong>
          </div>
          <div className="backup-info-row">
            <span>Selectable Orders</span>
            <strong>{returnOrders.length}</strong>
          </div>
          <div className="backup-info-row">
            <span>Return Date</span>
            <strong>{formatPurchaseDate(returnDate)}</strong>
          </div>
          <div className="backup-info-row">
            <span>Items with Return</span>
            <strong>{rows.filter((row) => row.returnQty > 0).length}</strong>
          </div>
        </div>

        <div className="backup-note-box">
          <strong>Inventory Sync</strong>
          <p>Returned quantities are deducted from the inventory so your stock stays accurate.</p>
        </div>
      </aside>
    </div>
  );
}

export function PurchaseExpensesWorkspace() {
  const { state, addExpense } = usePurchaseStore();
  const [form, setForm] = useState(createEmptyExpenseForm());
  const [message, setMessage] = useState('');
  const [monthKey, setMonthKey] = useState('2019-01');

  useEffect(() => {
    const today = currentDateInputValue();
    setMonthKey(today.slice(0, 7));
    setForm((current) => ({ ...current, date: today }));
  }, []);

  const totalExpenses = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyExpenses = state.expenses.filter((expense) => expense.date.startsWith(monthKey));

  const handleSave = () => {
    if (!form.amount || Number(form.amount) <= 0) {
      setMessage('Please enter a valid expense amount.');
      return;
    }

    addExpense({
      type: form.type,
      amount: Number(form.amount),
      date: form.date,
      notes: form.notes,
    });
    setForm(createEmptyExpenseForm());
    setMessage('Expense saved successfully.');
  };

  return (
    <div className="backup-create-grid">
      <section className="section-panel backup-create-form">
        <div className="form-fields">
          <label className="field-span-full">
            <span>Expense Type</span>
            <select onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} value={form.type}>
              {purchaseExpenseTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="field-span-full">
            <span>Amount (PKR)</span>
            <input min="0" onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} type="number" value={form.amount} />
          </label>
          <label className="field-span-full">
            <span>Date</span>
            <input onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} type="date" value={form.date} />
          </label>
          <label className="field-span-full">
            <span>Notes (Optional)</span>
            <textarea onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Add notes here..." rows={4} value={form.notes} />
          </label>
        </div>

        <div className="backup-create-actions">
          <button className="button button-ghost" type="button" onClick={() => setForm(createEmptyExpenseForm())}>
            Cancel
          </button>
          <button className="button button-primary" type="button" onClick={handleSave}>
            <Banknote className="button-icon" />
            <span>Save Expense</span>
          </button>
        </div>

        {message ? (
          <div className="backup-note-box">
            <strong>Status</strong>
            <p>{message}</p>
          </div>
        ) : null}
      </section>

      <aside className="section-panel backup-summary-panel">
        <div className="section-heading">
          <div>
            <h2>Expense Summary</h2>
          </div>
        </div>

        <div className="backup-info-list">
          <div className="backup-info-row">
            <span>Total Expenses</span>
            <strong>{formatPurchaseCurrencyLabel(totalExpenses)}</strong>
          </div>
          <div className="backup-info-row">
            <span>This Month</span>
            <strong>{formatPurchaseCurrencyLabel(monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0))}</strong>
          </div>
          <div className="backup-info-row">
            <span>Entries</span>
            <strong>{state.expenses.length}</strong>
          </div>
        </div>

        <section className="table-panel" style={{ marginTop: '18px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {state.expenses.slice(0, 5).map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.type}</td>
                  <td>{formatPurchaseCurrencyLabel(expense.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </aside>
    </div>
  );
}

export function PurchaseSuppliersWorkspace() {
  const { state, addSupplier, updateSupplier, deleteSupplier } = usePurchaseStore();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(createEmptySupplierForm());
  const [message, setMessage] = useState('');

  const suppliers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return [...state.suppliers].sort((left, right) => right.id - left.id);
    }

    return [...state.suppliers]
      .sort((left, right) => right.id - left.id)
      .filter((supplier) =>
        [supplier.name, supplier.phone, supplier.city, supplier.contactPerson, supplier.email]
          .join(' ')
          .toLowerCase()
          .includes(term),
      );
  }, [search, state.suppliers]);

  const activeCount = state.suppliers.filter((supplier) => supplier.status === 'Active').length;
  const inactiveCount = state.suppliers.filter((supplier) => supplier.status === 'Inactive').length;

  const resetForm = () => {
    setEditingId(null);
    setForm(createEmptySupplierForm());
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setMessage('Please enter supplier name.');
      return;
    }

    if (editingId) {
      updateSupplier(editingId, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        contactPerson: form.contactPerson.trim(),
        notes: form.notes.trim(),
        status: form.status,
      });
      setMessage('Supplier updated successfully.');
      resetForm();
      return;
    }

    addSupplier({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      city: form.city.trim(),
      contactPerson: form.contactPerson.trim(),
      notes: form.notes.trim(),
      status: form.status,
    });
    setMessage('Supplier added successfully.');
    resetForm();
  };

  return (
    <>
      <section className="module-stats-grid">
        <StatCard icon={Truck} label="Total Suppliers" tone="blue" value={state.suppliers.length} />
        <StatCard icon={CircleCheck} label="Active Suppliers" tone="green" value={activeCount} />
        <StatCard icon={CircleAlert} label="Inactive Suppliers" tone="orange" value={inactiveCount} />
        <StatCard icon={BadgeDollarSign} label="Outstanding Balance" tone="purple" value={formatPurchaseCurrencyLabel(state.suppliers.reduce((sum, supplier) => sum + supplier.balance, 0))} />
      </section>

      <div className="backup-create-grid">
        <section className="section-panel backup-create-form">
          <div className="settings-heading">
            <h2>{editingId ? 'Edit Supplier' : 'Add Supplier'}</h2>
            <ToneBadge tone={editingId ? 'warning' : 'primary'}>{editingId ? 'Editing' : 'New'}</ToneBadge>
          </div>

          <div className="form-fields two-cols">
            <label className="field-span-full">
              <span>Supplier Name</span>
              <input onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
            </label>
            <label>
              <span>Phone</span>
              <input onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} value={form.phone} />
            </label>
            <label>
              <span>Email</span>
              <input onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} value={form.email} />
            </label>
            <label>
              <span>City</span>
              <input onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} value={form.city} />
            </label>
            <label>
              <span>Contact Person</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, contactPerson: event.target.value }))}
                value={form.contactPerson}
              />
            </label>
            <label className="field-span-full">
              <span>Status</span>
              <select onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as 'Active' | 'Inactive' }))} value={form.status}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <label className="field-span-full">
              <span>Notes</span>
              <textarea onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={4} value={form.notes} />
            </label>
          </div>

          <div className="backup-create-actions">
            <button className="button button-ghost" type="button" onClick={resetForm}>
              Cancel
            </button>
            <button className="button button-primary" type="button" onClick={handleSave}>
              <Save className="button-icon" />
              <span>{editingId ? 'Update Supplier' : 'Add Supplier'}</span>
            </button>
          </div>

          {message ? (
            <div className="backup-note-box">
              <strong>Status</strong>
              <p>{message}</p>
            </div>
          ) : null}
        </section>

        <aside className="section-panel backup-summary-panel">
          <div className="section-heading">
            <div>
              <h2>Supplier List</h2>
            </div>
          </div>

          <div className="section-hero-inline-actions" style={{ justifyContent: 'flex-start' }}>
            <label className="search-box">
              <Search className="button-icon" />
              <input
                aria-label="Search suppliers"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search supplier..."
                value={search}
              />
            </label>
            <ButtonLink href="/modules/purchases/quick-actions" icon={Filter} variant="secondary">
              Quick Actions
            </ButtonLink>
          </div>

          <section className="table-panel" style={{ marginTop: '18px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Supplier</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center' }}>
                      No suppliers found.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier, index) => (
                    <tr key={supplier.id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{supplier.name}</strong>
                        <div style={{ color: 'var(--muted)', fontSize: '12px' }}>{supplier.city}</div>
                      </td>
                      <td>{supplier.phone}</td>
                      <td>
                        <ToneBadge tone={supplier.status === 'Active' ? 'success' : 'danger'}>{supplier.status}</ToneBadge>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            type="button"
                            title="Edit supplier"
                            onClick={() => {
                              setEditingId(supplier.id);
                              setForm({
                                name: supplier.name,
                                phone: supplier.phone,
                                email: supplier.email,
                                city: supplier.city,
                                contactPerson: supplier.contactPerson,
                                notes: supplier.notes,
                                status: supplier.status,
                              });
                            }}
                          >
                            <PenLine className="icon-button-icon" />
                          </button>
                          <button
                            className="icon-button"
                            type="button"
                            title="Toggle status"
                            onClick={() => updateSupplier(supplier.id, { status: supplier.status === 'Active' ? 'Inactive' : 'Active' })}
                          >
                            <RotateCcw className="icon-button-icon" />
                          </button>
                          <button
                            className="icon-button icon-button-danger"
                            type="button"
                            title="Delete supplier"
                            onClick={() => {
                              if (window.confirm(`Delete ${supplier.name}?`)) {
                                deleteSupplier(supplier.id);
                              }
                            }}
                          >
                            <Trash2 className="icon-button-icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </aside>
      </div>
    </>
  );
}

export function PurchaseOcrWorkspace() {
  const { state, patchDraft, setDraftSupplier, replaceDraftItems } = usePurchaseStore();
  const [file, setFile] = useState<File | null>(null);
  const [sampleImage, setSampleImage] = useState<string>('');
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof parsePurchaseOcrText> | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Upload an invoice image, choose a sample below, or enter your Gemini API key for instant AI extraction.');

  const uploadedPreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  const activePreviewUrl = sampleImage || uploadedPreviewUrl;

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (uploadedPreviewUrl) {
        URL.revokeObjectURL(uploadedPreviewUrl);
      }
    };
  }, [uploadedPreviewUrl]);

  const saveApiKey = (key: string) => {
    const trimmed = key.trim();
    setGeminiApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('gemini_api_key', trimmed);
      setMessage('Gemini API key saved! Live AI extraction is now active.');
    } else {
      localStorage.removeItem('gemini_api_key');
      setMessage('Gemini API key removed.');
    }
  };

  const applyParsedDraft = (result: ReturnType<typeof parsePurchaseOcrText>, sourceFileName: string) => {
    patchDraft({
      supplierName: result.supplierName || state.draft.supplierName,
      invoiceReference: result.invoiceReference || state.draft.invoiceReference,
      shipmentDate: result.shipmentDate || result.orderDate || state.draft.shipmentDate,
      orderDate: result.orderDate || result.shipmentDate || state.draft.orderDate,
      expectedDate: result.expectedDate || state.draft.expectedDate,
      paymentMethod: result.paymentMethod,
      notes: result.notes || state.draft.notes,
      source: 'OCR',
      ocrText: result.rawText,
      ocrFileName: sourceFileName,
      ocrConfidence: result.confidence,
      editingOrderId: null,
    });
    if (result.supplierName) {
      const supplier = state.suppliers.find((item) => item.name.trim().toLowerCase() === result.supplierName.trim().toLowerCase());
      setDraftSupplier(supplier?.id ?? null, result.supplierName);
    }
    if (result.items.length) {
      replaceDraftItems(result.items);
    }
  };

  const handleSelectSample = (sample: SampleInvoice) => {
    setSelectedSampleId(sample.id);
    setFile(null);
    setSampleImage(sample.image);
    setRawText(sample.parsed.rawText);
    setParsed(sample.parsed);
    applyParsedDraft(sample.parsed, sample.title);
    setMessage(`Loaded sample invoice: ${sample.title}. Extracted ${sample.itemCount} products with all batches and expiries!`);
  };

  const runOcr = async () => {
    if (!file && !rawText.trim()) {
      setMessage('Please upload an image, select a sample invoice, or paste text.');
      return;
    }

    if (file) {
      setBusy(true);
      setProgress(10);
      setSampleImage('');
      setSelectedSampleId('');

      try {
        // Try Gemini Vision API first if API key is provided
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const imageBase64 = await base64Promise;
        setProgress(30);

        const res = await fetch('/api/modules/purchases/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            mimeType: file.type || 'image/jpeg',
            apiKey: geminiApiKey || undefined,
          }),
        });

        const data = await res.json();

        if (data.success && data.parsed) {
          setRawText(data.parsed.rawText || '');
          setParsed(data.parsed);
          applyParsedDraft(data.parsed, file.name);
          setMessage(`AI extraction complete via Gemini Vision. Confidence ${formatConfidence(data.parsed.confidence)}. (${data.parsed.items.length} items, ${data.parsed.expiriesDetected} expiries detected)`);
          return;
        }

        // If API says requiresKey or failed, fallback to local Tesseract
        setMessage('Processing via local OCR engine...');
        setProgress(40);
        const tesseract = await import('tesseract.js');
        const result = await tesseract.recognize(file, 'eng', {
          logger: (entry) => {
            if (typeof entry.progress === 'number') {
              setProgress(Math.round(40 + entry.progress * 55));
            }
          },
        });

        const text = result.data.text || '';
        setRawText(text);
        const parsedText = parsePurchaseOcrText(text);
        setParsed(parsedText);
        applyParsedDraft(parsedText, file.name);
        setMessage(`Local OCR complete. Confidence ${formatConfidence(parsedText.confidence)}. Tip: For 100% accuracy on dense invoices, enter a Gemini API Key above.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'OCR failed. You can paste extracted text or choose a sample.');
      } finally {
        setBusy(false);
        setProgress(0);
      }
      return;
    }

    // Text parsing
    const parsedText = parsePurchaseOcrText(rawText);
    setParsed(parsedText);
    applyParsedDraft(parsedText, 'pasted-text');
    setMessage(`Draft auto-filled from text. Confidence ${formatConfidence(parsedText.confidence)}.`);
  };

  return (
    <div className="backup-detail-grid">
      <section className="section-panel backup-summary-panel">
        <div className="settings-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>OCR Scanner & AI Auto Fill</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Extracts supplier, invoice #, products, quantities, prices, batches, and expiry dates.
            </p>
          </div>
          <ToneBadge tone="warning">AI Vision Ready</ToneBadge>
        </div>

        {/* Gemini API Key Toggle & Card */}
        <div style={{ margin: '14px 0', padding: '12px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowKeyInput(!showKeyInput)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key style={{ width: '16px', height: '16px', color: geminiApiKey ? '#16a34a' : '#64748b' }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                Gemini Vision API Key: {geminiApiKey ? <span style={{ color: '#16a34a' }}>● Active</span> : <span style={{ color: '#64748b' }}>Optional (Enter key)</span>}
              </span>
            </div>
            <button type="button" style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {showKeyInput ? 'Hide' : 'Configure Key'}
            </button>
          </div>
          {showKeyInput ? (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
              <input
                type="password"
                placeholder="Enter your Gemini API key (e.g. AIzaSy...)"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <button
                type="button"
                className="button button-primary"
                onClick={() => saveApiKey(geminiApiKey)}
                style={{ minHeight: '38px', padding: '0 14px', fontSize: '12px' }}
              >
                Save
              </button>
            </div>
          ) : null}
        </div>

        {/* Quick Load Sample Invoices */}
        <div style={{ margin: '16px 0 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Sparkles style={{ width: '15px', height: '15px', color: '#7c3aed' }} />
            <strong style={{ fontSize: '13px', color: '#334155' }}>Test With Sample Distributor Invoices:</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            {sampleInvoices.map((sample, idx) => {
              const isSelected = selectedSampleId === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                    background: isSelected ? '#f5f3ff' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#7c3aed' : '#1e293b' }}>
                      Sample {idx + 1}
                    </span>
                    {isSelected ? <CheckCircle style={{ width: '14px', height: '14px', color: '#7c3aed' }} /> : null}
                  </div>
                  <strong style={{ fontSize: '12px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                    {sample.manufacturer.replace(/\(PVT\)\s*LIMITED/i, '').trim()}
                  </strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Inv #{sample.invoiceNo} • {sample.itemCount} items
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="ocr-dropzone">
          <input
            accept="image/*"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              setFile(selectedFile);
              setSelectedSampleId('');
              setSampleImage('');
            }}
            type="file"
          />
          <span className="ocr-dropzone-icon">
            <ImageUp />
          </span>
          <strong>Drop or choose an invoice image</strong>
          <span>PNG, JPG or WEBP works best.</span>
        </label>

        {activePreviewUrl ? (
          <div className="ocr-preview" style={{ marginTop: '14px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <Image alt="OCR preview" className="ocr-preview-image" height={900} src={activePreviewUrl} unoptimized width={1600} />
          </div>
        ) : null}

        <label className="field-span-full" style={{ display: 'grid', gap: '8px', marginTop: '18px' }}>
          <span>Or paste OCR text here</span>
          <textarea onChange={(event) => setRawText(event.target.value)} placeholder="Paste scanned text here..." rows={8} value={rawText} />
        </label>

        <div className="backup-create-actions">
          <ButtonLink href="/modules/purchases/new" icon={ListOrdered} variant="secondary">
            Open Manual Form
          </ButtonLink>
          <button className="button button-primary" disabled={busy} type="button" onClick={runOcr}>
            {busy ? <Loader2 className="button-icon" /> : <ScanSearch className="button-icon" />}
            <span>{busy ? `Scanning ${progress}%` : 'Scan & Auto Fill'}</span>
          </button>
        </div>

        {message ? (
          <div className="backup-note-box" style={{ marginTop: '14px' }}>
            <strong>Status</strong>
            <p>{message}</p>
          </div>
        ) : null}
      </section>

      <aside className="section-panel backup-summary-panel">
        <div className="section-heading">
          <div>
            <h2>OCR Preview</h2>
          </div>
        </div>

        <div className="backup-info-list">
          <div className="backup-info-row">
            <span>Supplier</span>
            <strong>{parsed?.supplierName || state.draft.supplierName || '-'}</strong>
          </div>
          <div className="backup-info-row">
            <span>Order No.</span>
            <strong>{parsed?.orderNo || 'Auto generated on save'}</strong>
          </div>
          <div className="backup-info-row">
            <span>Invoice Ref.</span>
            <strong>{parsed?.invoiceReference || state.draft.invoiceReference || '-'}</strong>
          </div>
          <div className="backup-info-row">
            <span>Order Date</span>
            <strong>{parsed?.orderDate ? formatPurchaseDate(parsed.orderDate) : '-'}</strong>
          </div>
          <div className="backup-info-row">
            <span>Shipment Date</span>
            <strong>{parsed?.shipmentDate ? formatPurchaseDate(parsed.shipmentDate) : '-'}</strong>
          </div>
          <div className="backup-info-row">
            <span>Expected Date</span>
            <strong>{parsed?.expectedDate ? formatPurchaseDate(parsed.expectedDate) : '-'}</strong>
          </div>
          <div className="backup-info-row">
            <span>Confidence</span>
            <strong>{parsed ? formatConfidence(parsed.confidence) : '-'}</strong>
          </div>
          <div className="backup-info-row">
            <span>Items Detected</span>
            <strong>{parsed?.items.length ?? 0}</strong>
          </div>
          <div className="backup-info-row">
            <span>Expiry Detected</span>
            <strong style={{ color: (parsed?.expiriesDetected ?? 0) > 0 ? '#16a34a' : 'inherit' }}>
              {parsed ? `${parsed.expiriesDetected} / ${parsed.items.length}` : '-'}
            </strong>
          </div>
          <div className="backup-info-row">
            <span>Batch Detected</span>
            <strong>{parsed ? `${parsed.batchesDetected} / ${parsed.items.length}` : '-'}</strong>
          </div>
        </div>

        <section className="table-panel" style={{ marginTop: '18px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {(parsed?.items ?? []).map((item) => {
                const today = new Date().toISOString().slice(0, 10);
                const isExpired = item.expiryDate && item.expiryDate < today;
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.medicine}</div>
                      {item.pack ? <small style={{ color: '#64748b' }}>{item.pack}</small> : null}
                    </td>
                    <td>
                      {item.batchNo ? (
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', fontSize: '12px', fontWeight: 600 }}>
                          {item.batchNo}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                    <td>
                      {item.expiryDate ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: isExpired ? '#fee2e2' : '#dcfce7',
                            color: isExpired ? '#dc2626' : '#15803d',
                          }}
                        >
                          {formatPurchaseDate(item.expiryDate)}
                          {isExpired ? ' (EXPIRED)' : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Not detected</span>
                      )}
                    </td>
                    <td>{item.qty}</td>
                    <td>{formatPurchaseCurrencyLabel(calculateLineTotal(item))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {parsed?.warnings.length ? (
          <div className="backup-note-box">
            <strong>Warnings</strong>
            {parsed.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}

        <div className="backup-note-box">
          <strong>Next Step</strong>
          <p>Open the manual form to review the auto-filled draft and save the purchase order.</p>
        </div>
      </aside>
    </div>
  );
}

function PanelTitle({ title, action }: { title: string; action: string }) {
  return (
    <div className="module-panel-title">
      <h2>{title}</h2>
      <span className="module-panel-action-label">{action}</span>
    </div>
  );
}
