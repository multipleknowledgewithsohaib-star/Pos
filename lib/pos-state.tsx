'use client';

import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { buildDemoCompletedSales } from '@/lib/demo-seed.mjs';
import {
  posCustomers,
  type PosCustomer,
  type PosReturnItem,
  type PosExchangeItem,
  type PosReturnExchangeRecord,
} from '@/lib/pos-data';
import { posMedicineCatalog, type PosMedicine } from '@/lib/pos-catalog';

import { readAuthSession } from '@/lib/auth-session';
import {
  DEFAULT_GATEWAY_SETTINGS,
  createGatewayTransactionId,
  createPaymentReference,
  mapLegacyPaymentMethod,
  sanitizeGatewaySettings,
  type PosGatewaySettings,
} from '@/lib/pos-payment-gateway';

/** Returns a localStorage key unique to the currently logged-in user. */
function getPosStorageKey(): string {
  if (typeof window === 'undefined') return 'pharma-pos-state-v8';
  const session = readAuthSession();
  const emailSlug = session?.email
    ? `-${session.email.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`
    : '';
  return `pharma-pos-state-v8${emailSlug}`;
}

const POS_LEGACY_STORAGE_KEYS = [
  'pharma-pos-state-v7',
  'pharma-pos-state-v6',
  'pharma-pos-state-v5',
  'pharma-pos-state-v4',
  'pharma-pos-state-v3',
  'pharma-pos-state-v2',
  'pharma-pos-state-v1',
  'pharma-pos-state',
  'pharmacy-pos-state',
  'pos-state',
];
const POS_PERSISTENCE_ATTEMPTS = [
  { completedSales: Number.POSITIVE_INFINITY, heldSales: Number.POSITIVE_INFINITY, keepCart: true },
  { completedSales: 7500, heldSales: 120, keepCart: true },
  { completedSales: 500, heldSales: 75, keepCart: true },
  { completedSales: 100, heldSales: 25, keepCart: true },
  { completedSales: 25, heldSales: 10, keepCart: false },
  { completedSales: 0, heldSales: 0, keepCart: false },
] as const;

export type PosPaymentMethod = 'Cash' | 'Bank Transfer' | 'Card' | 'JazzCash' | 'EasyPaisa';
export type PosPaymentStatus = 'Completed' | 'Pending' | 'Failed';
export type PosDiscountType = 'amount' | 'percentage';
export type PosTaxType = 'amount' | 'percentage';

export type PosDraftCustomer = Pick<PosCustomer, 'name' | 'phone' | 'address' | 'note' | 'email' | 'customerId'>;

export type PosCartLine = {
  id: string;
  medicineId: number | null;
  name: string;
  barcode: string;
  batchNo?: string;
  category: string;
  unit: string;
  price: number;
  qty: number;
  lineDiscount: number;
  stock: number;
};

export type PosDraftState = {
  customer: PosDraftCustomer;
  discountType: PosDiscountType;
  discountValue: number;
  taxType: PosTaxType;
  taxValue: number;
  paymentMethod: PosPaymentMethod;
  amountReceived: number;
  notes: string;
  payerMobile: string;
  bankReference: string;
  cardReference: string;
};

export type PosSettings = {
  enablePos: boolean;
  defaultPaymentMethod: PosPaymentMethod;
  autoPrintReceipt: boolean;
  askCustomerDetails: boolean;
  enableDiscount: boolean;
  enableTax: boolean;
  receiptTitle: string;
  receiptFooter: string;
};

const DEFAULT_POS_SETTINGS: PosSettings = {
  enablePos: true,
  defaultPaymentMethod: 'Cash',
  autoPrintReceipt: false,
  askCustomerDetails: true,
  enableDiscount: true,
  enableTax: true,
  receiptTitle: 'FnS & CO.',
  receiptFooter: 'Warranty Under Section 23(1)(I) of the Drugs Act 1976.',
};

export type PosSaleRecord = PosDraftState & {
  id: string;
  invoice: string;
  status: 'Held' | 'Completed';
  items: PosCartLine[];
  itemsCount: number;
  subtotal: number;
  itemDiscountTotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  paymentReference?: string;
  gatewayTransactionId?: string;
  paymentStatus?: PosPaymentStatus;
  changeAmount?: number;
};

export type PosTotals = {
  subtotal: number;
  itemDiscountTotal: number;
  saleDiscountAmount: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
};

export type PosState = {
  cart: PosCartLine[];
  draft: PosDraftState;
  settings: PosSettings;
  gatewaySettings: PosGatewaySettings;
  customers: PosDraftCustomer[];
  heldSales: PosSaleRecord[];
  completedSales: PosSaleRecord[];
  lastCompletedSale: PosSaleRecord | null;
  returnsAndExchanges: PosReturnExchangeRecord[];
  lastReturnExchange: PosReturnExchangeRecord | null;
  nextHoldNumber: number;
  nextInvoiceNumber: number;
  nextReturnNumber: number;
};

type PosAction =
  | { type: 'replace_state'; state: PosState }
  | { type: 'add_medicine'; medicine: PosMedicine }
  | { type: 'update_line_qty'; lineId: string; qty: number }
  | { type: 'update_line_price'; lineId: string; price: number }
  | { type: 'update_line_discount'; lineId: string; discount: number }
  | { type: 'remove_line'; lineId: string }
  | { type: 'clear_cart' }
  | { type: 'set_customer'; customer: PosDraftCustomer }
  | { type: 'add_customer'; customer: PosDraftCustomer }
  | { type: 'update_customer'; customerIndex: number; customer: PosDraftCustomer }
  | { type: 'delete_customer'; customerIndex: number }
  | { type: 'set_discount_type'; discountType: PosDiscountType }
  | { type: 'set_discount_value'; value: number }
  | { type: 'set_tax_type'; taxType: PosTaxType }
  | { type: 'set_tax_value'; value: number }
  | { type: 'set_payment_method'; paymentMethod: PosPaymentMethod }
  | { type: 'set_amount_received'; value: number }
  | { type: 'set_payer_mobile'; value: string }
  | { type: 'set_bank_reference'; value: string }
  | { type: 'set_card_reference'; value: string }
  | { type: 'set_notes'; notes: string }
  | { type: 'update_settings'; patch: Partial<PosSettings> }
  | { type: 'update_gateway_settings'; patch: Partial<PosGatewaySettings> }
  | { type: 'hold_current_sale' }
  | { type: 'restore_held_sale'; invoice: string }
  | { type: 'delete_held_sale'; invoice: string }
  | { type: 'clear_held_sales' }
  | { type: 'set_last_completed_sale'; sale: PosSaleRecord | null }
  | {
      type: 'complete_sale_with_payment';
      payment: {
        paymentReference: string;
        gatewayTransactionId: string;
        paymentStatus: PosPaymentStatus;
        changeAmount: number;
      };
    }
  | { type: 'complete_sale' }
  | { type: 'process_return_exchange'; record: PosReturnExchangeRecord }
  | { type: 'set_last_return_exchange'; record: PosReturnExchangeRecord | null };

type PosContextValue = {
  state: PosState;
  totals: PosTotals;
  draftSalePreview: PosSaleRecord | null;
  addMedicine: (medicine: PosMedicine) => void;
  updateLineQty: (lineId: string, qty: number) => void;
  updateLinePrice: (lineId: string, price: number) => void;
  updateLineDiscount: (lineId: string, discount: number) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;
  setCustomer: (customer: PosDraftCustomer) => void;
  addCustomer: (customer: PosDraftCustomer) => void;
  updateCustomer: (customerIndex: number, customer: PosDraftCustomer) => void;
  deleteCustomer: (customerIndex: number) => void;
  setDiscountType: (discountType: PosDiscountType) => void;
  setDiscountValue: (value: number) => void;
  setTaxType: (taxType: PosTaxType) => void;
  setTaxValue: (value: number) => void;
  setPaymentMethod: (paymentMethod: PosPaymentMethod) => void;
  setAmountReceived: (value: number) => void;
  setPayerMobile: (value: string) => void;
  setBankReference: (value: string) => void;
  setCardReference: (value: string) => void;
  setNotes: (notes: string) => void;
  updateSettings: (patch: Partial<PosSettings>) => void;
  updateGatewaySettings: (patch: Partial<PosGatewaySettings>) => void;
  holdCurrentSale: () => void;
  restoreHeldSale: (invoice: string) => void;
  deleteHeldSale: (invoice: string) => void;
  clearHeldSales: () => void;
  setLastCompletedSale: (sale: PosSaleRecord | null) => void;
  completeSale: () => void;
  completeSaleWithPayment: (payment: {
    paymentReference: string;
    gatewayTransactionId: string;
    paymentStatus: PosPaymentStatus;
    changeAmount: number;
  }) => void;
  processReturnExchange: (record: PosReturnExchangeRecord) => void;
  setLastReturnExchange: (record: PosReturnExchangeRecord | null) => void;
};

const PosContext = createContext<PosContextValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeNumber(value: unknown, fallback = 0) {
  const next = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function safeMoneyNumber(value: unknown, fallback = 0) {
  if (typeof value === 'string') {
    return safeNumber(value.replace(/[^0-9.-]+/g, ''), fallback);
  }

  return safeNumber(value, fallback);
}

function formatShortDateTime(date: Date) {
  const datePart = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart}, ${timePart}`;
}

export function formatMoney(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatInvoiceNumber(number: number) {
  return `INV-${String(number).padStart(5, '0')}`;
}

export function formatHoldNumber(number: number) {
  return `HOLD-${String(number).padStart(4, '0')}`;
}

export function formatReturnNumber(number: number, type: 'Return' | 'Exchange' = 'Return') {
  const prefix = type === 'Exchange' ? 'EXC' : 'RET';
  return `${prefix}-${String(number).padStart(5, '0')}`;
}

function createCustomer(customer: PosCustomer): PosDraftCustomer {
  return {
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    email: customer.email,
    customerId: customer.customerId,
    note: customer.note,
  };
}

const fallbackWalkInCustomer: PosCustomer = {
  name: 'Walk-in Customer',
  phone: 'N/A',
  address: 'N/A',
  note: 'Walk-in',
};

const walkInCustomer = createCustomer(posCustomers[0] ?? fallbackWalkInCustomer);
const defaultCustomers = posCustomers.map(createCustomer).slice(0, 15);

function createEmptyDraft(
  customer: PosDraftCustomer = walkInCustomer,
  settings: PosSettings = DEFAULT_POS_SETTINGS,
): PosDraftState {
  return {
    customer,
    discountType: 'amount',
    discountValue: 0,
    taxType: 'percentage',
    taxValue: 0.5,
    paymentMethod: settings.defaultPaymentMethod,
    amountReceived: 0,
    notes: '',
    payerMobile: '',
    bankReference: '',
    cardReference: '',
  };
}

function createLine({
  id = makeId('line'),
  medicineId = null,
  name,
  barcode,
  batchNo,
  category,
  unit,
  price,
  qty = 1,
  lineDiscount = 0,
  stock = 0,
}: {
  id?: string;
  medicineId?: number | null;
  name: string;
  barcode: string;
  batchNo?: string;
  category: string;
  unit: string;
  price: number;
  qty?: number;
  lineDiscount?: number;
  stock?: number;
}): PosCartLine {
  return {
    id,
    medicineId,
    name,
    barcode,
    batchNo: batchNo ?? (name.toUpperCase().includes('SPOON') ? 'B-S 001' : 'B-C 001'),
    category,
    unit,
    price: safeNumber(price),
    qty: Math.max(1, Math.floor(safeNumber(qty, 1))),
    lineDiscount: Math.max(0, safeNumber(lineDiscount)),
    stock: Math.max(0, Math.floor(safeNumber(stock))),
  };
}

export function createMedicineLine(medicine: PosMedicine, qty = 1, lineDiscount = 0) {
  return createLine({
    medicineId: medicine.id,
    name: medicine.name,
    barcode: medicine.barcode,
    batchNo: medicine.batchNo ?? (medicine.name.toUpperCase().includes('SPOON') ? 'B-S 001' : 'B-C 001'),
    category: medicine.category,
    unit: medicine.unit,
    price: medicine.price,
    qty,
    lineDiscount,
    stock: medicine.stock,
  });
}

function calculateDiscountAmount(baseAmount: number, discountType: PosDiscountType, discountValue: number) {
  const safeBase = Math.max(0, baseAmount);
  const safeValue = Math.max(0, discountValue);
  if (discountType === 'percentage') {
    return Math.min(safeBase, (safeBase * safeValue) / 100);
  }
  return Math.min(safeBase, safeValue);
}

export function calculateTotals(items: PosCartLine[], draft: PosDraftState): PosTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemDiscountTotal = items.reduce((sum, item) => sum + item.lineDiscount, 0);
  const afterItemDiscount = Math.max(0, subtotal - itemDiscountTotal);
  const saleDiscountAmount = calculateDiscountAmount(afterItemDiscount, draft.discountType, draft.discountValue);
  const taxableBase = Math.max(0, afterItemDiscount - saleDiscountAmount);
  const taxAmount = calculateDiscountAmount(taxableBase, draft.taxType, draft.taxValue);

  return {
    subtotal,
    itemDiscountTotal,
    saleDiscountAmount,
    discountAmount: itemDiscountTotal + saleDiscountAmount,
    taxAmount,
    total: Math.max(0, taxableBase + taxAmount),
  };
}

function sanitizeSettings(raw: unknown): PosSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_POS_SETTINGS };
  }

  const candidate = raw as Partial<PosSettings>;

  return {
    enablePos: candidate.enablePos !== false,
    defaultPaymentMethod: mapLegacyPaymentMethod(candidate.defaultPaymentMethod, 'Cash'),
    autoPrintReceipt: candidate.autoPrintReceipt === true,
    askCustomerDetails: candidate.askCustomerDetails !== false,
    enableDiscount: candidate.enableDiscount !== false,
    enableTax: candidate.enableTax !== false,
    receiptTitle:
      typeof candidate.receiptTitle === 'string' && candidate.receiptTitle.trim()
        ? candidate.receiptTitle.trim()
        : DEFAULT_POS_SETTINGS.receiptTitle,
    receiptFooter:
      typeof candidate.receiptFooter === 'string' && candidate.receiptFooter.trim()
        ? candidate.receiptFooter.trim()
        : DEFAULT_POS_SETTINGS.receiptFooter,
  };
}

function createSaleRecord({
  id = makeId('sale'),
  invoice,
  status,
  items,
  draft,
  createdAt = formatShortDateTime(new Date()),
  amountReceived,
  paymentReference,
  gatewayTransactionId,
  paymentStatus,
  changeAmount,
}: {
  id?: string;
  invoice: string;
  status: 'Held' | 'Completed';
  items: PosCartLine[];
  draft: PosDraftState;
  createdAt?: string;
  amountReceived?: number;
  paymentReference?: string;
  gatewayTransactionId?: string;
  paymentStatus?: PosPaymentStatus;
  changeAmount?: number;
}): PosSaleRecord {
  const totals = calculateTotals(items, draft);
  const received = amountReceived ?? (status === 'Completed' ? totals.total : 0);

  return {
    id,
    invoice,
    status,
    items: items.map((item) => ({ ...item })),
    itemsCount: items.length,
    subtotal: totals.subtotal,
    itemDiscountTotal: totals.itemDiscountTotal,
    discountAmount: totals.discountAmount,
    taxAmount: totals.taxAmount,
    total: totals.total,
    createdAt,
    customer: { ...draft.customer },
    discountType: draft.discountType,
    discountValue: draft.discountValue,
    taxType: draft.taxType,
    taxValue: draft.taxValue,
    paymentMethod: draft.paymentMethod,
    amountReceived: received,
    notes: draft.notes,
    payerMobile: draft.payerMobile,
    bankReference: draft.bankReference,
    cardReference: draft.cardReference,
    paymentReference,
    gatewayTransactionId,
    paymentStatus: paymentStatus ?? (status === 'Completed' ? 'Completed' : undefined),
    changeAmount,
  };
}

const seedCompletedSales: PosSaleRecord[] = [];
const seedHeldSales: PosSaleRecord[] = [];
const seedReturnsAndExchanges: PosReturnExchangeRecord[] = [];

const DEMO_EMAILS = [
  'admin@coresaas.com',
  'manager@coresaas.com',
  'salesman@coresaas.com',
  'inventory@coresaas.com',
  'customer@pharmacy.com',
];

function isDemoUser(email: string | undefined): boolean {
  if (!email) return true;
  return DEMO_EMAILS.includes(email.trim().toLowerCase());
}

function createEmptyPosState(): PosState {
  const settings = { ...DEFAULT_POS_SETTINGS };
  return {
    cart: [],
    draft: createEmptyDraft(walkInCustomer, settings),
    settings,
    gatewaySettings: structuredClone(DEFAULT_GATEWAY_SETTINGS),
    customers: [],
    heldSales: [],
    completedSales: [],
    lastCompletedSale: null,
    returnsAndExchanges: [],
    lastReturnExchange: null,
    nextHoldNumber: 1,
    nextInvoiceNumber: 1,
    nextReturnNumber: 1,
  };
}

function createInitialState(): PosState {
  // Must match server HTML on first client render — localStorage loads in useEffect only.
  const settings = { ...DEFAULT_POS_SETTINGS };
  const completedSales = structuredClone(seedCompletedSales);
  const heldSales = structuredClone(seedHeldSales);
  const returnsAndExchanges = structuredClone(seedReturnsAndExchanges);

  return {
    cart: [],
    draft: createEmptyDraft(walkInCustomer, settings),
    settings,
    gatewaySettings: structuredClone(DEFAULT_GATEWAY_SETTINGS),
    customers: [...defaultCustomers],
    heldSales,
    completedSales,
    lastCompletedSale: completedSales[0] ?? null,
    returnsAndExchanges,
    lastReturnExchange: returnsAndExchanges[0] ?? null,
    nextHoldNumber: heldSales.length + 1,
    nextInvoiceNumber: nextInvoiceNumberFromSales(completedSales),
    nextReturnNumber: nextReturnNumberFromRecords(returnsAndExchanges),
  };
}

function sanitizeLine(raw: unknown): PosCartLine | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Partial<PosCartLine>;
  const name = typeof candidate.name === 'string' ? candidate.name : '';
  if (!name) {
    return null;
  }

  return {
    id: typeof candidate.id === 'string' ? candidate.id : makeId('line'),
    medicineId: typeof candidate.medicineId === 'number' ? candidate.medicineId : null,
    name,
    barcode: typeof candidate.barcode === 'string' ? candidate.barcode : '',
    batchNo: typeof candidate.batchNo === 'string' ? candidate.batchNo : (name.toUpperCase().includes('SPOON') ? 'B-S 001' : 'B-C 001'),
    category: typeof candidate.category === 'string' ? candidate.category : 'General',
    unit: typeof candidate.unit === 'string' ? candidate.unit : 'Item',
    price: safeNumber(candidate.price),
    qty: Math.max(1, Math.floor(safeNumber(candidate.qty, 1))),
    lineDiscount: Math.max(0, safeNumber(candidate.lineDiscount)),
    stock: Math.max(0, Math.floor(safeNumber(candidate.stock))),
  };
}

function sanitizeDraft(
  raw: unknown,
  fallbackCustomer: PosDraftCustomer,
  settings: PosSettings = DEFAULT_POS_SETTINGS,
): PosDraftState {
  if (!raw || typeof raw !== 'object') {
    return createEmptyDraft(fallbackCustomer, settings);
  }

  const candidate = raw as Partial<PosDraftState>;
  const customer = candidate.customer && typeof candidate.customer === 'object'
    ? {
        name: typeof candidate.customer.name === 'string' ? candidate.customer.name : fallbackCustomer.name,
        phone: typeof candidate.customer.phone === 'string' ? candidate.customer.phone : fallbackCustomer.phone,
        address: typeof candidate.customer.address === 'string' ? candidate.customer.address : fallbackCustomer.address,
        email: typeof candidate.customer.email === 'string' ? candidate.customer.email : fallbackCustomer.email,
        customerId:
          typeof candidate.customer.customerId === 'number' && Number.isFinite(candidate.customer.customerId)
            ? candidate.customer.customerId
            : fallbackCustomer.customerId,
        note: typeof candidate.customer.note === 'string' ? candidate.customer.note : fallbackCustomer.note,
      }
    : fallbackCustomer;

  return {
    customer,
    discountType: candidate.discountType === 'percentage' ? 'percentage' : 'amount',
    discountValue: Math.max(0, safeNumber(candidate.discountValue)),
    taxType: 'percentage',
    taxValue: typeof candidate.taxValue === 'number' && candidate.taxValue > 0 ? candidate.taxValue : 0.5,
    paymentMethod: mapLegacyPaymentMethod(candidate.paymentMethod, settings.defaultPaymentMethod),
    amountReceived: Math.max(0, safeNumber(candidate.amountReceived)),
    notes: typeof candidate.notes === 'string' ? candidate.notes : '',
    payerMobile: typeof candidate.payerMobile === 'string' ? candidate.payerMobile : '',
    bankReference: typeof candidate.bankReference === 'string' ? candidate.bankReference : '',
    cardReference: typeof candidate.cardReference === 'string' ? candidate.cardReference : '',
  };
}

function sanitizeSaleRecord(raw: unknown, fallbackCustomer: PosDraftCustomer): PosSaleRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Partial<PosSaleRecord> & {
    amount?: unknown;
    amountTotal?: unknown;
    dateTime?: unknown;
    invoiceNo?: unknown;
    invoiceNumber?: unknown;
    method?: unknown;
    paid?: unknown;
    payment?: unknown;
    time?: unknown;
  };
  const items = Array.isArray(candidate.items)
    ? candidate.items.map(sanitizeLine).filter((item): item is PosCartLine => Boolean(item))
    : [];
  const invoice =
    typeof candidate.invoice === 'string'
      ? candidate.invoice
      : typeof candidate.invoiceNo === 'string'
        ? candidate.invoiceNo
        : typeof candidate.invoiceNumber === 'string'
          ? candidate.invoiceNumber
          : '';
  if (!invoice) {
    return null;
  }

  const draft = sanitizeDraft(candidate, fallbackCustomer);
  const totals = calculateTotals(items, draft);
  const recordTotal = safeMoneyNumber(candidate.total, safeMoneyNumber(candidate.amount, safeMoneyNumber(candidate.amountTotal, totals.total)));
  const saleTotal = items.length > 0 ? totals.total : Math.max(0, recordTotal);
  const createdAt =
    typeof candidate.createdAt === 'string'
      ? candidate.createdAt
      : typeof candidate.dateTime === 'string'
        ? candidate.dateTime
        : typeof candidate.time === 'string'
          ? candidate.time
          : formatShortDateTime(new Date());
  const paymentMethod = normalizePaymentMethod(
    candidate.paymentMethod ?? candidate.method ?? candidate.payment,
    draft.paymentMethod,
  );
  const customer = normalizeSaleCustomer(candidate.customer, draft.customer);

  return {
    id: typeof candidate.id === 'string' ? candidate.id : makeId('sale'),
    invoice,
    status: candidate.status === 'Held' ? 'Held' : 'Completed',
    items,
    itemsCount: Math.max(items.length, Math.floor(safeNumber(candidate.itemsCount, items.length))),
    subtotal: items.length > 0 ? totals.subtotal : saleTotal,
    itemDiscountTotal: totals.itemDiscountTotal,
    discountAmount: items.length > 0 ? totals.discountAmount : safeMoneyNumber(candidate.discountAmount, 0),
    taxAmount: items.length > 0 ? totals.taxAmount : safeMoneyNumber(candidate.taxAmount, 0),
    total: saleTotal,
    createdAt,
    customer,
    discountType: draft.discountType,
    discountValue: draft.discountValue,
    taxType: draft.taxType,
    taxValue: draft.taxValue,
    paymentMethod,
    amountReceived: safeMoneyNumber(candidate.amountReceived, safeMoneyNumber(candidate.paid, draft.amountReceived || saleTotal)),
    notes: draft.notes,
    payerMobile: draft.payerMobile,
    bankReference: draft.bankReference,
    cardReference: draft.cardReference,
    paymentReference: typeof candidate.paymentReference === 'string' ? candidate.paymentReference : undefined,
    gatewayTransactionId:
      typeof candidate.gatewayTransactionId === 'string' ? candidate.gatewayTransactionId : undefined,
    paymentStatus:
      candidate.paymentStatus === 'Pending' || candidate.paymentStatus === 'Failed'
        ? candidate.paymentStatus
        : candidate.paymentStatus === 'Completed'
          ? 'Completed'
          : undefined,
    changeAmount: safeMoneyNumber(candidate.changeAmount, 0),
  };
}

function normalizePaymentMethod(value: unknown, fallback: PosPaymentMethod): PosPaymentMethod {
  return mapLegacyPaymentMethod(value, fallback);
}

function normalizeSaleCustomer(value: unknown, fallback: PosDraftCustomer): PosDraftCustomer {
  if (typeof value === 'string' && value.trim()) {
    return {
      ...fallback,
      name: value.trim(),
    };
  }

  if (value && typeof value === 'object') {
    const candidate = value as Partial<PosDraftCustomer>;
    return {
      name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : fallback.name,
      phone: typeof candidate.phone === 'string' && candidate.phone.trim() ? candidate.phone.trim() : fallback.phone,
      address: typeof candidate.address === 'string' && candidate.address.trim() ? candidate.address.trim() : fallback.address,
      email: typeof candidate.email === 'string' ? candidate.email : fallback.email,
      customerId:
        typeof candidate.customerId === 'number' && Number.isFinite(candidate.customerId)
          ? candidate.customerId
          : fallback.customerId,
      note: typeof candidate.note === 'string' ? candidate.note : fallback.note,
    };
  }

  return fallback;
}

function customerKey(customer: PosDraftCustomer) {
  return `${customer.name.trim().toLowerCase()}|${customer.phone.trim().toLowerCase()}`;
}

function customerText(value: string | undefined) {
  return (value ?? '').trim().toLowerCase();
}

function isDefaultCustomer(customer: PosDraftCustomer) {
  return defaultCustomers.some(
    (defaultCustomer) =>
      customerKey(defaultCustomer) === customerKey(customer) &&
      customerText(defaultCustomer.address) === customerText(customer.address) &&
      customerText(defaultCustomer.note) === customerText(customer.note),
  );
}

function getUserCustomers(customers: PosDraftCustomer[]) {
  const seen = new Set<string>();

  return customers.filter((customer) => {
    const key = customerKey(customer);
    if (seen.has(key) || isDefaultCustomer(customer)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function mergeDefaultCustomers(customers: PosDraftCustomer[]) {
  const merged = [...customers];
  const seen = new Set(merged.map(customerKey));

  defaultCustomers.forEach((customer) => {
    const key = customerKey(customer);
    if (!seen.has(key)) {
      merged.push({ ...customer });
      seen.add(key);
    }
  });

  return merged;
}

function sanitizeState(raw: unknown): PosState {
  if (!raw || typeof raw !== 'object') {
    return createInitialState();
  }

  const candidate = raw as Partial<PosState>;
  const settings = sanitizeSettings(candidate.settings);
  const draft = sanitizeDraft(candidate.draft, walkInCustomer, settings);
  const cart = Array.isArray(candidate.cart)
    ? candidate.cart
        .map(sanitizeLine)
        .filter((line): line is PosCartLine => Boolean(line))
        .map((line) => (settings.enableDiscount ? line : { ...line, lineDiscount: 0 }))
    : [];
  const normalizedDraft = {
    ...draft,
    customer: settings.askCustomerDetails ? draft.customer : walkInCustomer,
    discountType: settings.enableDiscount ? draft.discountType : 'amount',
    discountValue: settings.enableDiscount ? draft.discountValue : 0,
    taxType: 'percentage',
    taxValue: 0.5,
    paymentMethod: settings.enablePos ? draft.paymentMethod : settings.defaultPaymentMethod,
  } satisfies PosDraftState;
  const persistedCustomers =
    Array.isArray(candidate.customers) && candidate.customers.length > 0
      ? candidate.customers
          .filter((customer): customer is PosDraftCustomer => Boolean(customer && typeof customer === 'object'))
          .map((customer) => ({
            name: typeof customer.name === 'string' ? customer.name : walkInCustomer.name,
            phone: typeof customer.phone === 'string' ? customer.phone : walkInCustomer.phone,
            address: typeof customer.address === 'string' ? customer.address : walkInCustomer.address,
            email: typeof customer.email === 'string' ? customer.email : undefined,
            customerId:
              typeof customer.customerId === 'number' && Number.isFinite(customer.customerId)
                ? customer.customerId
                : undefined,
            note: typeof customer.note === 'string' ? customer.note : undefined,
          }))
      : [];
  const customers = mergeDefaultCustomers(persistedCustomers);

  const heldSales = Array.isArray(candidate.heldSales)
    ? candidate.heldSales
        .map((record) => sanitizeSaleRecord(record, walkInCustomer))
        .filter((record): record is PosSaleRecord => {
          if (!record) {
            return false;
          }

          return record.status === 'Held';
        })
    : [];

  const completedSales = mergeSaleRecords(collectCompletedSaleRecords(candidate), seedCompletedSales);

  const lastCompletedSale =
    candidate.lastCompletedSale && typeof candidate.lastCompletedSale === 'object'
      ? sanitizeSaleRecord(candidate.lastCompletedSale, walkInCustomer)
      : completedSales[0] ?? null;
  const mergedCompletedSales = mergeSaleRecords(
    completedSales,
    lastCompletedSale && lastCompletedSale.status === 'Completed' ? [lastCompletedSale] : [],
  );
  const normalizedLastCompletedSale =
    lastCompletedSale && lastCompletedSale.status === 'Completed'
      ? lastCompletedSale
      : mergedCompletedSales[0] ?? null;

  const rawReturnsAndExchanges = Array.isArray(candidate.returnsAndExchanges)
    ? candidate.returnsAndExchanges
        .map((record) => sanitizeReturnExchangeRecord(record, walkInCustomer))
        .filter((record): record is PosReturnExchangeRecord => Boolean(record))
    : [];
  const returnsAndExchanges = mergeReturnExchangeRecords(rawReturnsAndExchanges, seedReturnsAndExchanges);

  const lastReturnExchange =
    candidate.lastReturnExchange && typeof candidate.lastReturnExchange === 'object'
      ? sanitizeReturnExchangeRecord(candidate.lastReturnExchange, walkInCustomer)
      : returnsAndExchanges[0] ?? null;

  return {
    cart,
    draft: normalizedDraft,
    settings,
    gatewaySettings: sanitizeGatewaySettings(candidate.gatewaySettings),
    customers,
    heldSales,
    completedSales: mergedCompletedSales,
    lastCompletedSale: normalizedLastCompletedSale,
    returnsAndExchanges,
    lastReturnExchange,
    nextHoldNumber: Math.max(1, Math.floor(safeNumber(candidate.nextHoldNumber, 1))),
    nextInvoiceNumber: Math.max(
      Math.max(1, Math.floor(safeNumber(candidate.nextInvoiceNumber, 1))),
      nextInvoiceNumberFromSales(mergedCompletedSales),
    ),
    nextReturnNumber: Math.max(
      Math.max(1, Math.floor(safeNumber(candidate.nextReturnNumber, 1))),
      nextReturnNumberFromRecords(returnsAndExchanges),
    ),
  };
}

function collectCompletedSaleRecords(candidate: Partial<PosState>) {
  const sources = [
    candidate.completedSales,
    (candidate as { sales?: unknown }).sales,
    (candidate as { saleHistory?: unknown }).saleHistory,
    (candidate as { transactions?: unknown }).transactions,
    (candidate as { recentTransactions?: unknown }).recentTransactions,
  ];

  const records = sources.flatMap((source) => (Array.isArray(source) ? source : []));

  return mergeSaleRecords(
    records
      .map((record) => sanitizeSaleRecord(record, walkInCustomer))
      .filter((record): record is PosSaleRecord => Boolean(record && record.status === 'Completed')),
  );
}

function mergeSaleRecords(...groups: PosSaleRecord[][]) {
  const seen = new Set<string>();
  const merged: PosSaleRecord[] = [];

  groups.flat().forEach((sale) => {
    const key = sale.invoice.trim().toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(sale);
  });

  return merged;
}

function nextInvoiceNumberFromSales(sales: PosSaleRecord[]) {
  const maxInvoice = sales.reduce((max, sale) => {
    const match = sale.invoice.match(/(\d+)/g);
    const value = match ? Number(match[match.length - 1]) : 0;
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);

  return maxInvoice + 1;
}

function sanitizeReturnExchangeRecord(raw: unknown, fallbackCustomer: PosDraftCustomer): PosReturnExchangeRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Partial<PosReturnExchangeRecord>;
  const returnNumber =
    typeof candidate.returnNumber === 'string' && candidate.returnNumber.trim()
      ? candidate.returnNumber.trim()
      : '';
  if (!returnNumber) {
    return null;
  }

  const returnedItems: PosReturnItem[] = Array.isArray(candidate.returnedItems)
    ? candidate.returnedItems
        .filter((item): item is PosReturnItem => Boolean(item && typeof item === 'object' && typeof item.name === 'string'))
        .map((item) => ({
          medicineId: typeof item.medicineId === 'number' ? item.medicineId : null,
          name: String(item.name || ''),
          barcode: String(item.barcode || ''),
          category: String(item.category || 'General'),
          unit: String(item.unit || 'Item'),
          price: safeNumber(item.price),
          soldQty: Math.max(1, Math.floor(safeNumber(item.soldQty, 1))),
          alreadyReturnedQty: Math.max(0, Math.floor(safeNumber(item.alreadyReturnedQty, 0))),
          returnQty: Math.max(1, Math.floor(safeNumber(item.returnQty, 1))),
          lineDiscount: Math.max(0, safeNumber(item.lineDiscount)),
          refundTotal: Math.max(0, safeNumber(item.refundTotal)),
          reason: item.reason || 'Other',
          restock: item.restock !== false,
        }))
    : [];

  const exchangeItems: PosExchangeItem[] = Array.isArray(candidate.exchangeItems)
    ? candidate.exchangeItems
        .map(sanitizeLine)
        .filter((item): item is PosCartLine => Boolean(item))
    : [];

  const customer = normalizeSaleCustomer(candidate.customer, fallbackCustomer);
  const totalReturnAmount = safeMoneyNumber(candidate.totalReturnAmount, 0);
  const totalExchangeAmount = safeMoneyNumber(candidate.totalExchangeAmount, 0);
  const netAmount = safeMoneyNumber(candidate.netAmount, totalExchangeAmount - totalReturnAmount);
  const type = candidate.type === 'Exchange' || exchangeItems.length > 0 ? 'Exchange' : 'Return';
  const settlementType =
    candidate.settlementType || (netAmount > 0 ? 'Customer Paid' : netAmount < 0 ? 'Refund' : 'Even Exchange');

  return {
    id: typeof candidate.id === 'string' ? candidate.id : makeId('ret-exc'),
    returnNumber,
    type,
    originalInvoice: String(candidate.originalInvoice || ''),
    originalSaleDate: String(candidate.originalSaleDate || ''),
    customer,
    returnedItems,
    exchangeItems,
    totalReturnAmount,
    totalExchangeAmount,
    netAmount,
    settlementType,
    paymentMethod: String(candidate.paymentMethod || 'Cash'),
    notes: String(candidate.notes || ''),
    createdAt: String(candidate.createdAt || formatShortDateTime(new Date())),
    status: 'Completed',
  };
}

function mergeReturnExchangeRecords(...groups: PosReturnExchangeRecord[][]) {
  const seen = new Set<string>();
  const merged: PosReturnExchangeRecord[] = [];

  groups.flat().forEach((record) => {
    const key = record.returnNumber.trim().toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(record);
  });

  return merged;
}

function nextReturnNumberFromRecords(records: PosReturnExchangeRecord[]) {
  const maxNumber = records.reduce((max, record) => {
    const match = record.returnNumber.match(/(\d+)/g);
    const value = match ? Number(match[match.length - 1]) : 0;
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);

  return maxNumber + 1;
}

function loadPersistedState(): PosState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const POS_STORAGE_KEY = getPosStorageKey();
  const current = loadStateFromStorageKey(POS_STORAGE_KEY);
  if (current) {
    return current;
  }

  removeKnownLegacyStorageKeys();
  return null;
}

function loadStateFromStorageKey(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return sanitizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function hasPersistedActivity(state: PosState) {
  return (
    state.cart.length > 0 ||
    state.heldSales.length > 0 ||
    state.completedSales.length > 0 ||
    getUserCustomers(state.customers).length > 0
  );
}

function loadLegacyPosStates() {
  const keys = new Set<string>(POS_LEGACY_STORAGE_KEYS);
  const currentKey = getPosStorageKey();

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || key === currentKey) {
      continue;
    }

    const normalized = key.toLowerCase();
    if (normalized.includes('pos') || normalized.includes('sale')) {
      keys.add(key);
    }
  }

  return Array.from(keys)
    .map(loadStateFromStorageKey)
    .filter((state): state is PosState => Boolean(state));
}

function mergeRecoveredPosStates(primary: PosState, recoveredStates: PosState[]) {
  if (recoveredStates.length === 0) {
    return primary;
  }

  const completedSales = mergeSaleRecords(
    primary.completedSales,
    ...recoveredStates.map((state) => state.completedSales),
    recoveredStates
      .map((state) => state.lastCompletedSale)
      .filter((sale): sale is PosSaleRecord => Boolean(sale && sale.status === 'Completed')),
  );
  const heldSales = mergeSaleRecords(primary.heldSales, ...recoveredStates.map((state) => state.heldSales))
    .filter((sale) => sale.status === 'Held');
  const customers = mergeDefaultCustomers([
    ...primary.customers,
    ...recoveredStates.flatMap((state) => state.customers),
  ]);
  const returnsAndExchanges = mergeReturnExchangeRecords(
    primary.returnsAndExchanges,
    ...recoveredStates.map((state) => state.returnsAndExchanges),
  );

  return {
    ...primary,
    customers,
    heldSales,
    completedSales,
    lastCompletedSale: primary.lastCompletedSale ?? completedSales[0] ?? null,
    returnsAndExchanges,
    lastReturnExchange: primary.lastReturnExchange ?? returnsAndExchanges[0] ?? null,
    nextHoldNumber: Math.max(primary.nextHoldNumber, ...recoveredStates.map((state) => state.nextHoldNumber), 1),
    nextInvoiceNumber: Math.max(
      primary.nextInvoiceNumber,
      ...recoveredStates.map((state) => state.nextInvoiceNumber),
      nextInvoiceNumberFromSales(completedSales),
    ),
    nextReturnNumber: Math.max(
      primary.nextReturnNumber,
      ...recoveredStates.map((state) => state.nextReturnNumber),
      nextReturnNumberFromRecords(returnsAndExchanges),
    ),
  };
}

function createPersistedStateSnapshot(
  state: PosState,
  options: (typeof POS_PERSISTENCE_ATTEMPTS)[number],
): PosState {
  const completedSales = state.completedSales
    .filter((sale) => !sale.id.startsWith('seed'))
    .slice(0, options.completedSales);
  const heldSales = state.heldSales.slice(0, options.heldSales);
  const lastCompletedSale =
    state.lastCompletedSale &&
    !state.lastCompletedSale.id.startsWith('seed') &&
    !completedSales.some((sale) => sale.invoice === state.lastCompletedSale?.invoice)
      ? state.lastCompletedSale
      : null;
  const returnsAndExchanges = state.returnsAndExchanges
    .filter((record) => !record.id.startsWith('seed'))
    .slice(0, options.completedSales);
  const lastReturnExchange =
    state.lastReturnExchange &&
    !state.lastReturnExchange.id.startsWith('seed') &&
    !returnsAndExchanges.some((record) => record.returnNumber === state.lastReturnExchange?.returnNumber)
      ? state.lastReturnExchange
      : null;

  return {
    ...state,
    cart: options.keepCart ? state.cart : [],
    customers: getUserCustomers(state.customers),
    heldSales,
    completedSales,
    lastCompletedSale,
    returnsAndExchanges,
    lastReturnExchange,
  };
}

function isStorageQuotaError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const name = 'name' in error ? String(error.name) : '';
  const code = 'code' in error ? Number(error.code) : 0;

  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || code === 22 || code === 1014;
}

function removeKnownLegacyStorageKeys() {
  POS_LEGACY_STORAGE_KEYS.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage cleanup failures; the next save attempt will still be guarded.
    }
  });
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingState: PosState | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pendingState) {
      executePersist(pendingState);
      pendingState = null;
    }
  });
}

function executePersist(state: PosState) {
  const attemptedSignatures = new Set<string>();
  let quotaExceeded = false;

  for (const options of POS_PERSISTENCE_ATTEMPTS) {
    const snapshot = createPersistedStateSnapshot(state, options);
    const serialized = JSON.stringify(snapshot);
    const signature = `${snapshot.cart.length}:${snapshot.heldSales.length}:${snapshot.completedSales.length}:${snapshot.customers.length}:${serialized.length}`;

    if (attemptedSignatures.has(signature)) {
      continue;
    }

    attemptedSignatures.add(signature);

    try {
      window.localStorage.setItem(getPosStorageKey(), serialized);
      removeKnownLegacyStorageKeys();

      if (quotaExceeded) {
        console.warn('POS state was larger than localStorage allowed, so only the latest POS records were saved.');
      }

      return;
    } catch (error) {
      if (!isStorageQuotaError(error)) {
        console.warn('Unable to save POS state.', error);
        return;
      }

      quotaExceeded = true;
      removeKnownLegacyStorageKeys();
    }
  }

  if (quotaExceeded) {
    console.warn('Unable to save POS state because browser localStorage is full.');
  }
}

function persistPosState(state: PosState) {
  if (typeof window === 'undefined') {
    return;
  }

  pendingState = state;
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    if (pendingState) {
      executePersist(pendingState);
      pendingState = null;
    }
  }, 500);
}

function buildDraftSalePreview(state: PosState): PosSaleRecord | null {
  if (state.cart.length === 0) {
    return state.lastCompletedSale;
  }

  const invoice = formatInvoiceNumber(state.nextInvoiceNumber);
  return createSaleRecord({
    invoice,
    status: 'Completed',
    items: state.cart,
    draft: state.draft,
    createdAt: formatShortDateTime(new Date()),
    amountReceived: state.draft.amountReceived > 0 ? state.draft.amountReceived : undefined,
  });
}

function reducer(state: PosState, action: PosAction): PosState {
  switch (action.type) {
    case 'replace_state':
      return action.state;
    case 'add_medicine': {
      const existingIndex = state.cart.findIndex((line) => line.medicineId === action.medicine.id);
      if (existingIndex >= 0) {
        return {
          ...state,
          cart: state.cart.map((line, index) =>
            index === existingIndex
              ? {
                  ...line,
                  qty: line.stock > 0 ? Math.min(line.stock, line.qty + 1) : line.qty + 1,
                }
              : line,
          ),
        };
      }

      return {
        ...state,
        cart: [...state.cart, createMedicineLine(action.medicine)],
      };
    }
    case 'update_line_qty':
      return {
        ...state,
        cart: state.cart
          .map((line) => {
            if (line.id !== action.lineId) {
              return line;
            }

            const requestedQty = Math.max(1, Math.floor(action.qty));
            const maxQty = line.stock > 0 ? line.stock : requestedQty;
            return {
              ...line,
              qty: Math.min(requestedQty, maxQty),
            };
          })
          .filter((line) => line.qty > 0),
      };
    case 'update_line_price':
      return {
        ...state,
        cart: state.cart.map((line) =>
          line.id === action.lineId ? { ...line, price: Math.max(0, safeNumber(action.price)) } : line,
        ),
      };
    case 'update_line_discount':
      return {
        ...state,
        cart: state.cart.map((line) =>
          line.id === action.lineId ? { ...line, lineDiscount: Math.max(0, safeNumber(action.discount)) } : line,
        ),
      };
    case 'remove_line':
      return {
        ...state,
        cart: state.cart.filter((line) => line.id !== action.lineId),
      };
    case 'clear_cart':
      return {
        ...state,
        cart: [],
        draft: createEmptyDraft(state.draft.customer, state.settings),
      };
    case 'set_customer':
      return {
        ...state,
        draft: {
          ...state.draft,
          customer: action.customer,
        },
      };
    case 'add_customer': {
      const existsIndex = state.customers.findIndex((customer) => customer.phone === action.customer.phone || customer.name === action.customer.name);
      const customers =
        existsIndex >= 0
          ? state.customers.map((customer, index) => (index === existsIndex ? action.customer : customer))
          : [...state.customers, action.customer];

      return {
        ...state,
        customers,
        draft: {
          ...state.draft,
          customer: action.customer,
        },
      };
    }
    case 'update_customer':
      return {
        ...state,
        customers: state.customers.map((customer, index) => (index === action.customerIndex ? action.customer : customer)),
      };
    case 'delete_customer':
      return {
        ...state,
        customers: state.customers.filter((_, index) => index !== action.customerIndex),
      };
    case 'set_discount_type':
      return {
        ...state,
        draft: {
          ...state.draft,
          discountType: action.discountType,
        },
      };
    case 'set_discount_value':
      return {
        ...state,
        draft: {
          ...state.draft,
          discountValue: Math.max(0, safeNumber(action.value)),
        },
      };
    case 'set_tax_type':
      return {
        ...state,
        draft: {
          ...state.draft,
          taxType: action.taxType,
        },
      };
    case 'set_tax_value':
      return {
        ...state,
        draft: {
          ...state.draft,
          taxValue: Math.max(0, safeNumber(action.value)),
        },
      };
    case 'set_payment_method':
      return {
        ...state,
        draft: {
          ...state.draft,
          paymentMethod: action.paymentMethod,
        },
      };
    case 'set_amount_received':
      return {
        ...state,
        draft: {
          ...state.draft,
          amountReceived: Math.max(0, safeNumber(action.value)),
        },
      };
    case 'set_payer_mobile':
      return {
        ...state,
        draft: {
          ...state.draft,
          payerMobile: action.value,
        },
      };
    case 'set_bank_reference':
      return {
        ...state,
        draft: {
          ...state.draft,
          bankReference: action.value,
        },
      };
    case 'set_card_reference':
      return {
        ...state,
        draft: {
          ...state.draft,
          cardReference: action.value,
        },
      };
    case 'set_notes':
      return {
        ...state,
        draft: {
          ...state.draft,
          notes: action.notes,
        },
      };
    case 'update_settings': {
      const settings = sanitizeSettings({ ...state.settings, ...action.patch });
      const hasDefaultPaymentMethod = Object.prototype.hasOwnProperty.call(action.patch, 'defaultPaymentMethod');
      const cart = settings.enableDiscount
        ? state.cart
        : state.cart.map((line) => ({
            ...line,
            lineDiscount: 0,
          }));
      return {
        ...state,
        settings,
        cart,
        draft: {
          ...state.draft,
          customer: settings.askCustomerDetails ? state.draft.customer : walkInCustomer,
          paymentMethod: hasDefaultPaymentMethod ? settings.defaultPaymentMethod : state.draft.paymentMethod,
          discountType: settings.enableDiscount ? state.draft.discountType : 'amount',
          discountValue: settings.enableDiscount ? state.draft.discountValue : 0,
          taxType: settings.enableTax ? state.draft.taxType : 'amount',
          taxValue: settings.enableTax ? state.draft.taxValue : 0,
        },
      };
    }
    case 'update_gateway_settings': {
      const gatewaySettings = sanitizeGatewaySettings({
        ...state.gatewaySettings,
        ...action.patch,
      });

      return {
        ...state,
        gatewaySettings,
      };
    }
    case 'hold_current_sale': {
      if (state.cart.length === 0) {
        return state;
      }

      const holdInvoice = formatHoldNumber(state.nextHoldNumber);
      const heldSale = createSaleRecord({
        invoice: holdInvoice,
        status: 'Held',
        items: state.cart,
        draft: state.draft,
        createdAt: formatShortDateTime(new Date()),
        amountReceived: 0,
      });

      return {
        ...state,
        cart: [],
        draft: createEmptyDraft(walkInCustomer, state.settings),
        heldSales: [heldSale, ...state.heldSales],
        nextHoldNumber: state.nextHoldNumber + 1,
      };
    }
    case 'restore_held_sale': {
      const sale = state.heldSales.find((entry) => entry.invoice === action.invoice);
      if (!sale) {
        return state;
      }

      return {
        ...state,
        cart: sale.items.map((item) => ({ ...item })),
        draft: {
          customer: sale.customer,
          discountType: sale.discountType,
          discountValue: sale.discountValue,
          taxType: sale.taxType,
          taxValue: sale.taxValue,
          paymentMethod: sale.paymentMethod,
          amountReceived: sale.amountReceived,
          notes: sale.notes,
          payerMobile: sale.payerMobile ?? '',
          bankReference: sale.bankReference ?? '',
          cardReference: sale.cardReference ?? '',
        },
        heldSales: state.heldSales.filter((entry) => entry.invoice !== action.invoice),
      };
    }
    case 'delete_held_sale':
      return {
        ...state,
        heldSales: state.heldSales.filter((entry) => entry.invoice !== action.invoice),
      };
    case 'clear_held_sales':
      return {
        ...state,
        heldSales: [],
      };
    case 'set_last_completed_sale':
      return {
        ...state,
        lastCompletedSale: action.sale,
      };
    case 'complete_sale_with_payment':
    case 'complete_sale': {
      if (state.cart.length === 0) {
        return state;
      }

      const invoice = formatInvoiceNumber(state.nextInvoiceNumber);
      const amountReceived = state.draft.amountReceived > 0 ? state.draft.amountReceived : undefined;
      const paymentPayload =
        action.type === 'complete_sale_with_payment'
          ? action.payment
          : {
              paymentReference: createPaymentReference(state.draft.paymentMethod),
              gatewayTransactionId: createGatewayTransactionId(state.draft.paymentMethod),
              paymentStatus: 'Completed' as const,
              changeAmount: Math.max(0, (amountReceived ?? calculateTotals(state.cart, state.draft).total) - calculateTotals(state.cart, state.draft).total),
            };
      const completedSale = createSaleRecord({
        invoice,
        status: 'Completed',
        items: state.cart,
        draft: state.draft,
        createdAt: formatShortDateTime(new Date()),
        amountReceived,
        paymentReference: paymentPayload.paymentReference || undefined,
        gatewayTransactionId: paymentPayload.gatewayTransactionId || undefined,
        paymentStatus: paymentPayload.paymentStatus,
        changeAmount: paymentPayload.changeAmount,
      });

      return {
        ...state,
        cart: [],
        draft: createEmptyDraft(walkInCustomer, state.settings),
        completedSales: [completedSale, ...state.completedSales],
        lastCompletedSale: completedSale,
        nextInvoiceNumber: state.nextInvoiceNumber + 1,
      };
    }
    case 'process_return_exchange': {
      return {
        ...state,
        returnsAndExchanges: [action.record, ...state.returnsAndExchanges],
        lastReturnExchange: action.record,
        nextReturnNumber: state.nextReturnNumber + 1,
      };
    }
    case 'set_last_return_exchange': {
      return {
        ...state,
        lastReturnExchange: action.record,
      };
    }
    default:
      return state;
  }
}

export function PosProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const hydratedRef = useRef(false);
  const [, forceRender] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      dispatch({ type: 'replace_state', state: persisted });
    } else {
      const session = readAuthSession();
      const email = session?.email || '';
      if (email && !isDemoUser(email)) {
        dispatch({ type: 'replace_state', state: createEmptyPosState() });
      }
    }
    hydratedRef.current = true;
    forceRender();
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === 'undefined') {
      return;
    }

    persistPosState(state);
  }, [state]);

  const totals = calculateTotals(state.cart, state.draft);
  const draftSalePreview = buildDraftSalePreview(state);

  const value: PosContextValue = {
    state,
    totals,
    draftSalePreview,
    addMedicine: (medicine) => dispatch({ type: 'add_medicine', medicine }),
    updateLineQty: (lineId, qty) => dispatch({ type: 'update_line_qty', lineId, qty }),
    updateLinePrice: (lineId, price) => dispatch({ type: 'update_line_price', lineId, price }),
    updateLineDiscount: (lineId, discount) => dispatch({ type: 'update_line_discount', lineId, discount }),
    removeLine: (lineId) => dispatch({ type: 'remove_line', lineId }),
    clearCart: () => dispatch({ type: 'clear_cart' }),
    setCustomer: (customer) => dispatch({ type: 'set_customer', customer }),
    addCustomer: (customer) => dispatch({ type: 'add_customer', customer }),
    updateCustomer: (customerIndex, customer) => dispatch({ type: 'update_customer', customerIndex, customer }),
    deleteCustomer: (customerIndex) => dispatch({ type: 'delete_customer', customerIndex }),
    setDiscountType: (discountType) => dispatch({ type: 'set_discount_type', discountType }),
    setDiscountValue: (value) => dispatch({ type: 'set_discount_value', value }),
    setTaxType: (taxType) => dispatch({ type: 'set_tax_type', taxType }),
    setTaxValue: (value) => dispatch({ type: 'set_tax_value', value }),
    setPaymentMethod: (paymentMethod) => dispatch({ type: 'set_payment_method', paymentMethod }),
    setAmountReceived: (value) => dispatch({ type: 'set_amount_received', value }),
    setPayerMobile: (value) => dispatch({ type: 'set_payer_mobile', value }),
    setBankReference: (value) => dispatch({ type: 'set_bank_reference', value }),
    setCardReference: (value) => dispatch({ type: 'set_card_reference', value }),
    setNotes: (notes) => dispatch({ type: 'set_notes', notes }),
    updateSettings: (patch) => dispatch({ type: 'update_settings', patch }),
    updateGatewaySettings: (patch) => dispatch({ type: 'update_gateway_settings', patch }),
    holdCurrentSale: () => dispatch({ type: 'hold_current_sale' }),
    restoreHeldSale: (invoice) => dispatch({ type: 'restore_held_sale', invoice }),
    deleteHeldSale: (invoice) => dispatch({ type: 'delete_held_sale', invoice }),
    clearHeldSales: () => dispatch({ type: 'clear_held_sales' }),
    setLastCompletedSale: (sale) => dispatch({ type: 'set_last_completed_sale', sale }),
    completeSale: () => dispatch({ type: 'complete_sale' }),
    completeSaleWithPayment: (payment) => dispatch({ type: 'complete_sale_with_payment', payment }),
    processReturnExchange: (record) => dispatch({ type: 'process_return_exchange', record }),
    setLastReturnExchange: (record) => dispatch({ type: 'set_last_return_exchange', record }),
  };

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePosStore() {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePosStore must be used within a PosProvider');
  }

  return context;
}

export function buildPosDraftPreview(state: PosState) {
  return buildDraftSalePreview(state);
}

export function getPosDefaultCustomers() {
  return [...defaultCustomers];
}

export function getPosMedicineCatalog() {
  return [...posMedicineCatalog];
}
