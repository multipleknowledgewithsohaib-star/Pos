'use client';

import { useMemo, useState } from 'react';
import { Filter } from 'lucide-react';
import { SearchBox } from '@/components/ui';
import { TablePagination, paginateRows } from '@/components/table-pagination';
import { listBackupActivity } from '@/lib/backup-store';

const PAGE_SIZE = 10;

export function BackupActivityWorkspace() {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const activity = useMemo(() => listBackupActivity(), []);

  const filtered = useMemo(() => {
    const normalized = appliedQuery.trim().toLowerCase();
    if (!normalized) {
      return activity;
    }

    return activity.filter((row) => {
      const haystack = `${row.action} ${row.name} ${row.performedBy} ${row.status}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [activity, appliedQuery]);

  const { page: safePage, pageCount, rows } = paginateRows(filtered, page, PAGE_SIZE);

  return (
    <>
      <div className="section-hero-inline-actions">
        <SearchBox
          placeholder="Search log..."
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
          className="button button-primary"
          type="button"
          onClick={() => {
            setAppliedQuery(query);
            setPage(1);
          }}
        >
          <Filter className="button-icon" />
          <span>Filter</span>
        </button>
      </div>

      <section className="table-panel">
        <table className="data-table backup-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Action</th>
              <th>Backup Name</th>
              <th>Date &amp; Time</th>
              <th>Status</th>
              <th>Performed By</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.action}</td>
                  <td>{row.name}</td>
                  <td>{row.datetime}</td>
                  <td>
                    <span className={`status-badge status-${row.status === 'Success' ? 'active' : 'inactive'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.performedBy}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-empty-cell" colSpan={6}>No activity matches your search.</td>
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
