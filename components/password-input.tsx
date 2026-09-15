'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function PasswordInput({
  name,
  placeholder,
  required = false,
}: {
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="input-action" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        type={show ? 'text' : 'password'}
        style={{ width: '100%', paddingRight: '2.5rem' }}
      />
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          color: '#64748b',
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
