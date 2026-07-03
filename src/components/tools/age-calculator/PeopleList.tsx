'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Trash2, Plus, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Person } from '@/lib/age-calculator/schema';

interface Props {
  people: Person[];
  onAdd: (name: string, birthdate: string) => void;
  onRemove: (personId: string) => void;
  onSelect: (person: Person) => void;
}

const NAME_MAX = 40;

/**
 * PeopleList: Displays saved people and allows add/remove operations.
 * The "add" affordance is an inline expanding form (not a modal overlay) —
 * per the product register, modals are a last resort; an inline form keeps
 * focus in flow, needs no focus-trap/scrim, and stays keyboard-simple.
 */
export function PeopleList({ people, onAdd, onRemove, onSelect }: Props) {
  const t = useTranslations('tools.age-calculator');
  const locale = useLocale();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addBirthdate, setAddBirthdate] = useState('');
  const [addError, setAddError] = useState<'name' | 'birthdate' | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Move focus into the form when it opens (accessible keyboard flow).
  useEffect(() => {
    if (isAddOpen) {
      nameInputRef.current?.focus();
    }
  }, [isAddOpen]);

  const handleAddSubmit = () => {
    if (!addName.trim()) {
      setAddError('name');
      nameInputRef.current?.focus();
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(addBirthdate)) {
      setAddError('birthdate');
      return;
    }
    onAdd(addName.trim(), addBirthdate);
    setAddName('');
    setAddBirthdate('');
    setAddError(null);
    setIsAddOpen(false);
  };

  const handleAddCancel = () => {
    setAddName('');
    setAddBirthdate('');
    setAddError(null);
    setIsAddOpen(false);
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleAddCancel();
    }
  };

  const formatBirthdate = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text">{t('people.heading')}</h3>
        {!isAddOpen && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-semibold hover:bg-brand-strong transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('people.addButton')}
          </button>
        )}
      </div>

      {/* Inline add form (replaces the old modal overlay) */}
      {isAddOpen && (
        <div
          className="bg-surface-muted border border-hairline rounded-lg p-4 space-y-4"
          onKeyDown={handleFormKeyDown}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text">{t('people.addModal.title')}</h4>
            <button
              onClick={handleAddCancel}
              aria-label={t('people.addModal.cancel')}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-surface-sunken hover:text-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Name input */}
          <div className="space-y-1.5">
            <label htmlFor="add-name" className="block text-sm font-semibold text-text">
              {t('people.addModal.nameLabel')}
            </label>
            <input
              id="add-name"
              ref={nameInputRef}
              type="text"
              value={addName}
              maxLength={NAME_MAX}
              onChange={(e) => {
                setAddName(e.target.value);
                if (addError === 'name') setAddError(null);
              }}
              placeholder={t('people.addModal.namePlaceholder')}
              aria-invalid={addError === 'name'}
              aria-describedby={addError === 'name' ? 'add-name-error' : undefined}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-surface transition-colors ${
                addError === 'name'
                  ? 'border-danger'
                  : 'border-hairline hover:border-hairline-strong focus:border-accent-mint'
              }`}
            />
            {addError === 'name' && (
              <p id="add-name-error" className="text-xs text-danger-ink" role="alert" aria-live="polite">
                {t('people.addModal.errorName')}
              </p>
            )}
          </div>

          {/* Birthdate input */}
          <div className="space-y-1.5">
            <label htmlFor="add-birthdate" className="block text-sm font-semibold text-text">
              {t('people.addModal.birthdateLabel')}
            </label>
            <input
              id="add-birthdate"
              type="date"
              value={addBirthdate}
              onChange={(e) => {
                setAddBirthdate(e.target.value);
                if (addError === 'birthdate') setAddError(null);
              }}
              placeholder={t('people.addModal.birthdatePlaceholder')}
              aria-invalid={addError === 'birthdate'}
              aria-describedby={addError === 'birthdate' ? 'add-birthdate-error' : undefined}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-surface transition-colors ${
                addError === 'birthdate'
                  ? 'border-danger'
                  : 'border-hairline hover:border-hairline-strong focus:border-accent-mint'
              }`}
            />
            {addError === 'birthdate' && (
              <p id="add-birthdate-error" className="text-xs text-danger-ink" role="alert" aria-live="polite">
                {t('people.addModal.errorBirthdate')}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleAddCancel}
              className="px-4 py-2 rounded-lg border border-hairline text-text text-sm font-semibold hover:bg-surface-sunken transition-colors"
            >
              {t('people.addModal.cancel')}
            </button>
            <button
              onClick={handleAddSubmit}
              className="px-4 py-2 rounded-lg bg-brand text-on-brand text-sm font-semibold hover:bg-brand-strong transition-colors"
            >
              {t('people.addModal.save')}
            </button>
          </div>
        </div>
      )}

      {/* People list or empty state */}
      {people.length === 0 ? (
        <div className="p-4 bg-surface-muted border border-hairline rounded-lg text-center text-sm text-text-secondary">
          {t('people.emptyState')}
        </div>
      ) : (
        <div className="space-y-2">
          {people.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between gap-3 p-3 bg-surface border border-hairline rounded-lg hover:bg-surface-muted transition-colors"
            >
              <button
                onClick={() => onSelect(person)}
                className="flex-1 min-w-0 text-left min-h-11 rounded-md"
                aria-label={t('people.selectAria', { name: person.name })}
              >
                <div className="font-medium text-text break-words">{person.name}</div>
                <div className="text-xs text-text-secondary">{formatBirthdate(person.birthdate)}</div>
              </button>
              <button
                onClick={() => onRemove(person.id)}
                aria-label={t('people.removeButton')}
                className="flex-shrink-0 inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg hover:bg-danger/10 text-danger-ink transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
