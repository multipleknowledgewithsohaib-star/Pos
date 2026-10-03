'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { TablePagination, paginateRows } from '@/components/table-pagination';
import { Eye, Filter, Plus, Search } from 'lucide-react';
import type { Medicine } from '@/lib/module-data';

const statusOptions = ['All', 'In Stock', 'Low Stock', 'Out of Stock'] as const;

type StatusFilter = (typeof statusOptions)[number];

const PAGE_SIZE = 25;

export function ModuleInventoryTable({ medicines }: { medicines: Medicine[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filteredMedicines = medicines.filter((medicine) => {
    const haystack = [
      medicine.medicineName,
      medicine.genericName,
      medicine.category,
      medicine.unit,
      medicine.status,
    ].join(' ').toLowerCase();
    const matchesSearch = !deferredQuery || haystack.includes(deferredQuery);
    const matchesStatus = status === 'All' || medicine.status === status;
    return matchesSearch && matchesStatus;
  });

  function cycleStatus() {
    const currentIndex = statusOptions.indexOf(status);
    setStatus(statusOptions[(currentIndex + 1) % statusOptions.length]);
    setPage(1);
  }

  const { page: safePage, pageCount, rows } = paginateRows(filteredMedicines, page, PAGE_SIZE);

  return (
    <>
      <section className="module-inventory-toolbar">
        <label>
          <Search />
          <input
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search item by name, category or code..."
            value={query}
          />
        </label>
        <button onClick={cycleStatus} type="button">
          <Filter />
          <span>{status === 'All' ? 'Filter' : status}</span>
        </button>
        <Link href="/modules/inventory/new">
          <Plus />
          <span>Add Item</span>
        </Link>
      </section>

      <section className="module-inventory-table-card">
        <table className="module-inventory-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Generic Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Stock</th>
              <th>Low Stock</th>
              <th>Price (PKR)</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((medicine) => (
              <tr key={medicine.id}>
                <td>{medicine.medicineName}</td>
                <td>{medicine.genericName}</td>
                <td>{medicine.category}</td>
                <td>{medicine.unit}</td>
                <td>{medicine.stock}</td>
                <td>{medicine.lowStock}</td>
                <td>{medicine.price.toFixed(2)}</td>
                <td>
                  <span className={`module-status-pill ${medicine.status === 'In Stock' ? 'in' : medicine.status === 'Low Stock' ? 'low' : 'out'}`}>
                    {medicine.status}
                  </span>
                </td>
                <td>
                  <Link className="module-table-icon" href={`/modules/inventory/medicines/${medicine.id}`} aria-label={`View ${medicine.medicineName}`}>
                    <Eye />
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="module-empty-cell" colSpan={9}>No items found for this search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <TablePagination
        page={safePage}
        pageCount={pageCount}
        pageSize={PAGE_SIZE}
        total={filteredMedicines.length}
        onPageChange={setPage}
      />
    </>
  );
}
