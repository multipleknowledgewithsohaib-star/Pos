'use client';

import { Filter, Store, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { IconButton, SearchBox, SelectBox, StatusBadge } from '@/components/ui';
import type { AdminBranch } from '@/lib/admin-types';

import { TablePagination, paginateRows } from '@/components/table-pagination';

const statusOptions = ['All Status', 'Active', 'Inactive'] as const;
const PAGE_SIZE = 10;

export function BranchesTable({ branches }: { branches: AdminBranch[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof statusOptions)[number]>('All Status');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<(typeof statusOptions)[number]>('All Status');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalizedQuery = appliedQuery.trim().toLowerCase();

    return branches.filter((branch) => {
      const matchesStatus = appliedStatus === 'All Status' || branch.status === appliedStatus;
      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${branch.name} ${branch.city} ${branch.manager}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [appliedQuery, appliedStatus, branches]);

  function applyFilters() {
    setAppliedQuery(query);
    setAppliedStatus(status);
    setPage(1);
  }

  const { page: safePage, pageCount, rows } = paginateRows(filtered, page, PAGE_SIZE);

  return (
    <>
      <div className="toolbar toolbar-grid branches-toolbar">
        <SearchBox
          placeholder="Search branches..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              applyFilters();
            }
          }}
        />
        <SelectBox
          label="Status"
          options={[...statusOptions]}
          value={status}
          onChange={(event) => setStatus(event.target.value as (typeof statusOptions)[number])}
        />
        <button className="button button-secondary" type="button" onClick={applyFilters}>
          <Filter className="button-icon" />
          <span>Filter</span>
        </button>
      </div>

      <section className="table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Branch Name</th>
              <th>City</th>
              <th>Manager</th>
              <th>Status</th>
              <th>Created On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((branch) => (
                <tr key={branch.id}>
                  <td>{branch.id}</td>
                  <td>{branch.name}</td>
                  <td>{branch.city}</td>
                  <td>
                    <div className="user-cell">
                      <span>{branch.initials}</span>
                      <strong>{branch.manager}</strong>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={branch.status} />
                  </td>
                  <td>{branch.createdOn}</td>
                  <td>
                    <div className="row-actions">
                      <IconButton href={`/branches/${branch.id}/edit`} icon={Store} label="Edit branch" />
                      <IconButton href={`/branches/${branch.id}/edit#danger`} icon={Trash2} label="Delete branch" tone="danger" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-empty-cell" colSpan={7}>No branches match your filters.</td>
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
