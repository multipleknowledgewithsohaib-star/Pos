'use client';

import { useMemo, useState } from 'react';
import { PenLine, Phone, Plus, Save, Search, Trash2, UserRound, UsersRound, MapPin, NotebookPen } from 'lucide-react';
import { ButtonLink, StatCard } from '@/components/ui';
import { usePosStore, type PosDraftCustomer } from '@/lib/pos-state';

type CustomerForm = {
  name: string;
  phone: string;
  address: string;
  note: string;
};

function createEmptyCustomerForm(): CustomerForm {
  return {
    name: '',
    phone: '',
    address: '',
    note: '',
  };
}

function normalizeCustomer(customer: PosDraftCustomer): PosDraftCustomer {
  return {
    name: customer.name.trim(),
    phone: customer.phone.trim() || 'N/A',
    address: customer.address.trim() || 'N/A',
    note: customer.note?.trim() || undefined,
  };
}

export function CustomerManagementWorkspace() {
  const { state, addCustomer, updateCustomer, deleteCustomer } = usePosStore();
  const [search, setSearch] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<CustomerForm>(createEmptyCustomerForm());
  const [message, setMessage] = useState('');

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.customers
      .map((customer, index) => ({ customer, index }))
      .filter(({ customer }) => {
        if (!term) {
          return true;
        }

        return [customer.name, customer.phone, customer.address, customer.note ?? '']
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      });
  }, [search, state.customers]);

  const stats = useMemo(() => {
    const total = state.customers.length;
    const withPhone = state.customers.filter((customer) => customer.phone !== 'N/A' && customer.phone.trim()).length;
    const withAddress = state.customers.filter((customer) => customer.address !== 'N/A' && customer.address.trim()).length;
    const withNotes = state.customers.filter((customer) => customer.note && customer.note.trim()).length;
    return { total, withPhone, withAddress, withNotes };
  }, [state.customers]);

  const resetForm = () => {
    setEditingIndex(null);
    setForm(createEmptyCustomerForm());
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setMessage('Please enter customer name.');
      return;
    }

    const customer = normalizeCustomer({
      name: form.name,
      phone: form.phone,
      address: form.address,
      note: form.note,
    });

    if (editingIndex === null) {
      addCustomer(customer);
      setMessage('Customer added successfully.');
    } else {
      updateCustomer(editingIndex, customer);
      setMessage('Customer updated successfully.');
    }

    resetForm();
  };

  return (
    <>
      <section className="module-stats-grid customer-responsive-stats">
        <StatCard icon={UsersRound} label="Total Customers" tone="purple" value={stats.total} />
        <StatCard icon={Phone} label="With Phone" tone="green" value={stats.withPhone} />
        <StatCard icon={MapPin} label="With Address" tone="blue" value={stats.withAddress} />
        <StatCard icon={NotebookPen} label="With Notes" tone="orange" value={stats.withNotes} />
      </section>

      <div className="backup-create-grid customer-responsive-layout">
        <section className="section-panel backup-create-form">
          <div className="settings-heading">
            <div>
              <h2>{editingIndex === null ? 'Add Customer' : 'Edit Customer'}</h2>
              <p>Manage customer details used across POS and future sales.</p>
            </div>
            <ButtonLink href="/modules/pos/customer-selection" icon={UserRound} variant="secondary">
              POS Selection
            </ButtonLink>
          </div>

          <div className="form-fields three-cols">
            <label className="field-span-full">
              <span>Customer Name</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Customer name"
                value={form.name}
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="0300-1234567"
                value={form.phone}
              />
            </label>
            <label>
              <span>Address</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                placeholder="12-A, Main Market, Karachi"
                value={form.address}
              />
            </label>
            <label className="field-span-full">
              <span>Note</span>
              <textarea
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Optional note"
                rows={4}
                value={form.note}
              />
            </label>
          </div>

          <div className="backup-create-actions">
            <button className="button button-ghost" type="button" onClick={resetForm}>
              Cancel
            </button>
            <button className="button button-primary" type="button" onClick={handleSave}>
              <Save className="button-icon" />
              <span>{editingIndex === null ? 'Save Customer' : 'Update Customer'}</span>
            </button>
          </div>

          {message ? (
            <div className="backup-note-box">
              <strong>Status</strong>
              <p>{message}</p>
            </div>
          ) : null}
        </section>

        <aside className="section-panel backup-summary-panel">
          <div className="section-heading">
            <div>
              <h2>Customer Directory</h2>
            </div>
          </div>

          <div className="section-hero-inline-actions customer-responsive-actions" style={{ justifyContent: 'flex-start' }}>
            <label className="search-box customer-responsive-search">
              <Search className="button-icon" />
              <input
                aria-label="Search customers"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer..."
                value={search}
              />
            </label>
            <ButtonLink href="/modules/pos/new-sale" icon={Plus} variant="secondary">
              New Sale
            </ButtonLink>
            <button
              className="button button-danger"
              type="button"
              onClick={() => {
                if (state.customers.length === 0) {
                  setMessage('No customers to delete.');
                  return;
                }

                if (
                  window.confirm(
                    `Delete all ${state.customers.length} customers? This action cannot be undone.`
                  )
                ) {
                  for (let index = state.customers.length - 1; index >= 0; index -= 1) {
                    deleteCustomer(index);
                  }
                  resetForm();
                  setSearch('');
                  setMessage('All customers deleted successfully.');
                }
              }}
            >
              <Trash2 className="button-icon" />
              <span>Delete All</span>
            </button>
          </div>

          <section className="table-panel customer-responsive-table" style={{ marginTop: '18px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center' }}>
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  rows.map(({ customer, index }, rowIndex) => (
                    <tr key={`${customer.name}-${customer.phone}-${index}`}>
                      <td>{rowIndex + 1}</td>
                      <td>
                        <strong>{customer.name}</strong>
                      </td>
                      <td>{customer.phone}</td>
                      <td>{customer.address}</td>
                      <td>{customer.note ?? '-'}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            type="button"
                            title="Edit customer"
                            onClick={() => {
                              setEditingIndex(index);
                              setForm({
                                name: customer.name,
                                phone: customer.phone,
                                address: customer.address,
                                note: customer.note ?? '',
                              });
                            }}
                          >
                            <PenLine className="icon-button-icon" />
                          </button>
                          <button
                            className="icon-button icon-button-danger"
                            type="button"
                            title="Delete customer"
                            onClick={() => {
                              if (window.confirm(`Delete ${customer.name}?`)) {
                                deleteCustomer(index);
                                if (editingIndex === index) {
                                  resetForm();
                                }
                              }
                            }}
                          >
                            <Trash2 className="icon-button-icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </aside>
      </div>
    </>
  );
}
