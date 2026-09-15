import { buildDemoMedicines } from './demo-seed.mjs';
import {
  BadgeDollarSign,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  DatabaseBackup,
  ArrowUpDown,
  Gauge,
  Package,
  ReceiptText,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  UsersRound,
} from 'lucide-react';
import type { ComponentType } from 'react';

export type ModuleNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export type ModuleStat = {
  label: string;
  value: string;
  helper: string;
  tone: 'purple' | 'green' | 'blue' | 'orange' | 'red';
  icon: ComponentType<{ className?: string }>;
};

export type Medicine = {
  id: number;
  sku?: string;
  medicineName: string;
  genericName: string;
  category: string;
  unit: string;
  stock: number;
  lowStock: number;
  purchasePrice?: number;
  price: number;
  description?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  active: boolean;
  seedIssue?: string;
};

export const moduleNavItems: ModuleNavItem[] = [
  { href: '/modules/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/modules/inventory', label: 'Inventory', icon: Boxes },
  { href: '/modules/pos', label: 'POS', icon: ReceiptText },
  { href: '/modules/purchases', label: 'Purchases', icon: ShoppingCart },
  { href: '/modules/purchases/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/modules/customers', label: 'Customers', icon: UsersRound },
  { href: '/modules/reports', label: 'Reports', icon: ClipboardList },
  { href: '/modules/dashboard#accounts', label: 'Accounts', icon: CreditCard },
  { href: '/modules/settings', label: 'Settings', icon: Settings },
  { href: '/modules/administration/import-export', label: 'Import / Export', icon: ArrowUpDown },
  { href: '/modules/backup-restore', label: 'Backup & Restore', icon: DatabaseBackup },
];

export const moduleStats: ModuleStat[] = [
  {
    label: 'Total Sales',
    value: 'PKR 0',
    helper: '0%',
    tone: 'purple',
    icon: BadgeDollarSign,
  },
  {
    label: 'Total Profit',
    value: 'PKR 0',
    helper: '0%',
    tone: 'green',
    icon: CircleDollarSign,
  },
  {
    label: 'Total Orders',
    value: '0',
    helper: '0%',
    tone: 'blue',
    icon: ShoppingBag,
  },
  {
    label: 'Low Stock Items',
    value: '0',
    helper: 'View',
    tone: 'orange',
    icon: Package,
  },
  {
    label: 'Expiring Soon',
    value: '0',
    helper: 'View',
    tone: 'purple',
    icon: ClipboardList,
  },
];

export const salesSeries = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export const topSellingItems: Array<{ label: string; value: number; color: string }> = [];

export const recentTransactions: Array<{ invoice: string; customer: string; amount: string; status: 'Paid' | 'Pending' }> = [];

export const stockSummary = [
  { label: 'Total Items', value: '0', tone: 'purple' },
  { label: 'In Stock', value: '0', tone: 'green' },
  { label: 'Low Stock', value: '0', tone: 'orange' },
  { label: 'Out of Stock', value: '0', tone: 'red' },
];

export const initialMedicines: Medicine[] = [
  {
    id: 1,
    sku: 'B-S 001',
    medicineName: 'BABY SPOON',
    genericName: 'Baby Spoon',
    category: 'Baby Care',
    unit: 'SINGLE PAC',
    stock: 1000,
    lowStock: 50,
    purchasePrice: 40,
    price: 50,
    description: 'Batch: B-S 001, Packing: SINGLE PAC',
    status: 'In Stock',
    active: true,
  },
  {
    id: 2,
    sku: 'B-C 001',
    medicineName: 'BABY COMF',
    genericName: 'Baby Comf',
    category: 'Baby Care',
    unit: 'SINGLE PAC',
    stock: 800,
    lowStock: 50,
    purchasePrice: 450,
    price: 531,
    description: 'Batch: B-C 001, Packing: SINGLE PAC',
    status: 'In Stock',
    active: true,
  },
];

export type ModuleSummaryCard = {
  label: string;
  value: string;
  tone: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'sky';
  icon: 'inventory' | 'stock' | 'alert' | 'out' | 'expiring' | 'value';
  href: string;
};

export const moduleInventorySummaryCards: ModuleSummaryCard[] = [
  { label: 'Total Medicines', value: '2', tone: 'blue', icon: 'inventory', href: '/modules/inventory/medicines' },
  { label: 'Total Stock (Items)', value: '1800', tone: 'green', icon: 'stock', href: '/modules/inventory/batch-details' },
  { label: 'Low Stock Items', value: '0', tone: 'orange', icon: 'alert', href: '/modules/inventory/low-stock' },
  { label: 'Out of Stock Items', value: '0', tone: 'red', icon: 'out', href: '/modules/inventory/low-stock' },
  { label: 'Expiring Soon', value: '0', tone: 'purple', icon: 'expiring', href: '/modules/inventory/expiring-soon' },
  { label: 'Total Value (PKR)', value: '474,800', tone: 'sky', icon: 'value', href: '/modules/inventory/history' },
];

export type ModuleExpiringSoonItem = {
  medicineName: string;
  batchNo: string;
  expiryDate: string;
  daysLeft: string;
  tone: 'orange' | 'green';
};

export const moduleExpiringSoonItems: ModuleExpiringSoonItem[] = [];

export type ModuleLowStockItem = {
  medicineName: string;
  batchNo: string;
  stock: number;
  alert: number;
  status: 'Low Stock';
};

export const moduleLowStockItems: ModuleLowStockItem[] = [];

export type ModuleHistoryItem = {
  dateTime: string;
  activityType: 'Stock Added' | 'Stock Adjustment' | 'Stock Transfer';
  medicine: string;
  batchNo: string;
  quantity: string;
  user: string;
  note: string;
};

export const moduleHistoryItems: ModuleHistoryItem[] = [];

export type ModuleBatchSummary = {
  medicineName: string;
  totalStock: string;
  lowStockAlert: string;
  unit: string;
};

export const moduleBatchSummary: ModuleBatchSummary = {
  medicineName: 'All Medicines',
  totalStock: '1800',
  lowStockAlert: '20',
  unit: 'SINGLE PAC',
};

export type ModuleBatchRow = {
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  purchasePrice: string;
  stock: string;
  status: 'In Stock' | 'Low Stock';
  tone: 'green' | 'orange';
};

export const moduleBatchRows: ModuleBatchRow[] = [
  {
    batchNo: 'B-S 001',
    mfgDate: '2026-01-01',
    expiryDate: '2028-12-31',
    purchasePrice: '40',
    stock: '1000',
    status: 'In Stock',
    tone: 'green',
  },
  {
    batchNo: 'B-C 001',
    mfgDate: '2026-01-01',
    expiryDate: '2028-12-31',
    purchasePrice: '450',
    stock: '800',
    status: 'In Stock',
    tone: 'green',
  },
];
