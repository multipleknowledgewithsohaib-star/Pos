'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, Filter, RotateCcw } from 'lucide-react';
import { IconButton, SearchBox } from '@/components/ui';
import { TablePagination, paginateRows } from '@/components/table-pagination';
import { downloadBackupFile, listBackups } from '@/lib/backup-store';

const PAGE_SIZE = 8;

export function BackupListWorkspace() {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const backups = useMemo(() => listBackups(), []);

  const filtered = useMemo(() => {
    const normalized = appliedQuery.trim().toLowerCase();
    if (!normalized) {
      return backups;
    }

    return backups.filter((backup) => {
      const haystack = `${backup.name} ${backup.type} ${backup.status}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [appliedQuery, backups]);

  const { page: safePage, pageCount, rows } = paginateRows(filtered, page, PAGE_SIZE);

  function applyFilters() {
    setAppliedQuery(query);
    setPage(1);
  }

  return (
    <>
      <div className="section-hero-inline-actions">
        <SearchBox
          placeholder="Search backup..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              applyFilters();
            }
          }}
        />
        <button className="button button-primary" type="button" onClick={applyFilters}>
          <Filter className="button-icon" />
          <span>Filter</span>
        </button>
      </div>

      <section className="table-panel">
        <table className="data-table backup-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Backup Name</th>
              <th>Date &amp; Time</th>
              <th>Size</th>
              <th>Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((backup) => (
                <tr key={backup.id}>
                  <td>{backup.id}</td>
                  <td>{backup.name}</td>
                  <td>{backup.datetime}</td>
                  <td>{backup.size}</td>
                  <td>{backup.type}</td>
                  <td>
                    <span className={`status-badge status-${backup.status === 'Success' ? 'active' : 'inactive'}`}>
                      {backup.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <IconButton href={`/modules/backup-restore/details/${backup.slug}`} icon={FileText} label="View details" />
                      <IconButton href="/modules/backup-restore/restore" icon={RotateCcw} label="Restore backup" />
                      <button
                        className="icon-button"
                        type="button"
                        title="Download backup"
                        onClick={() => downloadBackupFile(backup)}
                      >
                        <Download className="icon-button-icon" />
                        <span className="sr-only">Download backup</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-empty-cell" colSpan={7}>No backups match your search.</td>
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
