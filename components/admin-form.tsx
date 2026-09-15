'use client';

import type { FormEvent, ReactNode } from 'react';
import { CheckCircle2, Loader2, Trash2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type SubmitState = 'idle' | 'saving' | 'saved' | 'error';

export function AdminForm({
  children,
  endpoint,
  method = 'POST',
  redirectTo,
  successText,
  className = 'form-grid',
}: {
  children: ReactNode;
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  redirectTo: string;
  successText: string;
  className?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>('idle');
  const [error, setError] = useState('');
  
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('saving');
    setError('');

    const payload = formToObject(new FormData(event.currentTarget));
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setState('error');
      setError('Save failed. Please check required fields and try again.');
      return;
    }

    setState('saved');
    router.refresh();
    window.setTimeout(() => router.push(redirectTo), 550);
  }

  return (
    <form className={className} onSubmit={handleSubmit}>
      {children}
      {state === 'saved' ? (
        <div className="success-banner form-section-wide" role="status">
          <CheckCircle2 />
          <span>{successText}</span>
        </div>
      ) : null}
      {state === 'error' ? (
        <div className="error-banner form-section-wide" role="alert">
          <XCircle />
          <span>{error}</span>
        </div>
      ) : null}
      {state === 'saving' ? (
        <div className="saving-banner form-section-wide" role="status">
          <Loader2 />
          <span>Saving changes...</span>
        </div>
      ) : null}
    </form>
  );
}

export function DeleteRecordButton({
  endpoint,
  redirectTo,
  label = 'Delete',
}: {
  endpoint: string;
  redirectTo: string;
  label?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'deleting' | 'deleted' | 'error'>('idle');

  async function handleDelete() {
    const confirmed = window.confirm('Are you sure you want to delete this record?');
    if (!confirmed) return;

    setState('deleting');
    const response = await fetch(endpoint, { method: 'DELETE' });

    if (!response.ok) {
      setState('error');
      return;
    }

    setState('deleted');
    router.refresh();
    window.setTimeout(() => router.push(redirectTo), 450);
  }

  return (
    <div className="demo-action-wrap">
      <button className="button button-danger" disabled={state === 'deleting'} onClick={handleDelete} type="button">
        <Trash2 className="button-icon" />
        <span>{state === 'deleting' ? 'Deleting...' : label}</span>
      </button>
      {state === 'deleted' ? <span className="inline-feedback">Deleted successfully.</span> : null}
      {state === 'error' ? <span className="inline-feedback inline-feedback-danger">Delete failed.</span> : null}
    </div>
  );
}

function formToObject(formData: FormData) {
  const payload: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};

  for (const [key, value] of formData.entries()) {
    const current = payload[key];
    if (Array.isArray(current)) {
      current.push(value);
    } else if (current !== undefined) {
      payload[key] = [current, value];
    } else {
      payload[key] = value;
    }
  }

  return payload;
}
