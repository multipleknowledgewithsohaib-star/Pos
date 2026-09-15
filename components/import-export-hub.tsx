'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePosStore } from '@/lib/pos-state';
import { usePurchaseStore } from '@/lib/purchase-state';
import {
  exportEntityConfigs,
  importEntityConfigs,
  importExportQuickLinks,
} from '@/lib/import-export-config';
import { ButtonLink } from '@/components/ui';
import { SectionHero } from '@/components/section-hero';

export function ImportExportHub() {
  const { state: posState } = usePosStore();
  const { state: purchaseState } = usePurchaseStore();
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const exportRows = useMemo(
    () => ({
      products: async () => {
        const response = await fetch('/api/modules/import-export/products');
        const payload = await response.json();
        return (payload.data ?? []).map((item: Record<string, unknown>) => ({
          'Product Name': item.medicineName,
          Category: item.category,
          'Purchase Price': item.purchasePrice ?? 0,
          'Sale Price': item.price ?? 0,
          Stock: item.stock ?? 0,
          'Generic Name': item.genericName ?? '',
          Unit: item.unit ?? '',
          'Low Stock Alert': item.lowStock ?? 0,
          Status: item.status ?? '',
        }));
      },
      customers: async () =>
        posState.customers.map((customer) => ({
          Name: customer.name,
          Phone: customer.phone,
          Email: customer.email ?? '',
          Address: customer.address ?? '',
          Notes: customer.note ?? '',
        })),
      sales: async () =>
        posState.completedSales.map((sale) => ({
          Invoice: sale.invoice,
          Date: sale.createdAt,
          Customer: sale.customer.name,
          Phone: sale.customer.phone,
          Items: sale.itemsCount,
          Subtotal: sale.subtotal,
          Discount: sale.discountAmount,
          Tax: sale.taxAmount,
          Total: sale.total,
          Payment: sale.paymentMethod,
          Status: sale.status,
        })),
      inventory: async () => {
        const [medicinesResponse, batchesResponse] = await Promise.all([
          fetch('/api/modules/import-export/products'),
          fetch('/api/modules/inventory/batches'),
        ]);
        const medicinesPayload = await medicinesResponse.json();
        const batchesPayload = await batchesResponse.json();
        const medicines = medicinesPayload.data ?? [];
        const batches = batchesPayload.data?.rows ?? [];

        const medicineRows = medicines.map((item: Record<string, unknown>) => ({
          Type: 'Medicine',
          'Product Name': item.medicineName,
          Category: item.category,
          Stock: item.stock,
          'Low Stock Alert': item.lowStock,
          'Purchase Price': item.purchasePrice ?? 0,
          'Sale Price': item.price ?? 0,
          Status: item.status,
        }));

        const batchRows = batches.map((item: Record<string, unknown>) => ({
          Type: 'Batch',
          'Product Name': item.medicineName ?? '',
          'Batch No': item.batchNo,
          Stock: item.stock,
          'Purchase Price': item.purchasePrice,
          'Expiry Date': item.expiryDate,
          Supplier: item.supplier ?? '',
          Status: item.status,
        }));

        return [...medicineRows, ...batchRows];
      },
    }),
    [posState.completedSales, posState.customers],
  );

  async function handleExport(id: keyof typeof exportRows, fileName: string) {
    setBusy(id);
    setNotice('');
    try {
      const rows = await exportRows[id]();
      if (!rows.length) {
        setNotice('No records found to export.');
        return;
      }
      const { downloadWorkbook } = await import('@/lib/import-export-xlsx');
      downloadWorkbook(fileName, 'Data', rows);
      setNotice(`${rows.length} records exported to ${fileName}.`);
    } catch {
      setNotice('Export failed. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="import-export-page">
      <SectionHero
        badge="Admin"
        eyebrow="ADMINISTRATION"
        title="Import / Export"
        description="Import products, customers, suppliers, and opening stock. Export products, customers, sales, and inventory reports."
      />

      {notice ? <p className="import-export-notice" role="status">{notice}</p> : null}

      <section className="import-export-section">
        <div className="import-export-section-head">
          <h2>Import Data</h2>
          <p>Download template, fill Excel, upload, review, and import valid records.</p>
        </div>
        <div className="import-export-grid">
          {importEntityConfigs.map((item) => {
            const Icon = item.icon;
            return (
              <article className="import-export-card" key={item.id}>
                <div className="import-export-card-icon">
                  <Icon />
                </div>
                <div className="import-export-card-copy">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="import-export-template-tag">{item.templateFile}</span>
                </div>
                <ButtonLink href={`/modules/administration/import-export/import/${item.id}`}>
                  Start Import
                </ButtonLink>
              </article>
            );
          })}
        </div>
      </section>

      <section className="import-export-section">
        <div className="import-export-section-head">
          <h2>Export Data</h2>
          <p>Download current records as Excel files.</p>
        </div>
        <div className="import-export-grid">
          {exportEntityConfigs.map((item) => {
            const Icon = item.icon;
            return (
              <article className="import-export-card import-export-card-export" key={item.id}>
                <div className="import-export-card-icon import-export-card-icon-export">
                  <Icon />
                </div>
                <div className="import-export-card-copy">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="import-export-template-tag">{item.fileName}</span>
                </div>
                <button
                  className="button button-primary"
                  disabled={busy === item.id}
                  type="button"
                  onClick={() => void handleExport(item.id, item.fileName)}
                >
                  {busy === item.id ? 'Preparing...' : 'Download'}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="import-export-notes">
        <h2>Important Notes</h2>
        <ul>
          <li>Do not change column names in Excel templates.</li>
          <li>Required fields must be filled before import.</li>
          <li>Duplicate product and supplier records are skipped automatically.</li>
          <li>Opening stock import requires the product to already exist in inventory.</li>
          <li>Customers: {posState.customers.length} | Suppliers: {purchaseState.suppliers.length}</li>
        </ul>
      </section>

      <section className="import-export-quick-links">
        {importExportQuickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link className="import-export-quick-link" href={link.href} key={link.href}>
              <Icon />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
