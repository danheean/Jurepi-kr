'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConsentValue, CONSENT_STORAGE_KEY, parseConsent } from '@/lib/consent/consent';

export interface ConsentContextType {
  consent: ConsentValue | null;
  mounted: boolean;
  reopenRequested: boolean;
  showBanner: boolean;
  accept: () => void;
  decline: () => void;
  reopen: () => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const [mounted, setMounted] = useState(false);
  const [reopenRequested, setReopenRequested] = useState(false);

  // Load from localStorage on mount only
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(CONSENT_STORAGE_KEY) : null;
    const parsed = parseConsent(stored);
    setConsent(parsed);
    setMounted(true);
  }, []);

  const showBanner = mounted && (consent === null || reopenRequested);

  const accept = () => {
    const value: ConsentValue = 'granted';
    setConsent(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONSENT_STORAGE_KEY, value);
    }
    setReopenRequested(false);
  };

  const decline = () => {
    const value: ConsentValue = 'denied';
    setConsent(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONSENT_STORAGE_KEY, value);
    }
    setReopenRequested(false);
  };

  const reopen = () => {
    setReopenRequested(true);
  };

  const value: ConsentContextType = {
    consent,
    mounted,
    reopenRequested,
    showBanner,
    accept,
    decline,
    reopen,
  };

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextType {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error('useConsent must be used within ConsentProvider');
  }
  return context;
}
