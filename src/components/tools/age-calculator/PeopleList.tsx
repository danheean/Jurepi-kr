'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Trash2, Plus } from 'lucide-react';
import { useState } from 'react';
import type { Person } from '@/lib/age-calculator/schema';

interface Props {
  people: Person[];
  onAdd: (name: string, birthdate: string) => void;
  onRemove: (personId: string) => void;
  onSelect: (person: Person) => void;
}

/**
 * PeopleList: Displays saved people and allows add/remove operations
 * - Collapsible section with saved people
 * - Each person card shows name + birthdate, can be selected or removed
 * - Add button opens inline modal with form
 */
export function PeopleList({ people, onAdd, onRemove, onSelect }: Props) {
  const t = useTranslations('tools.age-calculator');
  const locale = useLocale();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addBirthdate, setAddBirthdate] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddSubmit = () => {
    setAddError(null);

    // Validate name
    if (!addName.trim()) {
      setAddError('name');
      return;
    }

    // Validate birthdate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(addBirthdate)) {
      setAddError('birthdate');
      return;
    }

    // Call onAdd
    onAdd(addName.trim(), addBirthdate);

    // Reset form
    setAddName('');
    setAddBirthdate('');
    setIsAddOpen(false);
  };

  const handleAddCancel = () => {
    setAddName('');
    setAddBirthdate('');
    setAddError(null);
    setIsAddOpen(false);
  };

  /**
   * Format a birthdate (YYYY-MM-DD) for display
   */
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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">{t('people.heading')}</h3>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-on-brand text-xs font-semibold hover:bg-brand-strong transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('people.addButton')}
        </button>
      </div>

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
                className="flex-1 text-left min-h-11 rounded-md"
                aria-label={t('people.selectAria', { name: person.name })}
              >
                <div className="font-medium text-text">{person.name}</div>
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

      {/* Add modal (inline) */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-hairline rounded-xl shadow-lg p-6 max-w-[32rem] w-full space-y-4">
            <h2 className="text-lg font-bold text-text">{t('people.addModal.title')}</h2>

            {/* Name input */}
            <div className="space-y-1.5">
              <label htmlFor="add-name" className="block text-sm font-semibold text-text">
                {t('people.addModal.nameLabel')}
              </label>
              <input
                id="add-name"
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder={t('people.addModal.namePlaceholder')}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
                  addError === 'name'
                    ? 'border-danger bg-danger/5'
                    : 'border-hairline bg-surface-muted hover:border-hairline-strong focus:border-accent-mint'
                }`}
              />
              {addError === 'name' && (
                <p className="text-xs text-danger-ink">{t('input.errorInvalidDate')}</p>
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
                onChange={(e) => setAddBirthdate(e.target.value)}
                placeholder={t('people.addModal.birthdatePlaceholder')}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
                  addError === 'birthdate'
                    ? 'border-danger bg-danger/5'
                    : 'border-hairline bg-surface-muted hover:border-hairline-strong focus:border-accent-mint'
                }`}
              />
              {addError === 'birthdate' && (
                <p className="text-xs text-danger-ink">{t('input.errorInvalidDate')}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={handleAddCancel}
                className="px-4 py-2 rounded-lg border border-hairline text-text text-sm font-semibold hover:bg-surface-muted transition-colors"
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
        </div>
      )}
    </section>
  );
}
