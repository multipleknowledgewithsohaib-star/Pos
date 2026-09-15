import {
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CreditCard,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { DEFAULT_MODULE_DATE_RANGE, type ModuleDateRange } from '@/lib/module-date-range';

export type ReportKey =
  | 'sales'
  | 'purchase'
  | 'inventory'
  | 'expiry'
  | 'profit-loss'
  | 'customer'
  | 'supplier'
  | 'tax'
  | 'payment';

export type ReportMode = 'date-filter' | 'filter-only';

export type ReportOverviewCard = {
  key: ReportKey;
  href: string;
  title: string;
  description: string;
  tone: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'sky' | 'pink' | 'yellow';
  icon: ComponentType<{ className?: string }>;
};

export type ReportConfig = {
  key: ReportKey;
  title: string;
  subtitle: string;
  mode: ReportMode;
};

export type SalesReportRow = {
  date: string;
  rank: number;
  medicine: string;
  quantitySold: number;
  totalSales: number;
  profit: number;
};

export type PurchaseReportRow = {
  date: string;
  rank: number;
  medicine: string;
  quantity: number;
  totalPurchase: number;
};

export type InventoryReportRow = {
  date: string;
  rank: number;
  medicine: string;
  batchNo: string;
  stock: number;
  unit: string;
  value: number;
  status: 'Normal Stock' | 'Low Stock' | 'Out of Stock' | 'Expiring Soon';
};

export type ExpiryReportRow = {
  date: string;
  rank: number;
  medicine: string;
  batchNo: string;
  expiryDate: string;
  daysLeft: number;
  stock: number;
  status: 'Expiring in 10 Days' | 'Expiring in 15 Days' | 'Expiring in 20 Days' | 'Expiring in 5 Days';
};

export type CustomerReportRow = {
  date: string;
  rank: number;
  customer: string;
  totalSales: number;
  paid: number;
  due: number;
};

export type SupplierReportRow = {
  date: string;
  rank: number;
  supplier: string;
  totalPurchases: number;
  paid: number;
  due: number;
};

export type TaxReportRow = {
  date: string;
  label: string;
  amount: number;
  emphasis?: 'positive' | 'negative' | 'neutral';
};

export type ProfitLossRow = {
  date: string;
  label: string;
  amount: number;
  emphasis?: 'positive' | 'negative' | 'neutral';
};

export type PaymentReportRow = {
  date: string;
  rank: number;
  reference: string;
  customer: string;
  method: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Refunded';
};

export type DonutSegment = {
  label: string;
  value: number;
  tone: 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'sky' | 'pink' | 'yellow';
};

export type ReportTrendPoint = {
  date: string;
  label: string;
  value: number;
};

export const defaultReportRange: ModuleDateRange = DEFAULT_MODULE_DATE_RANGE;
const reportBasePath = '/modules/reports';

export const reportOverviewCards: ReportOverviewCard[] = [
  {
    key: 'sales',
    href: `${reportBasePath}/sales`,
    title: 'Sales Report',
    description: 'View sales summary and trends',
    tone: 'green',
    icon: TrendingUp,
  },
  {
    key: 'purchase',
    href: `${reportBasePath}/purchase`,
    title: 'Purchase Report',
    description: 'View purchase summary and trends',
    tone: 'blue',
    icon: ShoppingCart,
  },
  {
    key: 'inventory',
    href: `${reportBasePath}/inventory`,
    title: 'Inventory Report',
    description: 'View inventory stock and valuation',
    tone: 'orange',
    icon: Package,
  },
  {
    key: 'expiry',
    href: `${reportBasePath}/expiry`,
    title: 'Expiry Report',
    description: 'View medicines near expiry',
    tone: 'red',
    icon: CalendarClock,
  },
  {
    key: 'profit-loss',
    href: `${reportBasePath}/profit-loss`,
    title: 'Profit & Loss Report',
    description: 'View profit and expense details',
    tone: 'purple',
    icon: ArrowUpRight,
  },
  {
    key: 'customer',
    href: `${reportBasePath}/customer`,
    title: 'Customer Report',
    description: 'View customer sales and due amounts',
    tone: 'sky',
    icon: Users,
  },
  {
    key: 'supplier',
    href: `${reportBasePath}/supplier`,
    title: 'Supplier Report',
    description: 'View supplier purchases and payments',
    tone: 'pink',
    icon: Truck,
  },
  {
    key: 'tax',
    href: `${reportBasePath}/tax`,
    title: 'Tax Report',
    description: 'View tax summary and details',
    tone: 'yellow',
    icon: FileText,
  },
  {
    key: 'payment',
    href: `${reportBasePath}/payment`,
    title: 'Payment Report',
    description: 'View all payment transactions',
    tone: 'blue',
    icon: Wallet,
  },
];

export const reportConfigs: Record<ReportKey, ReportConfig> = {
  sales: {
    key: 'sales',
    title: 'Sales Report',
    subtitle: 'Detailed sales report for selected period.',
    mode: 'date-filter',
  },
  purchase: {
    key: 'purchase',
    title: 'Purchase Report',
    subtitle: 'Detailed purchase report for selected period.',
    mode: 'date-filter',
  },
  inventory: {
    key: 'inventory',
    title: 'Inventory Report',
    subtitle: 'Current stock and inventory valuation.',
    mode: 'filter-only',
  },
  expiry: {
    key: 'expiry',
    title: 'Expiry Report',
    subtitle: 'Medicines near expiry and expired.',
    mode: 'filter-only',
  },
  'profit-loss': {
    key: 'profit-loss',
    title: 'Profit & Loss Report',
    subtitle: 'Business profit and loss statement.',
    mode: 'date-filter',
  },
  customer: {
    key: 'customer',
    title: 'Customer Report',
    subtitle: 'Customer sales and due report.',
    mode: 'filter-only',
  },
  supplier: {
    key: 'supplier',
    title: 'Supplier Report',
    subtitle: 'Supplier purchases and due report.',
    mode: 'filter-only',
  },
  tax: {
    key: 'tax',
    title: 'Tax Report',
    subtitle: 'Tax summary and details.',
    mode: 'date-filter',
  },
  payment: {
    key: 'payment',
    title: 'Payment Report',
    subtitle: 'All payment transactions and balances.',
    mode: 'date-filter',
  },
};

export const salesTrend: ReportTrendPoint[] = [];

export const salesReportRows: SalesReportRow[] = [];

export const purchaseTrend: ReportTrendPoint[] = [];

export const purchaseReportRows: PurchaseReportRow[] = [];

export const inventorySummary = {
  totalItems: 0,
  totalStockValue: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
};

export const inventoryBreakdown: DonutSegment[] = [];

export const inventoryReportRows: InventoryReportRow[] = [];

export const expirySummary = {
  expiring30: 0,
  expiring60: 0,
  expired: 0,
  totalAtRisk: 0,
};

export const expiryBreakdown: DonutSegment[] = [];

export const expiryReportRows: ExpiryReportRow[] = [];

export const customerReportRows: CustomerReportRow[] = [];

export const supplierReportRows: SupplierReportRow[] = [];

export const profitLossSummaryRows: ProfitLossRow[] = [];

export const profitLossMargin = 0;
export const profitLossBreakdown: DonutSegment[] = [];

export const taxSummaryRows: TaxReportRow[] = [];

export const paymentSummary = {
  totalPayments: 0,
  received: 0,
  pending: 0,
  overdue: 0,
};

export const paymentReportRows: PaymentReportRow[] = [];

export const reportRouteKeys: ReportKey[] = [
  'sales',
  'purchase',
  'inventory',
  'expiry',
  'profit-loss',
  'customer',
  'supplier',
  'tax',
  'payment',
];

export function getReportConfig(report: ReportKey) {
  return reportConfigs[report];
}

export const reportRowsByKey = {
  sales: salesReportRows,
  purchase: purchaseReportRows,
  inventory: inventoryReportRows,
  expiry: expiryReportRows,
  customer: customerReportRows,
  supplier: supplierReportRows,
  tax: taxSummaryRows,
  payment: paymentReportRows,
  'profit-loss': profitLossSummaryRows,
} as const;

export function getReportRows(report: ReportKey) {
  return reportRowsByKey[report];
}
