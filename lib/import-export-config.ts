import {
  Boxes,
  FileDown,
  FileUp,
  Package,
  ShoppingBag,
  Truck,
  UsersRound,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { ExportEntity, ImportEntity } from './import-export-types';

export type ImportExportColumn = {
  key: string;
  header: string;
  required?: boolean;
};

export type ImportEntityConfig = {
  id: ImportEntity;
  title: string;
  description: string;
  templateFile: string;
  icon: ComponentType<{ className?: string }>;
  columns: ImportExportColumn[];
  sampleRows: Record<string, string | number>[];
};

export type ExportEntityConfig = {
  id: ExportEntity;
  title: string;
  description: string;
  fileName: string;
  icon: ComponentType<{ className?: string }>;
};

export const importEntityConfigs: ImportEntityConfig[] = [
  {
    id: 'products',
    title: 'Products Import',
    description: 'Upload medicines/products from Excel template.',
    templateFile: 'Products.xlsx',
    icon: Package,
    columns: [
      { key: 'productName', header: 'Product Name', required: true },
      { key: 'category', header: 'Category', required: true },
      { key: 'purchasePrice', header: 'Purchase Price', required: true },
      { key: 'salePrice', header: 'Sale Price', required: true },
      { key: 'stock', header: 'Stock', required: true },
      { key: 'genericName', header: 'Generic Name' },
      { key: 'unit', header: 'Unit' },
      { key: 'lowStock', header: 'Low Stock Alert' },
    ],
    sampleRows: [
      {
        'Product Name': 'Panadol',
        Category: 'Medicine',
        'Purchase Price': 50,
        'Sale Price': 70,
        Stock: 100,
        'Generic Name': 'Paracetamol',
        Unit: 'Tablet',
        'Low Stock Alert': 10,
      },
      {
        'Product Name': 'Augmentin',
        Category: 'Antibiotic',
        'Purchase Price': 320,
        'Sale Price': 380,
        Stock: 45,
        'Generic Name': 'Amoxicillin',
        Unit: 'Tablet',
        'Low Stock Alert': 8,
      },
    ],
  },
  {
    id: 'customers',
    title: 'Customers Import',
    description: 'Import customer list for POS checkout.',
    templateFile: 'Customers.xlsx',
    icon: UsersRound,
    columns: [
      { key: 'name', header: 'Name', required: true },
      { key: 'phone', header: 'Phone', required: true },
      { key: 'email', header: 'Email' },
      { key: 'address', header: 'Address' },
      { key: 'notes', header: 'Notes' },
    ],
    sampleRows: [
      {
        Name: 'Ali Khan',
        Phone: '03001234567',
        Email: 'ali@example.com',
        Address: 'Lahore',
        Notes: 'Walk-in customer',
      },
      {
        Name: 'Sara Ahmed',
        Phone: '03111234567',
        Email: 'sara@example.com',
        Address: 'Karachi',
        Notes: 'Credit customer',
      },
    ],
  },
  {
    id: 'suppliers',
    title: 'Suppliers Import',
    description: 'Import supplier records for purchases.',
    templateFile: 'Suppliers.xlsx',
    icon: Truck,
    columns: [
      { key: 'name', header: 'Supplier Name', required: true },
      { key: 'phone', header: 'Phone', required: true },
      { key: 'email', header: 'Email' },
      { key: 'city', header: 'City' },
      { key: 'contactPerson', header: 'Contact Person' },
      { key: 'status', header: 'Status' },
      { key: 'notes', header: 'Notes' },
    ],
    sampleRows: [
      {
        'Supplier Name': 'MediSupply Co.',
        Phone: '0421234567',
        Email: 'sales@medisupply.com',
        City: 'Lahore',
        'Contact Person': 'Imran',
        Status: 'Active',
        Notes: 'Primary wholesaler',
      },
    ],
  },
  {
    id: 'opening-stock',
    title: 'Opening Stock Import',
    description: 'Set opening stock quantities and batch details.',
    templateFile: 'OpeningStock.xlsx',
    icon: Boxes,
    columns: [
      { key: 'productName', header: 'Product Name', required: true },
      { key: 'batchNo', header: 'Batch No', required: true },
      { key: 'quantity', header: 'Quantity', required: true },
      { key: 'purchasePrice', header: 'Purchase Price', required: true },
      { key: 'expiryDate', header: 'Expiry Date', required: true },
      { key: 'supplier', header: 'Supplier' },
      { key: 'mfgDate', header: 'MFG Date' },
    ],
    sampleRows: [
      {
        'Product Name': 'Panadol',
        'Batch No': 'BATCH-001',
        Quantity: 100,
        'Purchase Price': 50,
        'Expiry Date': '2027-12-31',
        Supplier: 'MediSupply Co.',
        'MFG Date': '2025-01-15',
      },
    ],
  },
];

export const exportEntityConfigs: ExportEntityConfig[] = [
  {
    id: 'products',
    title: 'Export Products',
    description: 'Download all products as Excel.',
    fileName: 'Products.xlsx',
    icon: Package,
  },
  {
    id: 'customers',
    title: 'Export Customers',
    description: 'Download POS customers as Excel.',
    fileName: 'Customers.xlsx',
    icon: UsersRound,
  },
  {
    id: 'sales',
    title: 'Export Sales',
    description: 'Download completed sales report.',
    fileName: 'Sales_Report.xlsx',
    icon: ShoppingBag,
  },
  {
    id: 'inventory',
    title: 'Export Inventory',
    description: 'Download stock and batch inventory.',
    fileName: 'Inventory_Report.xlsx',
    icon: Boxes,
  },
];

export const importExportQuickLinks = [
  { href: '/modules/administration/import-export/import/products', label: 'Import Products', icon: FileUp },
  { href: '/modules/administration/import-export/import/customers', label: 'Import Customers', icon: FileUp },
  { href: '/modules/administration/import-export/import/suppliers', label: 'Import Suppliers', icon: FileUp },
  { href: '/modules/administration/import-export/import/opening-stock', label: 'Import Opening Stock', icon: FileUp },
  { href: '/modules/administration/import-export', label: 'Export Data', icon: FileDown },
];

export function getImportConfig(id: ImportEntity) {
  const config = importEntityConfigs.find((item) => item.id === id);
  if (!config) {
    throw new Error(`Unknown import entity: ${id}`);
  }
  return config;
}
