'use client';

import { Check, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SearchBox, SelectBox } from '@/components/ui';
import { rolePermissions } from '@/lib/demo-data';

const roleColumns = [
  { key: 'superAdmin', label: 'Super Admin' },
  { key: 'admin', label: 'Admin' },
  { key: 'manager', label: 'Manager' },
  { key: 'pharmacist', label: 'Pharmacist' },
  { key: 'cashier', label: 'Cashier' },
  { key: 'viewer', label: 'Viewer' },
] as const;

const moduleOptions = ['All Modules', ...rolePermissions.map((permission) => permission.module)];

export function RolesPermissionsPanel() {
  const [query, setQuery] = useState('');
  const [module, setModule] = useState<(typeof moduleOptions)[number]>('All Modules');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rolePermissions.filter((permission) => {
      const matchesModule = module === 'All Modules' || permission.module === module;
      const matchesSearch = !normalized || permission.module.toLowerCase().includes(normalized);
      return matchesModule && matchesSearch;
    });
  }, [module, query]);

  return (
    <>
      <div className="toolbar toolbar-grid roles-toolbar">
        <SelectBox
          label="Module"
          options={[...moduleOptions]}
          value={module}
          onChange={(event) => setModule(event.target.value as (typeof moduleOptions)[number])}
        />
        <SearchBox
          placeholder="Search modules..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="legend">
          <span><Check /> Allowed</span>
          <span><X /> Not Allowed</span>
        </div>
      </div>

      <section className="table-panel" id="matrix">
        <table className="data-table permission-table">
          <thead>
            <tr>
              <th>Modules</th>
              {roleColumns.map((role) => (
                <th key={role.key}>{role.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((permission) => {
              const Icon = permission.icon;
              return (
                <tr key={permission.module}>
                  <td>
                    <div className="module-cell">
                      <Icon className="module-cell-icon" />
                      <span>{permission.module}</span>
                    </div>
                  </td>
                  {roleColumns.map((role) => (
                    <td key={role.key}>
                      {permission[role.key] ? (
                        <Check className="permission-yes" />
                      ) : (
                        <X className="permission-no" />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
