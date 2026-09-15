'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import {
  addDaysIso,
  calculateOrderTotals,
  createBlankPurchaseDraft,
  createDraftLineItem,
  formatPurchaseDateTime,
  purchaseOrderNumber,
  roundMoney,
  seedPurchaseExpenses,
  seedPurchaseOrders,
  seedPurchaseReturns,
  seedPurchaseSuppliers,
  todayIso,
  type PurchaseDraft,
  type PurchaseExpense,
  type PurchaseLineItem,
  type PurchaseOrder,
  type PurchaseOrderStatus,
  type PurchasePaymentMethod,
  type PurchaseReturn,
  type PurchaseSupplier,
} from './purchase-data';

import { readAuthSession } from '@/lib/auth-session';

function getPurchaseStorageKey(): string {
  if (typeof window === 'undefined') return 'pharma-purchase-state-v4';
  const session = readAuthSession();
  const emailSlug = session?.email
    ? `-${session.email.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`
    : '';
  return `pharma-purchase-state-v4${emailSlug}`;
}

export type PurchaseState = {
  suppliers: PurchaseSupplier[];
  orders: PurchaseOrder[];
  returns: PurchaseReturn[];
  expenses: PurchaseExpense[];
  draft: PurchaseDraft;
  nextOrderSequence: number;
  nextSupplierId: number;
  nextReturnId: number;
  nextExpenseId: number;
};

type PurchaseAction =
  | { type: 'replace_state'; state: PurchaseState }
  | { type: 'patch_draft'; patch: Partial<PurchaseDraft> }
  | { type: 'set_draft_supplier'; supplierId: number | null; supplierName: string }
  | { type: 'replace_draft_items'; items: PurchaseLineItem[] }
  | { type: 'add_draft_item'; item: PurchaseLineItem }
  | { type: 'update_draft_item'; itemId: string; patch: Partial<PurchaseLineItem> }
  | { type: 'remove_draft_item'; itemId: string }
  | { type: 'load_order_into_draft'; order: PurchaseOrder }
  | { type: 'reset_draft'; draft: PurchaseDraft }
  | { type: 'upsert_order'; order: PurchaseOrder; previousOrderId: string | null }
  | { type: 'set_order_status'; orderId: string; status: PurchaseOrderStatus; patch?: Partial<PurchaseOrder> }
  | { type: 'add_supplier'; supplier: PurchaseSupplier }
  | { type: 'update_supplier'; supplierId: number; patch: Partial<PurchaseSupplier> }
  | { type: 'delete_supplier'; supplierId: number }
  | { type: 'add_return'; record: PurchaseReturn }
  | { type: 'add_expense'; expense: PurchaseExpense };

type PurchaseContextValue = {
  state: PurchaseState;
  draftTotals: {
    subtotal: number;
    discountTotal: number;
    total: number;
    itemCount: number;
  };
  patchDraft: (patch: Partial<PurchaseDraft>) => void;
  setDraftSupplier: (supplierId: number | null, supplierName: string) => void;
  replaceDraftItems: (items: PurchaseLineItem[]) => void;
  addDraftItem: (item?: Partial<PurchaseLineItem>) => void;
  updateDraftItem: (itemId: string, patch: Partial<PurchaseLineItem>) => void;
  removeDraftItem: (itemId: string) => void;
  resetDraft: () => void;
  loadOrderIntoDraft: (orderId: string) => void;
  saveDraftAsOrder: () => void;
  updateOrderStatus: (orderId: string, status: PurchaseOrderStatus, patch?: Partial<PurchaseOrder>) => void;
  addSupplier: (supplier: Partial<PurchaseSupplier>) => void;
  updateSupplier: (supplierId: number, patch: Partial<PurchaseSupplier>) => void;
  deleteSupplier: (supplierId: number) => void;
  addReturn: (record: Omit<PurchaseReturn, 'id'>) => void;
  addExpense: (expense: Omit<PurchaseExpense, 'id'>) => void;
};

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

function makeLineId(prefix = 'line') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DEMO_EMAILS = [
  'admin@coresaas.com',
  'manager@coresaas.com',
  'salesman@coresaas.com',
  'inventory@coresaas.com',
  'customer@pharmacy.com',
];

function createSeedState(_email?: string): PurchaseState {
  const supplierSequence = Math.max(...seedPurchaseSuppliers.map((supplier) => supplier.id), 0) + 1;
  const orderSequence = Math.max(...seedPurchaseOrders.map((order) => extractSequence(order.orderNo)), 0) + 1;
  const returnSequence = Math.max(...seedPurchaseReturns.map((record) => extractSequence(record.id)), 0) + 1;
  const expenseSequence = Math.max(...seedPurchaseExpenses.map((record) => extractSequence(record.id)), 0) + 1;

  return {
    suppliers: structuredClone(seedPurchaseSuppliers),
    orders: structuredClone(seedPurchaseOrders),
    returns: structuredClone(seedPurchaseReturns),
    expenses: structuredClone(seedPurchaseExpenses),
    draft: createBlankPurchaseDraft(),
    nextOrderSequence: orderSequence,
    nextSupplierId: supplierSequence,
    nextReturnId: returnSequence,
    nextExpenseId: expenseSequence,
  };
}

function extractSequence(value: string) {
  const numeric = Number(value.replace(/[^0-9]/g, ''));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function normalizeState(candidate: unknown): PurchaseState | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const value = candidate as Partial<PurchaseState>;
  const suppliers = Array.isArray(value.suppliers) ? value.suppliers.map(normalizeSupplier).filter(Boolean) as PurchaseSupplier[] : [];
  const orders = Array.isArray(value.orders) ? value.orders.map(normalizeOrder).filter(Boolean) as PurchaseOrder[] : [];
  const returns = Array.isArray(value.returns) ? value.returns.map(normalizeReturn).filter(Boolean) as PurchaseReturn[] : [];
  const expenses = Array.isArray(value.expenses) ? value.expenses.map(normalizeExpense).filter(Boolean) as PurchaseExpense[] : [];
  const draft = normalizeDraft(value.draft);
  const mergedSuppliers = mergeSeedSuppliers(suppliers);
  const mergedOrders = mergeSeedOrders(orders);

  return {
    suppliers: mergedSuppliers,
    orders: mergedOrders,
    returns: returns.length ? returns : structuredClone(seedPurchaseReturns),
    expenses: expenses.length ? expenses : structuredClone(seedPurchaseExpenses),
    draft,
    nextOrderSequence: Math.max(value.nextOrderSequence ?? 0, ...mergedOrders.map((order) => extractSequence(order.orderNo)), ...seedPurchaseOrders.map((order) => extractSequence(order.orderNo))) + 1,
    nextSupplierId: Math.max(value.nextSupplierId ?? 0, ...mergedSuppliers.map((supplier) => supplier.id), ...seedPurchaseSuppliers.map((supplier) => supplier.id)) + 1,
    nextReturnId: Math.max(value.nextReturnId ?? 0, ...returns.map((record) => extractSequence(record.id)), ...seedPurchaseReturns.map((record) => extractSequence(record.id))) + 1,
    nextExpenseId: Math.max(value.nextExpenseId ?? 0, ...expenses.map((record) => extractSequence(record.id)), ...seedPurchaseExpenses.map((record) => extractSequence(record.id))) + 1,
  };
}

function mergeSeedSuppliers(suppliers: PurchaseSupplier[]) {
  const merged = [...suppliers];
  const hasSupplier = (candidate: PurchaseSupplier) =>
    merged.some((supplier) => {
      const sameName = slugify(supplier.name) === slugify(candidate.name);
      const samePhone = supplier.phone !== '0300-0000000' && supplier.phone === candidate.phone;
      return sameName || samePhone;
    });

  seedPurchaseSuppliers.forEach((supplier) => {
    if (!hasSupplier(supplier)) {
      merged.push(structuredClone(supplier));
    }
  });

  return merged;
}

function mergeSeedOrders(orders: PurchaseOrder[]) {
  const merged = [...orders];
  const hasOrder = (candidate: PurchaseOrder) =>
    merged.some((order) => order.orderNo === candidate.orderNo || order.id === candidate.id);

  seedPurchaseOrders.forEach((order) => {
    if (!hasOrder(order)) {
      merged.push(structuredClone(order));
    }
  });

  return merged;
}

function normalizeSupplier(candidate: unknown): PurchaseSupplier | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const value = candidate as Partial<PurchaseSupplier>;
  const id = Number(value.id);
  if (!Number.isFinite(id)) {
    return null;
  }

  return {
    id,
    name: textValue(value.name, 'New Supplier'),
    phone: textValue(value.phone, '0300-0000000'),
    email: textValue(value.email, 'supplier@example.com'),
    city: textValue(value.city, 'Karachi'),
    contactPerson: textValue(value.contactPerson, textValue(value.name, 'New Supplier')),
    status: value.status === 'Inactive' ? 'Inactive' : 'Active',
    balance: numberValue(value.balance, 0),
    lastOrderDate: textValue(value.lastOrderDate, todayIso()),
    notes: textValue(value.notes, ''),
  };
}

function normalizeLineItem(candidate: unknown): PurchaseLineItem | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const value = candidate as Partial<PurchaseLineItem>;
  const id = textValue(value.id, '');
  if (!id) {
    return null;
  }

  return createDraftLineItem(id, {
    itemCode: textValue(value.itemCode, ''),
    medicine: textValue(value.medicine, ''),
    pack: textValue(value.pack, ''),
    qty: Math.max(0, Math.floor(numberValue(value.qty, 0))),
    bonusQty: Math.max(0, Math.floor(numberValue(value.bonusQty, 0))),
    purchasePrice: roundMoney(numberValue(value.purchasePrice, 0)),
    discount: roundMoney(Math.max(0, numberValue(value.discount, 0))),
    discountPercent: Math.max(0, numberValue(value.discountPercent, 0)),
    gstPercent: Math.max(0, numberValue(value.gstPercent, 0)),
    fTaxPercent: Math.max(0, numberValue(value.fTaxPercent, 0)),
    nonAtlPercent: Math.max(0, numberValue(value.nonAtlPercent, 0)),
    advTaxPercent: Math.max(0, numberValue(value.advTaxPercent, 0)),
    atlStatus: value.atlStatus === 'Non-ATL' ? 'Non-ATL' : 'ATL',
    remarks: textValue(value.remarks, ''),
    tpValue: roundMoney(numberValue(value.tpValue, 0)),
    mrpValue: roundMoney(numberValue(value.mrpValue, 0)),
    prodDiscountAmount: roundMoney(Math.max(0, numberValue(value.prodDiscountAmount, 0))),
    salesTaxAmount: roundMoney(Math.max(0, numberValue(value.salesTaxAmount, 0))),
    aiTaxAmount: roundMoney(Math.max(0, numberValue(value.aiTaxAmount, 0))),
    receiveQty: value.receiveQty === undefined ? undefined : Math.max(0, Math.floor(numberValue(value.receiveQty, 0))),
    batchNo: value.batchNo ? textValue(value.batchNo, '') : undefined,
    mfgDate: value.mfgDate ? textValue(value.mfgDate, '') : undefined,
    expiryDate: value.expiryDate ? textValue(value.expiryDate, '') : undefined,
  });
}

function normalizeOrder(candidate: unknown): PurchaseOrder | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const value = candidate as Partial<PurchaseOrder>;
  const id = textValue(value.id, '');
  const orderNo = textValue(value.orderNo, '');
  if (!id || !orderNo) {
    return null;
  }

  const items = Array.isArray(value.items)
    ? value.items.map(normalizeLineItem).filter(Boolean) as PurchaseLineItem[]
    : [];
  const totals = calculateOrderTotals(items);
  const status = normalizeStatus(value.status);
  const createdAt = textValue(value.createdAt, `${textValue(value.orderDate, todayIso())}T10:30:00`);
  const updatedAt = textValue(value.updatedAt, createdAt);

  return {
    id,
    orderNo,
    supplierId: Math.max(0, Math.floor(numberValue(value.supplierId, 0))),
    supplierName: textValue(value.supplierName, 'Unknown Supplier'),
    invoiceReference: textValue(value.invoiceReference, `INV-${orderNo.replace(/[^0-9]/g, '') || orderNo}`),
    shipmentDate: textValue(value.shipmentDate, textValue(value.orderDate, todayIso())),
    orderDate: textValue(value.orderDate, todayIso()),
    expectedDate: textValue(value.expectedDate, addDaysIso(textValue(value.orderDate, todayIso()), 7)),
    paymentMethod: normalizePaymentMethod(value.paymentMethod),
    status,
    notes: textValue(value.notes, ''),
    source: value.source === 'OCR' ? 'OCR' : 'Manual',
    items,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    total: totals.total,
    createdAt,
    updatedAt,
    receivedAt: value.receivedAt ? textValue(value.receivedAt, '') : undefined,
    cancelledAt: value.cancelledAt ? textValue(value.cancelledAt, '') : undefined,
  };
}

function normalizeReturn(candidate: unknown): PurchaseReturn | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const value = candidate as Partial<PurchaseReturn>;
  const id = textValue(value.id, '');
  const orderId = textValue(value.orderId, '');
  const orderNo = textValue(value.orderNo, '');
  if (!id || !orderId || !orderNo) {
    return null;
  }

  const items = Array.isArray(value.items)
    ? value.items
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const line = item as PurchaseReturn['items'][number];
          return {
            id: textValue(line.id, makeLineId('return')),
            medicine: textValue(line.medicine, 'Unnamed Item'),
            receivedQty: Math.max(0, Math.floor(numberValue(line.receivedQty, 0))),
            returnQty: Math.max(0, Math.floor(numberValue(line.returnQty, 0))),
            reason: normalizeReturnReason(line.reason),
          };
        })
        .filter(Boolean) as PurchaseReturn['items']
    : [];

  return {
    id,
    orderId,
    orderNo,
    returnDate: textValue(value.returnDate, todayIso()),
    status: value.status === 'Approved' ? 'Approved' : value.status === 'Rejected' ? 'Rejected' : 'Submitted',
    notes: textValue(value.notes, ''),
    items,
    totalReturned: Math.max(0, Math.floor(numberValue(value.totalReturned, items.reduce((sum, item) => sum + item.returnQty, 0)))),
  };
}

function normalizeExpense(candidate: unknown): PurchaseExpense | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const value = candidate as Partial<PurchaseExpense>;
  const id = textValue(value.id, '');
  if (!id) {
    return null;
  }

  return {
    id,
    type: textValue(value.type, 'Miscellaneous'),
    amount: roundMoney(numberValue(value.amount, 0)),
    date: textValue(value.date, todayIso()),
    notes: textValue(value.notes, ''),
  };
}

function normalizeDraft(candidate: unknown): PurchaseDraft {
  if (!candidate || typeof candidate !== 'object') {
    return createBlankPurchaseDraft();
  }

  const value = candidate as Partial<PurchaseDraft>;
  const items = Array.isArray(value.items)
    ? value.items.map(normalizeLineItem).filter(Boolean) as PurchaseLineItem[]
    : [];

  return {
    editingOrderId: value.editingOrderId ? textValue(value.editingOrderId, '') : null,
    supplierId: value.supplierId === null || value.supplierId === undefined ? null : Math.max(0, Math.floor(numberValue(value.supplierId, 0))),
    supplierName: textValue(value.supplierName, ''),
    invoiceReference: textValue(value.invoiceReference, ''),
    shipmentDate: textValue(value.shipmentDate, textValue(value.orderDate, todayIso())),
    orderDate: textValue(value.orderDate, todayIso()),
    expectedDate: textValue(value.expectedDate, addDaysIso(textValue(value.orderDate, todayIso()), 7)),
    paymentMethod: normalizePaymentMethod(value.paymentMethod),
    notes: textValue(value.notes, ''),
    items: items.length ? items : [createDraftLineItem('draft-1')],
    source: value.source === 'OCR' ? 'OCR' : 'Manual',
    ocrText: textValue(value.ocrText, ''),
    ocrFileName: textValue(value.ocrFileName, ''),
    ocrConfidence: numberValue(value.ocrConfidence, 0),
  };
}

function normalizeStatus(value: unknown): PurchaseOrderStatus {
  if (value === 'Partial') {
    return 'Partial';
  }
  if (value === 'Received') {
    return 'Received';
  }
  if (value === 'Cancelled') {
    return 'Cancelled';
  }

  return 'Pending';
}

function normalizePaymentMethod(value: unknown): PurchasePaymentMethod {
  if (value === 'Cash') return 'Cash';
  if (value === 'Bank Transfer') return 'Bank Transfer';
  if (value === 'Card') return 'Card';
  if (value === 'Mobile Wallet') return 'Mobile Wallet';
  return 'Credit';
}

function normalizeReturnReason(value: unknown) {
  if (
    value === 'Damaged' ||
    value === 'Expired' ||
    value === 'Wrong Item' ||
    value === 'Short Supply' ||
    value === 'Overstock' ||
    value === 'Price Issue'
  ) {
    return value;
  }

  return 'Damaged';
}

function buildOrderFromDraft(state: PurchaseState) {
  const draft = state.draft;
  const existingOrder = draft.editingOrderId ? state.orders.find((order) => order.id === draft.editingOrderId) ?? null : null;
  const supplier = resolveDraftSupplier(state);
  if (!supplier) {
    return null;
  }

  const items = draft.items
    .map((item) => normalizeLineItem(item))
    .filter((item): item is PurchaseLineItem => Boolean(item && item.medicine.trim() && item.qty > 0));
  const totals = calculateOrderTotals(items);
  const now = new Date().toISOString();

  return {
    order: {
      id: existingOrder?.id ?? `purchase-${state.nextOrderSequence}`,
      orderNo: existingOrder?.orderNo ?? purchaseOrderNumber(state.nextOrderSequence),
      supplierId: supplier.id,
      supplierName: supplier.name,
      invoiceReference:
        draft.invoiceReference.trim() ||
        existingOrder?.invoiceReference ||
        `INV-${String(state.nextOrderSequence).padStart(5, '0')}`,
      shipmentDate: draft.shipmentDate || draft.orderDate,
      orderDate: draft.orderDate,
      expectedDate: draft.expectedDate,
      paymentMethod: draft.paymentMethod,
      status: existingOrder?.status ?? 'Pending',
      notes: draft.notes,
      source: draft.source,
      items,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      createdAt: existingOrder?.createdAt ?? now,
      updatedAt: now,
      receivedAt: existingOrder?.receivedAt,
      cancelledAt: existingOrder?.cancelledAt,
    } satisfies PurchaseOrder,
    supplier,
    previousOrderId: existingOrder?.id ?? null,
  };
}

function resolveDraftSupplier(state: PurchaseState) {
  const name = state.draft.supplierName.trim();
  if (!name) {
    return null;
  }

  const byId = state.draft.supplierId ? state.suppliers.find((supplier) => supplier.id === state.draft.supplierId) ?? null : null;
  if (byId) {
    return byId;
  }

  const normalized = slugify(name);
  const byName = state.suppliers.find((supplier) => slugify(supplier.name) === normalized) ?? null;
  if (byName) {
    return byName;
  }

  return {
    id: state.nextSupplierId,
    name,
    phone: '0300-0000000',
    email: `${normalized || 'supplier'}@supplier.local`,
    city: 'Karachi',
    contactPerson: name,
    status: 'Active' as const,
    balance: 0,
    lastOrderDate: state.draft.orderDate,
    notes: 'Auto-created from a purchase draft.',
  };
}

function makeInitialState(): PurchaseState {
  // Must match server HTML on first client render — localStorage loads in useEffect only.
  return createSeedState();
}

function reducer(state: PurchaseState, action: PurchaseAction): PurchaseState {
  switch (action.type) {
    case 'replace_state':
      return action.state;
    case 'patch_draft':
      return {
        ...state,
        draft: {
          ...state.draft,
          ...action.patch,
        },
      };
    case 'set_draft_supplier':
      return {
        ...state,
        draft: {
          ...state.draft,
          supplierId: action.supplierId,
          supplierName: action.supplierName,
        },
      };
    case 'replace_draft_items':
      return {
        ...state,
        draft: {
          ...state.draft,
          items: action.items.length ? action.items : [createDraftLineItem('draft-1')],
        },
      };
    case 'add_draft_item':
      return {
        ...state,
        draft: {
          ...state.draft,
          items: [...state.draft.items, action.item],
        },
      };
    case 'update_draft_item':
      return {
        ...state,
        draft: {
          ...state.draft,
          items: state.draft.items.map((item) =>
            item.id === action.itemId
              ? createDraftLineItem(item.id, {
                  ...item,
                  ...action.patch,
                })
              : item,
          ),
        },
      };
    case 'remove_draft_item':
      return {
        ...state,
        draft: {
          ...state.draft,
          items: state.draft.items.filter((item) => item.id !== action.itemId),
        },
      };
    case 'load_order_into_draft':
      return {
        ...state,
        draft: {
          editingOrderId: action.order.id,
          supplierId: action.order.supplierId,
          supplierName: action.order.supplierName,
          invoiceReference: action.order.invoiceReference,
          shipmentDate: action.order.shipmentDate,
          orderDate: action.order.orderDate,
          expectedDate: action.order.expectedDate,
          paymentMethod: action.order.paymentMethod,
          notes: action.order.notes,
          items: action.order.items.map((item) => ({
            ...item,
            id: item.id || makeLineId('draft'),
          })),
          source: action.order.source,
          ocrText: '',
          ocrFileName: '',
          ocrConfidence: 0,
        },
      };
    case 'reset_draft':
      return {
        ...state,
        draft: action.draft,
      };
    case 'upsert_order': {
      const orders = [...state.orders];
      const existingIndex = action.previousOrderId ? orders.findIndex((order) => order.id === action.previousOrderId) : -1;

      if (existingIndex >= 0) {
        orders[existingIndex] = action.order;
      } else {
        orders.unshift(action.order);
      }

      return {
        ...state,
        orders,
        nextOrderSequence: existingIndex >= 0 ? state.nextOrderSequence : state.nextOrderSequence + 1,
      };
    }
    case 'set_order_status':
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.orderId
            ? {
                ...order,
                status: action.status,
                updatedAt: new Date().toISOString(),
                ...action.patch,
              }
            : order,
        ),
      };
    case 'add_supplier':
      return {
        ...state,
        suppliers: [action.supplier, ...state.suppliers],
        nextSupplierId: Math.max(state.nextSupplierId, action.supplier.id + 1),
      };
    case 'update_supplier':
      return {
        ...state,
        suppliers: state.suppliers.map((supplier) =>
          supplier.id === action.supplierId
            ? {
                ...supplier,
                ...action.patch,
              }
            : supplier,
        ),
      };
    case 'delete_supplier':
      return {
        ...state,
        suppliers: state.suppliers.filter((supplier) => supplier.id !== action.supplierId),
      };
    case 'add_return':
      return {
        ...state,
        returns: [action.record, ...state.returns],
        nextReturnId: Math.max(state.nextReturnId, extractSequence(action.record.id) + 1),
      };
    case 'add_expense':
      return {
        ...state,
        expenses: [action.expense, ...state.expenses],
        nextExpenseId: Math.max(state.nextExpenseId, extractSequence(action.expense.id) + 1),
      };
    default:
      return state;
  }
}

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState);
  const hydratedRef = useRef(false);
  const [readyTick, forceReadyTick] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      dispatch({ type: 'replace_state', state: persisted });
    } else {
      const session = readAuthSession();
      const email = session?.email || '';
      if (email && !DEMO_EMAILS.includes(email.trim().toLowerCase())) {
        dispatch({ type: 'replace_state', state: createSeedState(email) });
      }
    }
    hydratedRef.current = true;
    forceReadyTick();
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(getPurchaseStorageKey(), JSON.stringify(state));
    } catch (error) {
      console.warn('Unable to persist purchase state to localStorage due to quota limits:', error);
    }
  }, [state]);

  const draftTotals = useMemo(() => {
    const items = state.draft.items.filter((item) => item.medicine.trim());
    const totals = calculateOrderTotals(items);
    return {
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      itemCount: state.draft.items.length,
    };
  }, [state.draft.items]);

  const value: PurchaseContextValue = {
    state,
    draftTotals,
    patchDraft: (patch) => dispatch({ type: 'patch_draft', patch }),
    setDraftSupplier: (supplierId, supplierName) => dispatch({ type: 'set_draft_supplier', supplierId, supplierName }),
    replaceDraftItems: (items) => dispatch({ type: 'replace_draft_items', items }),
    addDraftItem: (item = {}) =>
      dispatch({
        type: 'add_draft_item',
        item: createDraftLineItem(makeLineId('draft'), item),
      }),
    updateDraftItem: (itemId, patch) => dispatch({ type: 'update_draft_item', itemId, patch }),
    removeDraftItem: (itemId) => dispatch({ type: 'remove_draft_item', itemId }),
    resetDraft: () => dispatch({ type: 'reset_draft', draft: createBlankPurchaseDraft() }),
    loadOrderIntoDraft: (orderId) => {
      const order = state.orders.find((entry) => entry.id === orderId);
      if (!order) {
        return;
      }

      dispatch({ type: 'load_order_into_draft', order });
    },
    saveDraftAsOrder: () => {
      const built = buildOrderFromDraft(state);
      if (!built) {
        return;
      }

      if (built.supplier.id === state.nextSupplierId) {
        dispatch({ type: 'add_supplier', supplier: built.supplier });
      }

      dispatch({
        type: 'upsert_order',
        order: built.order,
        previousOrderId: built.previousOrderId,
      });
      dispatch({ type: 'reset_draft', draft: createBlankPurchaseDraft() });
    },
    updateOrderStatus: (orderId, status, patch = {}) =>
      dispatch({
        type: 'set_order_status',
        orderId,
        status,
        patch: {
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      }),
    addSupplier: (supplier) => {
      const name = textValue(supplier.name, '');
      if (!name) {
        return;
      }

      const id = state.nextSupplierId;
      dispatch({
        type: 'add_supplier',
        supplier: {
          id,
          name,
          phone: textValue(supplier.phone, '0300-0000000'),
          email: textValue(supplier.email, `${slugify(name) || 'supplier'}@supplier.local`),
          city: textValue(supplier.city, 'Karachi'),
          contactPerson: textValue(supplier.contactPerson, name),
          status: supplier.status === 'Inactive' ? 'Inactive' : 'Active',
          balance: roundMoney(numberValue(supplier.balance, 0)),
          lastOrderDate: textValue(supplier.lastOrderDate, todayIso()),
          notes: textValue(supplier.notes, ''),
        },
      });
    },
    updateSupplier: (supplierId, patch) =>
      dispatch({
        type: 'update_supplier',
        supplierId,
        patch,
      }),
    deleteSupplier: (supplierId) => dispatch({ type: 'delete_supplier', supplierId }),
    addReturn: (record) => {
      const id = `return-${state.nextReturnId}`;
      dispatch({
        type: 'add_return',
        record: {
          id,
          orderId: record.orderId,
          orderNo: record.orderNo,
          returnDate: record.returnDate,
          status: record.status,
          notes: record.notes,
          items: record.items,
          totalReturned: record.totalReturned,
        },
      });
    },
    addExpense: (expense) => {
      const id = `expense-${state.nextExpenseId}`;
      dispatch({
        type: 'add_expense',
        expense: {
          id,
          type: expense.type,
          amount: roundMoney(numberValue(expense.amount, 0)),
          date: expense.date,
          notes: expense.notes,
        },
      });
    },
  };

  // `readyTick` keeps hydration aligned with the localStorage restore effect.
  void readyTick;

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

function loadPersistedState(): PurchaseState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getPurchaseStorageKey());
    if (!raw) {
      return null;
    }

    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function usePurchaseStore() {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchaseStore must be used within a PurchaseProvider');
  }

  return context;
}

export function getPurchaseOrderById(state: PurchaseState, orderId: string) {
  return state.orders.find((order) => order.id === orderId) ?? null;
}

export function getPurchaseSupplierById(state: PurchaseState, supplierId: number) {
  return state.suppliers.find((supplier) => supplier.id === supplierId) ?? null;
}

export function getPurchaseSupplierName(state: PurchaseState, supplierId: number) {
  return getPurchaseSupplierById(state, supplierId)?.name ?? 'Unknown Supplier';
}

export function getPurchaseOrderPaymentLabel(method: PurchasePaymentMethod) {
  return method;
}

export function getPurchaseOrderDisplayDate(value: string) {
  return formatPurchaseDateTime(value);
}

export function getPurchaseDashboardStats(state: PurchaseState) {
  const activeOrders = state.orders.filter((order) => order.status !== 'Cancelled');
  const totalPurchases = activeOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = state.orders.length;
  const totalItems = activeOrders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.qty, 0),
    0,
  );
  const totalSuppliers = state.suppliers.length;
  const pendingOrders = state.orders.filter((order) => order.status === 'Pending' || order.status === 'Partial').length;
  const receivedOrders = state.orders.filter((order) => order.status === 'Received').length;
  const cancelledOrders = state.orders.filter((order) => order.status === 'Cancelled').length;
  const totalReturns = state.returns.reduce((sum, record) => sum + record.totalReturned, 0);
  const totalExpenses = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    totalPurchases,
    totalOrders,
    totalItems,
    totalSuppliers,
    pendingOrders,
    receivedOrders,
    cancelledOrders,
    totalReturns,
    totalExpenses,
  };
}

export function getPurchaseTrendSeries(state: PurchaseState) {
  const months = buildLastSixMonths();
  return months.map((month) => {
    const monthlyTotal = state.orders
      .filter((order) => order.status !== 'Cancelled')
      .filter((order) => order.orderDate.startsWith(month.value))
      .reduce((sum, order) => sum + order.total, 0);

    return {
      label: month.label,
      value: roundMoney(monthlyTotal),
    };
  });
}

export function getPurchasePaymentSegments(state: PurchaseState) {
  const methods: PurchasePaymentMethod[] = ['Cash', 'Credit', 'Bank Transfer', 'Card', 'Mobile Wallet'];
  return methods.map((method) => ({
    label: method,
    value: roundMoney(
      state.orders
        .filter((order) => order.status !== 'Cancelled')
        .filter((order) => order.paymentMethod === method)
        .reduce((sum, order) => sum + order.total, 0),
    ),
  }));
}

function buildLastSixMonths() {
  const months: Array<{ label: string; value: string }> = [];
  const formatter = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setMonth(date.getMonth() - offset);
    const value = date.toISOString().slice(0, 7);
    months.push({
      label: formatter.format(date),
      value,
    });
  }

  return months;
}

function textValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
