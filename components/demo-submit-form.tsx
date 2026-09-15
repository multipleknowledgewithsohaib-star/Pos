'use client';

import type { FormEvent, MouseEvent, ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function DemoSubmitForm({
  children,
  className = 'form-grid',
  successText,
}: {
  children: ReactNode;
  className?: string;
  successText: string;
}) {
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <form className={className} onSubmit={handleSubmit}>
      {children}
      {saved ? (
        <div className="success-banner form-section-wide" role="status">
          <CheckCircle2 />
          <span>{successText}</span>
        </div>
      ) : null}
    </form>
  );
}

export function DemoActionButton({
  children,
  message,
  tone = 'primary',
}: {
  children: ReactNode;
  message: string;
  tone?: 'primary' | 'secondary' | 'success' | 'danger';
}) {
  const [complete, setComplete] = useState(false);
  const buttonClass = `button button-${tone}`;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    persistNearestForm(event.currentTarget, message);
    setComplete(true);
  }

  return (
    <div className="demo-action-wrap">
      <button className={buttonClass} onClick={handleClick} type="button">
        {children}
      </button>
      {complete ? (
        <span className="inline-feedback" role="status">
          <CheckCircle2 />
          {message}
        </span>
      ) : null}
    </div>
  );
}

function persistNearestForm(button: HTMLButtonElement, message: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const form = button.closest('form');
  const payload: Record<string, unknown> = {
    savedAt: new Date().toISOString(),
    message,
  };

  if (form) {
    const fields = Array.from(form.querySelectorAll('input, select, textarea')) as Array<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >;

    fields.forEach((field, index) => {
      const key = field.name || field.id || field.closest('label')?.querySelector('span')?.textContent?.replace(/\s+/g, ' ').trim() || `field_${index + 1}`;
      if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
        if (field.type === 'radio' && !field.checked) {
          return;
        }
        payload[key] = field.checked;
        return;
      }

      payload[key] = field.value;
    });
  }

  window.localStorage.setItem(`pharma-form:${window.location.pathname}`, JSON.stringify(payload));
}