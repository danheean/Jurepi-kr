'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Copy } from 'lucide-react';
import { useAgeLookup } from './useAgeLookup';
import { BirthdateInput } from './BirthdateInput';
import { AgeCalculatorEmptyState } from './AgeCalculatorEmptyState';

// Import presentational components from B (locked interfaces)
import { AgeSummary } from './AgeSummary';
import { DateFacts } from './DateFacts';
import { RecentLookups } from './RecentLookups';
import { PeopleList } from './PeopleList';

export function AgeCalculator() {
  const t = useTranslations('tools.age-calculator');
  const locale = useLocale();
  const {
    birthdate,
    age,
    error,
    people,
    recents,
    asOfDate,
    useAsOf,
    setBirthdate,
    setAsOfDate,
    setUseAsOf,
    addPerson,
    removePerson,
    selectRecent,
    clearRecents,
    clearError,
    copyResultToClipboard,
  } = useAgeLookup();

  const [mounted, setMounted] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'fail'>('idle');

  // Mounted gate for localStorage-dependent interactive parts
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = async () => {
    const success = await copyResultToClipboard();
    if (success) {
      setCopyState('success');
      setTimeout(() => setCopyState('idle'), 1600);
    } else {
      setCopyState('fail');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-12">
      {/* Main content area: 2-split desktop, stacked mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: input */}
        <div className="space-y-6">
          <BirthdateInput
            value={birthdate}
            asOfDate={asOfDate}
            useAsOf={useAsOf}
            error={error}
            onChange={setBirthdate}
            onAsOfDateChange={setAsOfDate}
            onUseAsOfChange={setUseAsOf}
            onClearError={clearError}
          />
        </div>

        {/* Right column: result */}
        <div className="lg:sticky lg:top-8 h-fit space-y-6">
          {age ? (
            <>
              {/* Age summary cards */}
              <AgeSummary age={age} />

              {/* Copy button */}
              <button
                onClick={handleCopy}
                disabled={!birthdate}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  copyState === 'success'
                    ? 'bg-success text-on-success'
                    : 'bg-brand text-on-brand hover:bg-brand-strong'
                } ${!birthdate ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={t('actions.copy')}
              >
                <Copy className="w-4 h-4" strokeWidth={1.75} />
                {copyState === 'success' ? t('actions.copied') : t('actions.copy')}
              </button>

              {/* Date facts */}
              <DateFacts age={age} locale={locale} />
            </>
          ) : (
            <AgeCalculatorEmptyState />
          )}
        </div>
      </div>

      {/* Recents section */}
      {mounted && recents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text">{t('recents.heading')}</h2>
          <RecentLookups recents={recents} onSelectRecent={selectRecent} onClear={clearRecents} />
        </div>
      )}

      {/* People favorites section */}
      {mounted && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text">{t('people.heading')}</h2>
          <PeopleList people={people} onAdd={addPerson} onRemove={removePerson} onSelect={(p) => setBirthdate(p.birthdate)} />
        </div>
      )}
    </div>
  );
}
