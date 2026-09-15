'use client';

import { useEffect } from 'react';

export function ModuleHashScroll() {
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;

      const target = document.getElementById(hash);
      if (!target) return;

      window.requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);

    return () => { 
      window.removeEventListener('hashchange', scrollToHash);
    };
  }, []);

  return null;
}
