'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { SearchBox } from '@/components/ui';
import { TablePagination, paginateRows } from '@/components/table-pagination';
import { StatusBadge } from '@/components/ui';
import type { AdminClient } from '@/lib/admin-types';

const PAGE_SIZE = 10;

export function ClientsTable({ clients }: { clients: AdminClient[] }) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = appliedQuery.trim().toLowerCase();
    if (!normalized) {
      return clients;
    }

    return clients.filter((client) => {
      const haystack = `${client.name} ${client.type} ${client.plan} ${client.branch} ${client.status}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [appliedQuery, clients]);

  const { page: safePage, pageCount, rows } = paginateRows(filtered, page, PAGE_SIZE);

  return (
    <>
      <div className="toolbar">
        <SearchBox
          placeholder="Search..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setAppliedQuery(query);
              setPage(1);
            }
          }}
        />
        <button
          className="button button-secondary"
          type="button"
          onClick={() => {
            setAppliedQuery(query);
            setPage(1);
          }}
        >
          Search
        </button>
      </div>

      <section className="table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Branch</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((client) => (
                <tr key={client.id}>
                  <td>
                    <Link className="table-link table-link-inline" href={`/clients/${client.id}`}>
                      {client.name}
                    </Link>
                  </td>
                  <td>{client.type}</td>
                  <td>{client.plan}</td>
                  <td>
                    <StatusBadge status={client.status} />
                  </td>
                  <td>{client.branch}</td>
                  <td>
                    <Link className="table-link" href={`/clients/${client.id}/edit`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-empty-cell" colSpan={6}>No clients match your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <TablePagination
        page={safePage}
        pageCount={pageCount}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
      />
    </>
  );
}
