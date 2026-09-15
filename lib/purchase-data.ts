import type { ComponentType } from 'react';
import {
  FileScan,
  ListOrdered,
  PackageSearch,
  RotateCcw,
  ScanSearch,
  Truck,
} from 'lucide-react';

export type PurchasePaymentMethod = 'Cash' | 'Credit' | 'Bank Transfer' | 'Card' | 'Mobile Wallet';

export type PurchaseOrderStatus = 'Pending' | 'Partial' | 'Received' | 'Cancelled';

export type PurchaseReturnReason = 'Damaged' | 'Expired' | 'Wrong Item' | 'Short Supply' | 'Overstock' | 'Price Issue';

export type PurchaseTone = 'purple' | 'green' | 'blue' | 'orange' | 'red' | 'sky';

export type PurchaseSupplierStatus = 'Active' | 'Inactive';

export type PurchaseSupplier = {
  id: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  contactPerson: string;
  status: PurchaseSupplierStatus;
  balance: number;
  lastOrderDate: string;
  notes: string;
};

export type PurchaseLineItem = {
  id: string;
  itemCode: string;
  medicine: string;
  pack: string;
  qty: number;
  bonusQty: number;
  purchasePrice: number;
  discount: number;
  discountPercent: number;
  gstPercent: number;
  fTaxPercent: number;
  nonAtlPercent: number;
  advTaxPercent: number;
  atlStatus: 'ATL' | 'Non-ATL';
  remarks: string;
  tpValue: number;
  mrpValue: number;
  prodDiscountAmount: number;
  salesTaxAmount: number;
  aiTaxAmount: number;
  receiveQty?: number;
  batchNo?: string;
  mfgDate?: string;
  expiryDate?: string;
};

export type PurchaseLineSummary = {
  baseAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  totalQty: number;
  effectiveCostPerUnit: number;
};

export type PurchaseOrder = {
  id: string;
  orderNo: string;
  supplierId: number;
  supplierName: string;
  invoiceReference: string;
  shipmentDate: string;
  orderDate: string;
  expectedDate: string;
  paymentMethod: PurchasePaymentMethod;
  status: PurchaseOrderStatus;
  notes: string;
  source: 'Manual' | 'OCR';
  items: PurchaseLineItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  receivedAt?: string;
  cancelledAt?: string;
};

export type PurchaseReturnLine = {
  id: string;
  medicine: string;
  receivedQty: number;
  returnQty: number;
  reason: PurchaseReturnReason;
};

export type PurchaseReturn = {
  id: string;
  orderId: string;
  orderNo: string;
  returnDate: string;
  status: 'Submitted' | 'Approved' | 'Rejected';
  notes: string;
  items: PurchaseReturnLine[];
  totalReturned: number;
};

export type PurchaseExpense = {
  id: string;
  type: string;
  amount: number;
  date: string;
  notes: string;
};

export type PurchaseDraft = {
  editingOrderId: string | null;
  supplierId: number | null;
  supplierName: string;
  invoiceReference: string;
  shipmentDate: string;
  orderDate: string;
  expectedDate: string;
  paymentMethod: PurchasePaymentMethod;
  notes: string;
  items: PurchaseLineItem[];
  source: 'Manual' | 'OCR';
  ocrText: string;
  ocrFileName: string;
  ocrConfidence: number;
};

export type PurchaseQuickAction = {
  title: string;
  description: string;
  href: string;
  tone: PurchaseTone;
  icon: ComponentType<{ className?: string }>;
};

export const purchasePaymentMethods: PurchasePaymentMethod[] = [
  'Cash',
  'Credit',
  'Bank Transfer',
  'Card',
  'Mobile Wallet',
];

export const purchaseExpenseTypes = [
  'Freight',
  'Transport',
  'Packaging',
  'Clearing',
  'Loading / Unloading',
  'Repair',
  'Miscellaneous',
];

export const purchaseReturnReasons: PurchaseReturnReason[] = [
  'Damaged',
  'Expired',
  'Wrong Item',
  'Short Supply',
  'Overstock',
  'Price Issue',
];

export const purchaseQuickActions: PurchaseQuickAction[] = [
  {
    title: 'New Purchase Order',
    description: 'Create a new manual purchase order.',
    href: '/modules/purchases/new',
    tone: 'purple',
    icon: ScanSearch,
  },
  {
    title: 'Purchase Order List',
    description: 'Search, filter and manage purchase orders.',
    href: '/modules/purchases/list',
    tone: 'blue',
    icon: ListOrdered,
  },
  {
    title: 'OCR Auto Fill',
    description: 'Upload a bill image and fill the form automatically.',
    href: '/modules/purchases/ocr',
    tone: 'orange',
    icon: FileScan,
  },
  {
    title: 'Receive Purchase',
    description: 'Receive stock against an order.',
    href: '/modules/purchases/receive',
    tone: 'green',
    icon: Truck,
  },
  {
    title: 'Suppliers',
    description: 'Manage supplier records and balances.',
    href: '/modules/purchases/suppliers',
    tone: 'sky',
    icon: PackageSearch,
  },
  {
    title: 'Purchase Returns',
    description: 'Send damaged or expired items back.',
    href: '/modules/purchases/returns',
    tone: 'red',
    icon: RotateCcw,
  },
];

const basePurchaseSuppliers: PurchaseSupplier[] = [
  {
    id: 1,
    name: 'FnS & CO.',
    phone: '0300-1234567',
    email: 'fns.co@suppliers.local',
    city: 'Karachi',
    contactPerson: 'FnS Sales Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-09-01',
    notes: 'Distributor & Wholesaler.',
  },
  {
    id: 2,
    name: 'FnS & CO. (Al Momin Hosp Phar HUSSAINABAD)',
    phone: '0300-1820001',
    email: 'almomin@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Al Momin Pharmacy Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-08-25',
    notes: 'Party Code: 182 Al Momin Hosp Phar HUSSAINABAD - FnS & CO.',
  },
  {
    id: 3,
    name: 'FnS & CO. (DICOUNT MEDICAL STORE HUSSAINABAD)',
    phone: '0300-1810002',
    email: 'discountmed@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Discount Medical Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-08-25',
    notes: 'Party Code: 181 DICOUNT MEDICAL AND GENERAL STORE HUSSAINABAD - FnS & CO.',
  },
  {
    id: 4,
    name: 'FnS & CO. (KAUSER MEDICAL STORE HUSSAINABAD)',
    phone: '0300-1810003',
    email: 'kausermed@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Kauser Medical Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-08-25',
    notes: 'Party Code: 181 KAUSER MEDICAL STORE HUSSAINABAD - FnS & CO.',
  },
  {
    id: 5,
    name: 'FnS & CO. (Kashif medical store aisha manzil)',
    phone: '0300-1850004',
    email: 'kashifmed@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Kashif Medical Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-08-26',
    notes: 'Party Code: 185 Kashif medical store aisha manzil - FnS & CO.',
  },
  {
    id: 6,
    name: 'FnS & CO. (Real medical & general store nazimabad)',
    phone: '0300-1850005',
    email: 'realmed@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Real Medical Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-09-01',
    notes: 'Party Code: 185 Real medical & general store nazimabad - FnS & CO.',
  },
  {
    id: 7,
    name: 'FnS & CO. (Agha mart & pharmacy Nazimabad)',
    phone: '0300-1860006',
    email: 'aghamart@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Agha Mart Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-09-01',
    notes: 'Party Code: 186 Agha mart & pharmacy Nazimabad - FnS & CO.',
  },
  {
    id: 8,
    name: 'FnS & CO. (RAFA E-AM HOSPITAL PHAR, KARACHI)',
    phone: '0300-1040007',
    email: 'rafaeam@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Rafa E-Am Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-08-25',
    notes: 'Party Code: 104 RAFA E-AM HOSPITAL PHAR, KARACHI - FnS & CO.',
  },
  {
    id: 9,
    name: 'FnS & CO. (PAYJEES MEDICAL BLOCK 12 GULBERG TOWN)',
    phone: '0300-1010008',
    email: 'payjees@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Payjees Medical Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-08-25',
    notes: 'Party Code: 101 PAYJEES MEDICAL BLOCK 12 GULBERG TOWN - FnS & CO.',
  },
  {
    id: 10,
    name: 'FnS & CO. (The medicos sindhi muslim society)',
    phone: '0300-1830010',
    email: 'themedicos@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'The Medicos Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-09-01',
    notes: 'Party Code: 183 The medicos sindhi muslim society - FnS & CO.',
  },
  {
    id: 11,
    name: 'FnS & CO. (Medify pharmacy nasirabad)',
    phone: '0300-1840011',
    email: 'medify@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Medify Pharmacy Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-09-01',
    notes: 'Party Code: 184 Medify pharmacy nasirabad - FnS & CO.',
  },
  {
    id: 12,
    name: 'FnS & CO. (Al shaikh medical store GULSHAN-E-IQBAL)',
    phone: '0300-1820012',
    email: 'alshaikh@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Al Shaikh Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-09-01',
    notes: 'Party Code: 182 Al shaikh medical store GULSHAN-E-IQBAL - FnS & CO.',
  },
  {
    id: 13,
    name: 'FnS & CO. (zain pharmacy F.B AREA)',
    phone: '0300-1810013',
    email: 'zainpharmacy@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Zain Pharmacy Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-09-01',
    notes: 'Party Code: 181 zain pharmacy F.B AREA - FnS & CO.',
  },
  {
    id: 14,
    name: 'FnS & CO. (Rayyan medical and General store Dastagir)',
    phone: '0300-1830014',
    email: 'rayyan@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Rayyan Medical Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-08-26',
    notes: 'Party Code: 183 Rayyan medical and General store Dastagir - FnS & CO.',
  },
  {
    id: 15,
    name: 'FnS & CO. (Al shifa Medical & general store Dastagir)',
    phone: '0300-1840015',
    email: 'alshifa@pharmacy.local',
    city: 'Karachi',
    contactPerson: 'Al Shifa Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: '2026-08-26',
    notes: 'Party Code: 184 Al shifa Medical & general store Dastagir - FnS & CO.',
  },
  {
    id: 16,
    name: 'Global Mart Suppliers',
    phone: '0300-1111111',
    email: 'globalmart@suppliers.local',
    city: 'Karachi',
    contactPerson: 'Global Mart Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'Restored default supplier.',
  },
  {
    id: 17,
    name: 'MediPlus',
    phone: '0300-2222222',
    email: 'mediplus@suppliers.local',
    city: 'Karachi',
    contactPerson: 'MediPlus Sales',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'Restored default supplier.',
  },
  {
    id: 18,
    name: 'HealthCare',
    phone: '0300-3333333',
    email: 'healthcare@suppliers.local',
    city: 'Karachi',
    contactPerson: 'HealthCare Desk',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'Restored default supplier.',
  },
  {
    id: 19,
    name: 'City Pharma',
    phone: '0300-4444444',
    email: 'citypharma@suppliers.local',
    city: 'Karachi',
    contactPerson: 'City Pharma Sales',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'Restored default supplier.',
  },
  {
    id: 20,
    name: 'Pak Distribution Co.',
    phone: '0301-5550201',
    email: 'pakdistribution@suppliers.local',
    city: 'Lahore',
    contactPerson: 'Rizwan Malik',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'Regional medicine distributor.',
  },
  {
    id: 21,
    name: 'Noor Enterprises',
    phone: '0302-5550202',
    email: 'noorenterprises@suppliers.local',
    city: 'Karachi',
    contactPerson: 'Noor Ahmed',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'General pharmacy supplies.',
  },
  {
    id: 22,
    name: 'Star Supplies',
    phone: '0303-5550203',
    email: 'starsupplies@suppliers.local',
    city: 'Rawalpindi',
    contactPerson: 'Bilal Raza',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'OTC and wellness items.',
  },
  {
    id: 23,
    name: 'Al-Hamd Traders',
    phone: '0304-5550204',
    email: 'alhamdtraders@suppliers.local',
    city: 'Faisalabad',
    contactPerson: 'Hassan Iqbal',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'Bulk purchase supplier.',
  },
  {
    id: 24,
    name: 'Prime Medix',
    phone: '0305-5550205',
    email: 'primemedix@suppliers.local',
    city: 'Islamabad',
    contactPerson: 'Ayesha Farooq',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'Prescription medicine distributor.',
  },
  {
    id: 25,
    name: 'CareLine Pharma',
    phone: '0306-5550206',
    email: 'carelinepharma@suppliers.local',
    city: 'Multan',
    contactPerson: 'Tahir Abbas',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'Monthly restock supplier.',
  },
  {
    id: 26,
    name: 'Shifa Medical Traders',
    phone: '0307-5550207',
    email: 'shifamedical@suppliers.local',
    city: 'Peshawar',
    contactPerson: 'Mariam Khan',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'Medical and surgical items.',
  },
  {
    id: 27,
    name: 'Green Cross Wholesale',
    phone: '0308-5550208',
    email: 'greencross@suppliers.local',
    city: 'Hyderabad',
    contactPerson: 'Usman Tariq',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'Wholesale pharmacy products.',
  },
  {
    id: 28,
    name: 'Nexus Health Supplies',
    phone: '0309-5550209',
    email: 'nexushealth@suppliers.local',
    city: 'Quetta',
    contactPerson: 'Sana Qureshi',
    status: 'Inactive',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'Backup supplier for urgent orders.',
  },
  {
    id: 29,
    name: 'MedStar Agencies',
    phone: '0310-5550210',
    email: 'medstaragencies@suppliers.local',
    city: 'Sialkot',
    contactPerson: 'Kamran Javed',
    status: 'Active',
    balance: 0,
    lastOrderDate: todayIso(),
    notes: 'Agency stock and special orders.',
  },
];

function ensureSupplierCount(suppliers: PurchaseSupplier[], targetCount: number): PurchaseSupplier[] {
  if (suppliers.length >= targetCount) {
    return suppliers.slice(0, targetCount);
  }

  const names = [
    'Unity Pharma Wholesale',
    'Apex Medical Distribution',
    'Crescent Drug House',
    'Sehat Care Traders',
    'Blue Ribbon Pharma',
    'Metro Health Supplies',
    'Capital Medicine Co.',
    'LifeLine Distributors',
  ];
  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Hyderabad'];
  const generated = [...suppliers];

  for (let index = 1; generated.length < targetCount; index += 1) {
    const id = generated.reduce((max, supplier) => Math.max(max, supplier.id), 0) + 1;
    const name = names[(index - 1) % names.length];
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '');

    generated.push({
      id,
      name,
      phone: `031${index % 10}-555${String(210 + index).padStart(4, '0')}`,
      email: `${slug}@suppliers.local`,
      city: cities[(index - 1) % cities.length],
      contactPerson: `${name.split(' ')[0]} Desk`,
      status: index % 7 === 0 ? 'Inactive' : 'Active',
      balance: 0,
      lastOrderDate: todayIso(),
      notes: 'Generated demo supplier.',
    });
  }

  return generated;
}

export const seedPurchaseSuppliers: PurchaseSupplier[] = ensureSupplierCount(basePurchaseSuppliers, 20);

export const seedPurchaseReturns: PurchaseReturn[] = [];

export const seedPurchaseExpenses: PurchaseExpense[] = [];

export function purchaseOrderIdFor(orderNo: string) {
  return `purchase-${orderNo.replace(/[^0-9]+/g, '') || orderNo.toLowerCase()}`;
}

export function purchaseOrderNumber(sequence: number) {
  return `PO-${String(sequence).padStart(5, '0')}`;
}

export function formatPurchaseCurrency(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPurchaseCurrencyLabel(value: number) {
  return `PKR ${formatPurchaseCurrency(value)}`;
}

export function formatPurchaseDate(value: string) {
  return formatDate(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatPurchaseDateTime(value: string) {
  return formatDate(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function calculateLineTotal(item: PurchaseLineItem) {
  return summarizePurchaseLineItem(item).netAmount;
}

export function calculateOrderTotals(items: PurchaseLineItem[]) {
  const summaries = items.map((item) => summarizePurchaseLineItem(item));
  const subtotal = roundMoney(summaries.reduce((sum, summary) => sum + summary.baseAmount, 0));
  const discountTotal = roundMoney(summaries.reduce((sum, summary) => sum + summary.discountAmount, 0));
  const total = roundMoney(summaries.reduce((sum, summary) => sum + summary.netAmount, 0));
  return { subtotal, discountTotal, total };
}

export function summarizePurchaseLineItem(item: PurchaseLineItem): PurchaseLineSummary {
  const qty = Math.max(0, Math.floor(Number(item.qty) || 0));
  const bonusQty = Math.max(0, Math.floor(Number(item.bonusQty) || 0));
  const purchasePrice = roundMoney(Number(item.purchasePrice) || 0);
  const baseAmount = roundMoney(Math.max(0, qty * purchasePrice));
  const discountAmount = roundMoney(Math.max(0, Number(item.discount) || 0) + Math.max(0, Number(item.prodDiscountAmount) || 0));
  const taxAmount = roundMoney(Math.max(0, Number(item.salesTaxAmount) || 0) + Math.max(0, Number(item.aiTaxAmount) || 0));
  const netAmount = roundMoney(Math.max(0, baseAmount - discountAmount + taxAmount));
  const totalQty = qty + bonusQty;
  const effectiveCostPerUnit = totalQty > 0 ? roundMoney(netAmount / totalQty) : 0;

  return {
    baseAmount,
    discountAmount,
    taxAmount,
    netAmount,
    totalQty,
    effectiveCostPerUnit,
  };
}

export function createDraftLineItem(id: string, patch: Partial<PurchaseLineItem> = {}): PurchaseLineItem {
  const qty = Math.max(0, Math.floor(Number(patch.qty) || 0));
  const bonusQty = Math.max(0, Math.floor(Number(patch.bonusQty) || 0));
  const purchasePrice = roundMoney(Number(patch.purchasePrice) || 0);
  const discount = roundMoney(Math.max(0, Number(patch.discount) || 0));
  const prodDiscountAmount = roundMoney(Math.max(0, Number(patch.prodDiscountAmount) || 0));
  const salesTaxAmount = roundMoney(Math.max(0, Number(patch.salesTaxAmount) || 0));
  const aiTaxAmount = roundMoney(Math.max(0, Number(patch.aiTaxAmount) || 0));
  return {
    id,
    itemCode: patch.itemCode ?? '',
    medicine: patch.medicine ?? '',
    pack: patch.pack ?? '',
    qty,
    bonusQty,
    purchasePrice,
    discount,
    discountPercent: Math.max(0, Number(patch.discountPercent) || 0),
    gstPercent: Math.max(0, Number(patch.gstPercent) || 0),
    fTaxPercent: Math.max(0, Number(patch.fTaxPercent) || 0),
    nonAtlPercent: Math.max(0, Number(patch.nonAtlPercent) || 0),
    advTaxPercent: Math.max(0, Number(patch.advTaxPercent) || 0),
    atlStatus: patch.atlStatus === 'Non-ATL' ? 'Non-ATL' : 'ATL',
    remarks: patch.remarks ?? '',
    tpValue: roundMoney(Number(patch.tpValue) || 0),
    mrpValue: roundMoney(Number(patch.mrpValue) || 0),
    prodDiscountAmount,
    salesTaxAmount,
    aiTaxAmount,
    receiveQty: patch.receiveQty === undefined ? undefined : Math.max(0, Math.floor(Number(patch.receiveQty) || 0)),
    batchNo: patch.batchNo ? patch.batchNo : undefined,
    mfgDate: patch.mfgDate ? patch.mfgDate : undefined,
    expiryDate: patch.expiryDate ? patch.expiryDate : undefined,
  };
}

export function createBlankPurchaseDraft(): PurchaseDraft {
  const orderDate = todayIso();
  return {
    editingOrderId: null,
    supplierId: null,
    supplierName: '',
    invoiceReference: '',
    shipmentDate: orderDate,
    orderDate,
    expectedDate: addDaysIso(orderDate, 7),
    paymentMethod: 'Credit',
    notes: '',
    items: [createDraftLineItem('draft-1')],
    source: 'Manual',
    ocrText: '',
    ocrFileName: '',
    ocrConfidence: 0,
  };
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(value: string, days: number) {
  const date = parsePurchaseDate(value) ?? new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function shiftDaysIso(value: string, days: number) {
  return addDaysIso(value, days);
}

export function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions,
) {
  const date = parsePurchaseDate(value);
  if (!date) {
    return value || '-';
  }
  return new Intl.DateTimeFormat('en-GB', options).format(date);
}

function parsePurchaseDate(value: string) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return null;
  }

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const dateOnly = new Date(`${trimmed}T00:00:00`);
  if (!Number.isNaN(dateOnly.getTime())) {
    return dateOnly;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]) - 1;
    const year = normalizeYear(Number(slashMatch[3]));
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const textMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{2,4})$/);
  if (textMatch) {
    const day = Number(textMatch[1]);
    const month = monthIndexFor(textMatch[2]);
    const year = normalizeYear(Number(textMatch[3]));
    if (month >= 0) {
      const parsed = new Date(year, month, day);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  return null;
}

function normalizeYear(year: number) {
  if (year < 100) {
    return 2000 + year;
  }

  return year;
}

function monthIndexFor(value: string) {
  const month = value.toLowerCase().slice(0, 3);
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return months.indexOf(month);
}

function lineItem(
  id: string,
  medicine: string,
  pack: string,
  qty: number,
  purchasePrice: number,
  discount: number,
  receiveQty?: number,
  batchNo?: string,
  expiryDate?: string,
): PurchaseLineItem {
  return createDraftLineItem(id, {
    medicine,
    pack,
    qty,
    purchasePrice,
    discount,
    receiveQty,
    batchNo,
    expiryDate,
  });
}

function makeOrder(
  order: Omit<PurchaseOrder, 'subtotal' | 'discountTotal' | 'total' | 'createdAt' | 'updatedAt' | 'invoiceReference' | 'shipmentDate'> & {
    invoiceReference?: string;
    shipmentDate?: string;
    createdAt?: string;
    updatedAt?: string;
  },
): PurchaseOrder {
  const totals = calculateOrderTotals(order.items);
  const createdAt = order.createdAt ?? `${order.orderDate}T10:30:00`;
  const updatedAt = order.updatedAt ?? createdAt;
  const invoiceReference = order.invoiceReference ?? `INV-${order.orderDate.slice(0, 4)}-${order.orderNo.replace(/[^0-9]/g, '') || order.orderNo}`;
  const shipmentDate = order.shipmentDate ?? order.orderDate;

  return {
    ...order,
    invoiceReference,
    shipmentDate,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    total: totals.total,
    createdAt,
    updatedAt,
  };
}

export const seedPurchaseOrders: PurchaseOrder[] = [
  makeOrder({
    id: 'purchase-171-1',
    orderNo: 'PO-00171-1',
    supplierId: 2,
    supplierName: 'FnS & CO. (Al Momin Hosp Phar HUSSAINABAD)',
    invoiceReference: '171',
    shipmentDate: '2026-08-25',
    orderDate: '2026-08-25',
    expectedDate: '2026-08-25',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 182 Al Momin Hosp Phar HUSSAINABAD. FnS & CO. Invoice #171',
    source: 'Manual',
    items: [
      createDraftLineItem('po-171-1-item-1', {
        itemCode: 'BS-001',
        medicine: 'BABY SPOON',
        pack: 'SINGLE PAC',
        qty: 100,
        bonusQty: 0,
        purchasePrice: 40,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 20,
        receiveQty: 100,
        batchNo: 'B-S 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-08-25T10:30:00',
    updatedAt: '2026-08-25T10:30:00',
    receivedAt: '2026-08-25T11:00:00',
  }),
  makeOrder({
    id: 'purchase-174',
    orderNo: 'PO-00174',
    supplierId: 3,
    supplierName: 'FnS & CO. (DICOUNT MEDICAL STORE HUSSAINABAD)',
    invoiceReference: '174',
    shipmentDate: '2026-08-25',
    orderDate: '2026-08-25',
    expectedDate: '2026-08-25',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 181 DICOUNT MEDICAL AND GENERAL STORE HUSSAINABAD. FnS & CO. Invoice #174',
    source: 'Manual',
    items: [
      createDraftLineItem('po-174-item-1', {
        itemCode: 'BS-001',
        medicine: 'BABY SPOON',
        pack: 'SINGLE PAC',
        qty: 10,
        bonusQty: 2,
        purchasePrice: 50,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.5,
        receiveQty: 10,
        batchNo: 'B-S 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-08-25T11:15:00',
    updatedAt: '2026-08-25T11:15:00',
    receivedAt: '2026-08-25T11:45:00',
  }),
  makeOrder({
    id: 'purchase-171-2',
    orderNo: 'PO-00171-2',
    supplierId: 4,
    supplierName: 'FnS & CO. (KAUSER MEDICAL STORE HUSSAINABAD)',
    invoiceReference: '171-KSR',
    shipmentDate: '2026-08-25',
    orderDate: '2026-08-25',
    expectedDate: '2026-08-25',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 181 KAUSER MEDICAL STORE HUSSAINABAD. FnS & CO. Invoice #171',
    source: 'Manual',
    items: [
      createDraftLineItem('po-171-2-item-1', {
        itemCode: 'BS-001',
        medicine: 'BABY SPOON',
        pack: 'SINGLE PAC',
        qty: 10,
        bonusQty: 1,
        purchasePrice: 50,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.5,
        receiveQty: 10,
        batchNo: 'B-S 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
      createDraftLineItem('po-171-2-item-2', {
        itemCode: 'BC-001',
        medicine: 'BABY COMF',
        pack: 'SINGLE PAC',
        qty: 5,
        bonusQty: 0,
        purchasePrice: 531,
        discount: 132.75,
        discountPercent: 5,
        advTaxPercent: 0.5,
        aiTaxAmount: 12.6,
        receiveQty: 5,
        batchNo: 'B-C 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-08-25T12:00:00',
    updatedAt: '2026-08-25T12:00:00',
    receivedAt: '2026-08-25T12:30:00',
  }),
  makeOrder({
    id: 'purchase-180-1',
    orderNo: 'PO-00180-1',
    supplierId: 5,
    supplierName: 'FnS & CO. (Kashif medical store aisha manzil)',
    invoiceReference: '180-KSH',
    shipmentDate: '2026-08-26',
    orderDate: '2026-08-26',
    expectedDate: '2026-08-26',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 185 Kashif medical store aisha manzil. FnS & CO. Invoice #180',
    source: 'Manual',
    items: [
      createDraftLineItem('po-180-1-item-1', {
        itemCode: 'BC-001',
        medicine: 'BABY COMF',
        pack: 'SINGLE PAC',
        qty: 5,
        bonusQty: 1,
        purchasePrice: 531,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 13.2,
        receiveQty: 5,
        batchNo: 'B-C 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-08-26T14:00:00',
    updatedAt: '2026-08-26T14:00:00',
    receivedAt: '2026-08-26T14:30:00',
  }),
  makeOrder({
    id: 'purchase-179',
    orderNo: 'PO-00179',
    supplierId: 6,
    supplierName: 'FnS & CO. (Real medical & general store nazimabad)',
    invoiceReference: '179',
    shipmentDate: '2026-09-01',
    orderDate: '2026-09-01',
    expectedDate: '2026-09-01',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 185 Real medical & general store nazimabad. FnS & CO. Invoice #179',
    source: 'Manual',
    items: [
      createDraftLineItem('po-179-item-1', {
        itemCode: 'BS-001',
        medicine: 'BABY SPOON',
        pack: 'SINGLE PAC',
        qty: 10,
        bonusQty: 1,
        purchasePrice: 50,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.5,
        receiveQty: 10,
        batchNo: 'B-S 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
      createDraftLineItem('po-179-item-2', {
        itemCode: 'BC-001',
        medicine: 'BABY COMF',
        pack: 'SINGLE PAC',
        qty: 1,
        bonusQty: 0,
        purchasePrice: 531,
        discount: 53.1,
        discountPercent: 10,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.3,
        receiveQty: 1,
        batchNo: 'B-C 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-09-01T09:30:00',
    updatedAt: '2026-09-01T09:30:00',
    receivedAt: '2026-09-01T10:00:00',
  }),
  makeOrder({
    id: 'purchase-180-2',
    orderNo: 'PO-00180-2',
    supplierId: 7,
    supplierName: 'FnS & CO. (Agha mart & pharmacy Nazimabad)',
    invoiceReference: '180-AGH',
    shipmentDate: '2026-09-01',
    orderDate: '2026-09-01',
    expectedDate: '2026-09-01',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 186 Agha mart & pharmacy Nazimabad. FnS & CO. Invoice #180',
    source: 'Manual',
    items: [
      createDraftLineItem('po-180-2-item-1', {
        itemCode: 'BS-001',
        medicine: 'BABY SPOON',
        pack: 'SINGLE PAC',
        qty: 10,
        bonusQty: 1,
        purchasePrice: 50,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.5,
        receiveQty: 10,
        batchNo: 'B-S 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-09-01T11:00:00',
    updatedAt: '2026-09-01T11:00:00',
    receivedAt: '2026-09-01T11:30:00',
  }),
  makeOrder({
    id: 'purchase-171-3',
    orderNo: 'PO-00171-3',
    supplierId: 8,
    supplierName: 'FnS & CO. (RAFA E-AM HOSPITAL PHAR, KARACHI)',
    invoiceReference: '171-RFA',
    shipmentDate: '2026-08-25',
    orderDate: '2026-08-25',
    expectedDate: '2026-08-25',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 104 RAFA E-AM HOSPITAL PHAR, KARACHI. FnS & CO. Invoice #171',
    source: 'Manual',
    items: [
      createDraftLineItem('po-171-3-item-1', {
        itemCode: 'BC-001',
        medicine: 'BABY COMF',
        pack: 'SINGLE PAC',
        qty: 10,
        bonusQty: 1,
        purchasePrice: 501.5,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 25,
        receiveQty: 10,
        batchNo: 'B-C 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-08-25T15:00:00',
    updatedAt: '2026-08-25T15:00:00',
    receivedAt: '2026-08-25T15:30:00',
  }),
  makeOrder({
    id: 'purchase-172',
    orderNo: 'PO-00172',
    supplierId: 9,
    supplierName: 'FnS & CO. (PAYJEES MEDICAL BLOCK 12 GULBERG TOWN)',
    invoiceReference: '172',
    shipmentDate: '2026-08-25',
    orderDate: '2026-08-25',
    expectedDate: '2026-08-25',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 101 PAYJEES MEDICAL BLOCK 12 GULBERG TOWN. FnS & CO. Invoice #172',
    source: 'Manual',
    items: [
      createDraftLineItem('po-172-item-1', {
        itemCode: 'BC-001',
        medicine: 'BABY COMF',
        pack: 'SINGLE PAC',
        qty: 1,
        bonusQty: 0,
        purchasePrice: 531,
        discount: 26.55,
        discountPercent: 5,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.55,
        receiveQty: 1,
        batchNo: 'B-C 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-08-25T16:30:00',
    updatedAt: '2026-08-25T16:30:00',
    receivedAt: '2026-08-25T17:00:00',
  }),
  makeOrder({
    id: 'purchase-177',
    orderNo: 'PO-00177',
    supplierId: 10,
    supplierName: 'FnS & CO. (The medicos sindhi muslim society)',
    invoiceReference: '177',
    shipmentDate: '2026-09-01',
    orderDate: '2026-09-01',
    expectedDate: '2026-09-01',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 183 The medicos sindhi muslim society. FnS & CO. Invoice #177',
    source: 'Manual',
    items: [
      createDraftLineItem('po-177-item-1', {
        itemCode: 'BS-001',
        medicine: 'BABY SPOON',
        pack: 'SINGLE PAC',
        qty: 10,
        bonusQty: 1,
        purchasePrice: 50,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.5,
        receiveQty: 10,
        batchNo: 'B-S 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
      createDraftLineItem('po-177-item-2', {
        itemCode: 'BC-001',
        medicine: 'BABY COMF',
        pack: 'SINGLE PAC',
        qty: 1,
        bonusQty: 0,
        purchasePrice: 531,
        discount: 53.1,
        discountPercent: 10,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.3,
        receiveQty: 1,
        batchNo: 'B-C 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-09-01T12:00:00',
    updatedAt: '2026-09-01T12:00:00',
    receivedAt: '2026-09-01T12:30:00',
  }),
  makeOrder({
    id: 'purchase-178',
    orderNo: 'PO-00178',
    supplierId: 11,
    supplierName: 'FnS & CO. (Medify pharmacy nasirabad)',
    invoiceReference: '178',
    shipmentDate: '2026-09-01',
    orderDate: '2026-09-01',
    expectedDate: '2026-09-01',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 184 Medify pharmacy nasirabad. FnS & CO. Invoice #178',
    source: 'Manual',
    items: [
      createDraftLineItem('po-178-item-1', {
        itemCode: 'BS-001',
        medicine: 'BABY SPOON',
        pack: 'SINGLE PAC',
        qty: 10,
        bonusQty: 1,
        purchasePrice: 50,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.5,
        receiveQty: 10,
        batchNo: 'B-S 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
      createDraftLineItem('po-178-item-2', {
        itemCode: 'BC-001',
        medicine: 'BABY COMF',
        pack: 'SINGLE PAC',
        qty: 1,
        bonusQty: 0,
        purchasePrice: 531,
        discount: 53.1,
        discountPercent: 10,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.3,
        receiveQty: 1,
        batchNo: 'B-C 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-09-01T13:00:00',
    updatedAt: '2026-09-01T13:00:00',
    receivedAt: '2026-09-01T13:30:00',
  }),
  makeOrder({
    id: 'purchase-175',
    orderNo: 'PO-00175',
    supplierId: 12,
    supplierName: 'FnS & CO. (Al shaikh medical store GULSHAN-E-IQBAL)',
    invoiceReference: '175',
    shipmentDate: '2026-09-01',
    orderDate: '2026-09-01',
    expectedDate: '2026-09-01',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 182 Al shaikh medical store GULSHAN-E-IQBAL. FnS & CO. Invoice #175',
    source: 'Manual',
    items: [
      createDraftLineItem('po-175-item-1', {
        itemCode: 'BC-001',
        medicine: 'BABY COMF',
        pack: 'SINGLE PAC',
        qty: 5,
        bonusQty: 1,
        purchasePrice: 531,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 13.2,
        receiveQty: 5,
        batchNo: 'B-C 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-09-01T14:00:00',
    updatedAt: '2026-09-01T14:00:00',
    receivedAt: '2026-09-01T14:30:00',
  }),
  makeOrder({
    id: 'purchase-176',
    orderNo: 'PO-00176',
    supplierId: 13,
    supplierName: 'FnS & CO. (zain pharmacy F.B AREA)',
    invoiceReference: '176',
    shipmentDate: '2026-09-01',
    orderDate: '2026-09-01',
    expectedDate: '2026-09-01',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 181 zain pharmacy F.B AREA. FnS & CO. Invoice #176',
    source: 'Manual',
    items: [
      createDraftLineItem('po-176-item-1', {
        itemCode: 'BS-001',
        medicine: 'BABY SPOON',
        pack: 'SINGLE PAC',
        qty: 10,
        bonusQty: 1,
        purchasePrice: 50,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.5,
        receiveQty: 10,
        batchNo: 'B-S 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
      createDraftLineItem('po-176-item-2', {
        itemCode: 'BC-001',
        medicine: 'BABY COMF',
        pack: 'SINGLE PAC',
        qty: 1,
        bonusQty: 0,
        purchasePrice: 531,
        discount: 53.1,
        discountPercent: 10,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.3,
        receiveQty: 1,
        batchNo: 'B-C 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-09-01T15:00:00',
    updatedAt: '2026-09-01T15:00:00',
    receivedAt: '2026-09-01T15:30:00',
  }),
  makeOrder({
    id: 'purchase-181',
    orderNo: 'PO-00181',
    supplierId: 14,
    supplierName: 'FnS & CO. (Rayyan medical and General store Dastagir)',
    invoiceReference: '181',
    shipmentDate: '2026-08-26',
    orderDate: '2026-08-26',
    expectedDate: '2026-08-26',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 183 Rayyan medical and General store Dastagir. FnS & CO. Invoice #181',
    source: 'Manual',
    items: [
      createDraftLineItem('po-181-item-1', {
        itemCode: 'BS-001',
        medicine: 'BABY SPOON',
        pack: 'SINGLE PAC',
        qty: 10,
        bonusQty: 1,
        purchasePrice: 50,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.5,
        receiveQty: 10,
        batchNo: 'B-S 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-08-26T16:00:00',
    updatedAt: '2026-08-26T16:00:00',
    receivedAt: '2026-08-26T16:30:00',
  }),
  makeOrder({
    id: 'purchase-182',
    orderNo: 'PO-00182',
    supplierId: 15,
    supplierName: 'FnS & CO. (Al shifa Medical & general store Dastagir)',
    invoiceReference: '182',
    shipmentDate: '2026-08-26',
    orderDate: '2026-08-26',
    expectedDate: '2026-08-26',
    paymentMethod: 'Credit',
    status: 'Received',
    notes: 'Party: 184 Al shifa Medical & general store Dastagir. FnS & CO. Invoice #182',
    source: 'Manual',
    items: [
      createDraftLineItem('po-182-item-1', {
        itemCode: 'BS-001',
        medicine: 'BABY SPOON',
        pack: 'SINGLE PAC',
        qty: 10,
        bonusQty: 1,
        purchasePrice: 50,
        discount: 0,
        discountPercent: 0,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.5,
        receiveQty: 10,
        batchNo: 'B-S 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
      createDraftLineItem('po-182-item-2', {
        itemCode: 'BC-001',
        medicine: 'BABY COMF',
        pack: 'SINGLE PAC',
        qty: 1,
        bonusQty: 0,
        purchasePrice: 501.5,
        discount: 25,
        discountPercent: 5,
        advTaxPercent: 0.5,
        aiTaxAmount: 2.3,
        receiveQty: 1,
        batchNo: 'B-C 001',
        expiryDate: '2029-08-01',
        atlStatus: 'ATL',
      }),
    ],
    createdAt: '2026-08-26T17:00:00',
    updatedAt: '2026-08-26T17:00:00',
    receivedAt: '2026-08-26T17:30:00',
  }),
];
