'use client';

import { Edit3, Filter, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { IconButton, RoleBadge, SearchBox, SelectBox, StatusBadge } from '@/components/ui';
import { TablePagination, paginateRows } from '@/components/table-pagination';
import type { AdminUser } from '@/lib/admin-types';

const roleOptions = ['All Roles', 'Admin', 'Manager', 'Pharmacist', 'Cashier'] as const;
const statusOptions = ['All Status', 'Active', 'Inactive'] as const;

const PAGE_SIZE = 10;

export function UsersTable({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<(typeof roleOptions)[number]>('All Roles');
  const [status, setStatus] = useState<(typeof statusOptions)[number]>('All Status');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [appliedRole, setAppliedRole] = useState<(typeof roleOptions)[number]>('All Roles');
  const [appliedStatus, setAppliedStatus] = useState<(typeof statusOptions)[number]>('All Status');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalizedQuery = appliedQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = appliedRole === 'All Roles' || user.role === appliedRole;
      const matchesStatus = appliedStatus === 'All Status' || user.status === appliedStatus;
      if (!matchesRole || !matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${user.name} ${user.email} ${user.phone} ${user.branch}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [appliedQuery, appliedRole, appliedStatus, users]);

  function applyFilters() {
    setAppliedQuery(query);
    setAppliedRole(role);
    setAppliedStatus(status);
    setPage(1);
  }

  const { page: safePage, pageCount, rows } = paginateRows(filtered, page, PAGE_SIZE);

  return (
    <>
      <div className="toolbar toolbar-grid">
        <SearchBox
          placeholder="Search users..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              applyFilters();
            }
          }}
        />
        <SelectBox
          label="Role"
          options={[...roleOptions]}
          value={role}
          onChange={(event) => setRole(event.target.value as (typeof roleOptions)[number])}
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
              <th>User</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <div className="user-cell">
                      <span>{user.initials}</span>
                      <strong>{user.name}</strong>
                    </div>
                  </td>
                  <td>
                    <RoleBadge label={user.role} tone={user.roleTone} />
                  </td>
                  <td>{user.branch}</td>
                  <td>
                    <StatusBadge status={user.status} />
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>
                    <div className="row-actions">
                      <IconButton href={`/users/${user.id}/edit`} icon={Edit3} label="Edit user" />
                      <IconButton href={`/users/${user.id}/edit#danger`} icon={Trash2} label="Delete user" tone="danger" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="table-empty-cell" colSpan={8}>No users match your filters.</td>
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
