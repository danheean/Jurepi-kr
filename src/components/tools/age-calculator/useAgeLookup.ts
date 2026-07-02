import { useState, useEffect, useCallback } from 'react';
import { calculateAge, type AgeResult } from '@/lib/age-calculator/age';
import type { DateKey } from '@/lib/age-calculator/date';
import { today, parseDateKey } from '@/lib/age-calculator/date';
import { parseBirthdateInput, parsePeopleStore, type Person, type PeopleStore } from '@/lib/age-calculator/schema';
import { addPerson, removePerson } from '@/lib/age-calculator/people';
import { pushRecent, serializeRecents, deserializeRecents } from '@/lib/age-calculator/recents';

export interface UseAgeLookupState {
  birthdate: string | null;
  asOfDate: string;
  useAsOf: boolean;
  age: AgeResult | null;
  error: string | null; // 'invalid', 'future', 'too-old'
  people: Person[];
  recents: string[]; // DateKey[]
  selectedPersonId: string | null;
}

export interface UseAgeLookupActions {
  setBirthdate(dateKey: DateKey | null): void;
  setAsOfDate(dateKey: DateKey): void;
  setUseAsOf(use: boolean): void;
  addPerson(name: string, birthdate: DateKey): void;
  removePerson(personId: string): void;
  selectRecent(dateKey: DateKey): void;
  clearRecents(): void;
  clearError(): void;
  copyResultToClipboard(): Promise<boolean>;
}

export type UseAgeLookupReturn = UseAgeLookupState & UseAgeLookupActions;

/**
 * useAgeLookup: Main state management hook for age calculator.
 * - On mount: load people + recents from localStorage
 * - On birthdate change: parse, validate, calculate age
 * - On valid calculation: push to recents
 * - Copy: format and copy to clipboard
 */
export function useAgeLookup(): UseAgeLookupReturn {
  const [birthdate, setBirthdateState] = useState<string | null>(null);
  const [asOfDate, setAsOfDateState] = useState<string>('');
  const [useAsOf, setUseAsOf] = useState(false);
  const [age, setAge] = useState<AgeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleStore, setPeopleStore] = useState<PeopleStore | null>(null);
  const [recents, setRecents] = useState<string[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // On mount: load from localStorage
  useEffect(() => {
    const now = today();
    setAsOfDateState(now);

    // Load people
    try {
      const peopleJson = localStorage.getItem('jurepi-age-calculator-people');
      if (peopleJson) {
        const store = parsePeopleStore(JSON.parse(peopleJson));
        setPeopleStore(store);
        setPeople(store.people);
      } else {
        const now = Date.now();
        const emptyStore: PeopleStore = {
          version: 1,
          people: [],
          meta: { createdAt: now, updatedAt: now },
        };
        setPeopleStore(emptyStore);
      }
    } catch {
      // Graceful fail on parse error
      const now = Date.now();
      const emptyStore: PeopleStore = {
        version: 1,
        people: [],
        meta: { createdAt: now, updatedAt: now },
      };
      setPeopleStore(emptyStore);
    }

    // Load recents
    try {
      const recentsJson = localStorage.getItem('jurepi-age-calculator-recents');
      if (recentsJson) {
        const parsed = deserializeRecents(recentsJson);
        setRecents(parsed);
      }
    } catch {
      // Graceful fail on parse error
      setRecents([]);
    }
  }, []);

  // When birthdate changes: validate and calculate age
  const setBirthdate = useCallback(
    (dateKey: DateKey | null) => {
      setBirthdateState(dateKey);
      setError(null);
      setSelectedPersonId(null);

      if (!dateKey) {
        setAge(null);
        return;
      }

      // Parse and validate
      const parsed = parseBirthdateInput({ birthdate: dateKey });
      if (!parsed) {
        // Figure out which error
        const [y, m, d] = dateKey.split('-').map(Number);
        const date = new Date(y, m - 1, d);

        // Check if it's an invalid date (e.g., Feb 30)
        if (date.getMonth() !== m - 1 || date.getDate() !== d) {
          setError('invalid');
          setAge(null);
          return;
        }

        // Check if future
        const now = new Date();
        if (date > now) {
          setError('future');
          setAge(null);
          return;
        }

        // Check if too old
        const oneHundredFiftyYearsAgo = new Date();
        oneHundredFiftyYearsAgo.setFullYear(
          oneHundredFiftyYearsAgo.getFullYear() - 150
        );
        if (date < oneHundredFiftyYearsAgo) {
          setError('too-old');
          setAge(null);
          return;
        }

        setError('invalid');
        setAge(null);
        return;
      }

      // Valid input: calculate age
      const birthDate = parseDateKey(parsed.birthdate);
      const asOf = useAsOf ? parseDateKey(asOfDate) : new Date();
      const result = calculateAge(birthDate, asOf);
      setAge(result);
      setError(null);

      // Push to recents (only on valid calculation)
      setRecents((prev) => pushRecent(prev, dateKey, 10));
    },
    [asOfDate, useAsOf]
  );

  const setAsOfDate = useCallback(
    (dateKey: DateKey) => {
      setAsOfDateState(dateKey);

      // Recalculate age if birthdate is set
      if (birthdate) {
        const parsed = parseBirthdateInput({ birthdate });
        if (parsed) {
          const birthDate = parseDateKey(parsed.birthdate);
          const asOf = parseDateKey(dateKey);
          const result = calculateAge(birthDate, asOf);
          setAge(result);
        }
      }
    },
    [birthdate]
  );

  const handleSetUseAsOf = useCallback(
    (use: boolean) => {
      setUseAsOf(use);

      // If toggling on, use today's date; if toggling off, recalculate with today
      if (birthdate) {
        const parsed = parseBirthdateInput({ birthdate });
        if (parsed) {
          const birthDate = parseDateKey(parsed.birthdate);
          const asOf = use ? parseDateKey(asOfDate) : new Date();
          const result = calculateAge(birthDate, asOf);
          setAge(result);
        }
      }
    },
    [birthdate, asOfDate]
  );

  const handleAddPerson = useCallback(
    (name: string, newBirthdate: DateKey) => {
      if (!peopleStore) return;

      const updated = addPerson(peopleStore, name, newBirthdate);
      setPeopleStore(updated);
      setPeople(updated.people);

      // Persist to localStorage
      try {
        localStorage.setItem('jurepi-age-calculator-people', JSON.stringify(updated));
      } catch {
        // Quota exceeded; keep in-memory state (fully usable)
      }
    },
    [peopleStore]
  );

  const handleRemovePerson = useCallback(
    (personId: string) => {
      if (!peopleStore) return;

      const updated = removePerson(peopleStore, personId);
      setPeopleStore(updated);
      setPeople(updated.people);

      // Persist to localStorage
      try {
        localStorage.setItem('jurepi-age-calculator-people', JSON.stringify(updated));
      } catch {
        // Quota exceeded; keep in-memory state
      }

      if (selectedPersonId === personId) {
        setSelectedPersonId(null);
      }
    },
    [peopleStore, selectedPersonId]
  );

  const selectRecent = useCallback(
    (dateKey: DateKey) => {
      setBirthdate(dateKey);
    },
    [setBirthdate]
  );

  const clearRecents = useCallback(() => {
    setRecents([]);
    try {
      localStorage.setItem('jurepi-age-calculator-recents', '[]');
    } catch {
      // Quota exceeded; keep empty in-memory
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Persist recents to localStorage whenever they change
  useEffect(() => {
    if (recents.length === 0 && birthdate === null) return; // Don't write on first load

    try {
      localStorage.setItem('jurepi-age-calculator-recents', serializeRecents(recents));
    } catch {
      // Quota exceeded; keep in-memory state (fully usable)
    }
  }, [recents, birthdate]);

  const copyResultToClipboard = useCallback(async (): Promise<boolean> => {
    if (!age || !birthdate) return false;

    // Format summary text
    const lines = [
      `나이 계산기 결과`,
      `생년월일: ${birthdate}`,
      `만 나이: ${age.manNai}세`,
      `연 나이: ${age.yeonNai}세`,
      `세는 나이: ${age.seeneunNai}세`,
      `살아온 날: ${age.daysLived}일`,
    ];

    const text = lines.join('\n');

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, [age, birthdate]);

  return {
    birthdate,
    asOfDate,
    useAsOf,
    age,
    error,
    people,
    recents,
    selectedPersonId,
    setBirthdate,
    setAsOfDate,
    setUseAsOf: handleSetUseAsOf,
    addPerson: handleAddPerson,
    removePerson: handleRemovePerson,
    selectRecent,
    clearRecents,
    clearError,
    copyResultToClipboard,
  };
}
