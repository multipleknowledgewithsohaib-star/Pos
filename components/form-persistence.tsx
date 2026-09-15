'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function storageKey(pathname: string) {
  return `pharma-form:${pathname}`;
}

export function FormPersistenceLoader() {
  const pathname = usePathname();

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey(pathname));
    if (!raw) {
      return;
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }

    const form = document.querySelector('form');
    if (!form) {
      return;
    }

    const fields = Array.from(form.querySelectorAll('input, select, textarea')) as Array<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >;

    fields.forEach((field, index) => {
      const key =
        field.name ||
        field.id ||
        field.closest('label')?.querySelector('span')?.textContent?.replace(/\s+/g, ' ').trim() ||
        `field_${index + 1}`;
      const saved = payload[key];
      if (saved === undefined) {
        return;
      }

      if (field instanceof HTMLInputElement && field.type === 'checkbox') {
        field.checked = Boolean(saved);
        return;
      }

      if (field instanceof HTMLInputElement && field.type === 'radio') {
        field.checked = String(saved) === field.value;
        return;
      }

      field.value = String(saved);
    });
  }, [pathname]);

  return null;
}
