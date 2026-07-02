import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgeLookup } from './useAgeLookup';
import { toDateKey } from '@/lib/age-calculator/date';

describe('useAgeLookup', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with null birthdate', () => {
    const { result } = renderHook(() => useAgeLookup());
    expect(result.current.birthdate).toBeNull();
    expect(result.current.age).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('calculates age for valid birthdate', () => {
    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.setBirthdate('2000-03-15');
    });

    expect(result.current.age).not.toBeNull();
    expect(result.current.age?.manNai).toBeGreaterThanOrEqual(23);
    expect(result.current.error).toBeNull();
  });

  it('rejects invalid date format', () => {
    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.setBirthdate('2000-13-01');
    });

    expect(result.current.error).toBe('invalid');
    expect(result.current.age).toBeNull();
  });

  it('rejects future dates', () => {
    const { result } = renderHook(() => useAgeLookup());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = toDateKey(tomorrow);

    act(() => {
      result.current.setBirthdate(tomorrowKey);
    });

    expect(result.current.error).toBe('future');
    expect(result.current.age).toBeNull();
  });

  it('rejects dates older than 150 years', () => {
    const { result } = renderHook(() => useAgeLookup());
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 151);

    act(() => {
      result.current.setBirthdate(toDateKey(oldDate));
    });

    expect(result.current.error).toBe('too-old');
    expect(result.current.age).toBeNull();
  });

  it('pushes valid birthdate to recents', async () => {
    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.setBirthdate('1990-05-10');
    });

    await waitFor(() => {
      expect(result.current.recents).toContain('1990-05-10');
    });
  });

  it('does not push invalid birthdate to recents', async () => {
    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.setBirthdate('2099-01-01');
    });

    await waitFor(() => {
      expect(result.current.recents).not.toContain('2099-01-01');
    });
  });

  it('deduplicates recents (most recent first)', async () => {
    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.setBirthdate('1990-05-10');
    });

    await waitFor(() => {
      expect(result.current.recents).toContain('1990-05-10');
    });

    act(() => {
      result.current.setBirthdate('1985-01-01');
    });

    await waitFor(() => {
      expect(result.current.recents[0]).toBe('1985-01-01');
      expect(result.current.recents[1]).toBe('1990-05-10');
    });

    // Recalculate with first entry
    act(() => {
      result.current.setBirthdate('1985-01-01');
    });

    await waitFor(() => {
      expect(result.current.recents[0]).toBe('1985-01-01');
      expect(result.current.recents.length).toBe(2);
    });
  });

  it('respects max 10 recents', async () => {
    const { result } = renderHook(() => useAgeLookup());

    // Add 11 birthdates
    for (let i = 0; i < 11; i++) {
      const year = 1950 + i;
      act(() => {
        result.current.setBirthdate(`${year}-01-01`);
      });
    }

    await waitFor(() => {
      expect(result.current.recents.length).toBeLessThanOrEqual(10);
    });
  });

  it('adds person to favorites', () => {
    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.addPerson('홍길동', '1990-05-10');
    });

    expect(result.current.people).toHaveLength(1);
    expect(result.current.people[0]).toMatchObject({
      name: '홍길동',
      birthdate: '1990-05-10',
    });
  });

  it('removes person from favorites', () => {
    const { result } = renderHook(() => useAgeLookup());
    let personId = '';

    act(() => {
      result.current.addPerson('홍길동', '1990-05-10');
    });

    act(() => {
      personId = result.current.people[0].id;
      result.current.removePerson(personId);
    });

    expect(result.current.people).toHaveLength(0);
  });

  it('respects max 20 people', () => {
    const { result } = renderHook(() => useAgeLookup());

    for (let i = 0; i < 25; i++) {
      act(() => {
        result.current.addPerson(`Person${i}`, `${1950 + i}-01-01`);
      });
    }

    expect(result.current.people.length).toBeLessThanOrEqual(20);
  });

  it('selects recent and calculates age', () => {
    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.setBirthdate('1995-06-15');
    });

    const birthdate = '1995-06-15';
    act(() => {
      result.current.setBirthdate(null);
    });

    expect(result.current.age).toBeNull();

    act(() => {
      result.current.selectRecent(birthdate);
    });

    expect(result.current.birthdate).toBe(birthdate);
    expect(result.current.age).not.toBeNull();
  });

  it('clears recents', async () => {
    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.setBirthdate('1990-05-10');
    });

    await waitFor(() => {
      expect(result.current.recents).toHaveLength(1);
    });

    act(() => {
      result.current.clearRecents();
    });

    expect(result.current.recents).toHaveLength(0);
  });

  it('clears error', () => {
    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.setBirthdate('2099-01-01');
    });

    expect(result.current.error).toBe('future');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('handles asOfDate toggle', () => {
    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.setBirthdate('1990-05-10');
    });

    const ageBeforeToggle = result.current.age?.manNai;

    act(() => {
      result.current.setUseAsOf(true);
      result.current.setAsOfDate('2020-05-10');
    });

    // Age should be calculated based on 2020-05-10 instead of today
    const ageAfterToggle = result.current.age?.manNai;
    expect(ageAfterToggle).toBe(30);
  });

  it('copies result to clipboard on valid age', async () => {
    // Mock clipboard API
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.setBirthdate('1990-05-10');
    });

    const success = await result.current.copyResultToClipboard();
    expect(success).toBe(true);
    expect(mockClipboard.writeText).toHaveBeenCalled();
  });

  it('returns false on copy when no birthdate', async () => {
    const { result } = renderHook(() => useAgeLookup());

    const success = await result.current.copyResultToClipboard();
    expect(success).toBe(false);
  });

  it('persists people to localStorage', () => {
    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.addPerson('홍길동', '1990-05-10');
    });

    const stored = localStorage.getItem('jurepi-age-calculator-people');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.people).toHaveLength(1);
  });

  it('persists recents to localStorage', async () => {
    const { result } = renderHook(() => useAgeLookup());

    act(() => {
      result.current.setBirthdate('1990-05-10');
    });

    await waitFor(() => {
      const stored = localStorage.getItem('jurepi-age-calculator-recents');
      expect(stored).not.toBeNull();
    });
  });

  it('gracefully loads corrupted localStorage', () => {
    // Set corrupted data
    localStorage.setItem('jurepi-age-calculator-people', 'not json');
    localStorage.setItem('jurepi-age-calculator-recents', 'invalid');

    const { result } = renderHook(() => useAgeLookup());

    expect(result.current.people).toHaveLength(0);
    expect(result.current.recents).toHaveLength(0);
  });
});
