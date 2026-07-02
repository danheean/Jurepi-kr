'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { encode, handleAlreadyEncoded } from '@/lib/url-encoder/encode';
import { decode } from '@/lib/url-encoder/decode';
import { parseQueryString } from '@/lib/url-encoder/query-parser';
import type { QueryTableRow, UrlEncoderError } from '@/lib/url-encoder/schema';
import { pushRecent, deserializeRecents, serializeRecents } from '@/lib/url-encoder/recents';
import { STORAGE_KEY, INPUT_MAX_LEN, RECENTS_MAX } from '@/lib/url-encoder/schema';

const CHARSET_KEY = 'jurepi-url-encoder-charset';

// Debounce for the live recompute so async work (EUC-KR dynamic import) does not
// churn on every keystroke. Enter/process() bypasses this for instant feedback.
const COMPUTE_DEBOUNCE_MS = 180;

interface ComputeOutput {
  result: string | null;
  error: UrlEncoderError | null;
  alreadyEncodedHint: boolean;
}

/**
 * Pure-ish compute: given the current input + options, produce the result.
 * Shared by the live-recompute effect and the explicit process() dispatcher so
 * the displayed result always matches the current input (no stale results).
 */
async function computeResult(params: {
  text: string;
  direction: 'encode' | 'decode';
  mode: 'component' | 'uri';
  charset: 'utf-8' | 'euc-kr';
  plusAsSpace: boolean;
  batchMode: boolean;
}): Promise<ComputeOutput> {
  const { text, direction, mode, charset, plusAsSpace, batchMode } = params;

  if (!text.trim()) {
    return { result: null, error: null, alreadyEncodedHint: false };
  }

  if (direction === 'encode') {
    const hint = handleAlreadyEncoded(text);
    if (batchMode) {
      const lines = text.split('\n');
      const encodedLines = await Promise.all(
        lines.map((line) => encode(line, mode, charset).then((r) => r.result || ''))
      );
      return { result: encodedLines.join('\n'), error: null, alreadyEncodedHint: hint };
    }
    const r = await encode(text, mode, charset);
    if (r.error) return { result: null, error: r.error, alreadyEncodedHint: false };
    return { result: r.result || null, error: null, alreadyEncodedHint: hint };
  }

  if (batchMode) {
    const lines = text.split('\n');
    const decodedLines = await Promise.all(
      lines.map((line) =>
        decode(line, mode, charset, { plusAsSpace }).then((r) => r.result || '')
      )
    );
    return { result: decodedLines.join('\n'), error: null, alreadyEncodedHint: false };
  }
  const r = await decode(text, mode, charset, { plusAsSpace });
  if (r.error) return { result: null, error: r.error, alreadyEncodedHint: false };
  return { result: r.result || null, error: null, alreadyEncodedHint: false };
}

export interface UseUrlEncoderState {
  text: string;
  direction: 'encode' | 'decode';
  mode: 'component' | 'uri';
  charset: 'utf-8' | 'euc-kr';
  plusAsSpace: boolean;
  batchMode: boolean;
  queryTableRows: QueryTableRow[];
  queryTableInput: string;
  result: string | null;
  error: UrlEncoderError | null;
  alreadyEncodedHint: boolean;
  recents: string[];
  isLoading: boolean;
}

export interface UseUrlEncoderActions {
  setText(text: string): void;
  setDirection(dir: 'encode' | 'decode'): void;
  setMode(mode: 'component' | 'uri'): void;
  setCharset(charset: 'utf-8' | 'euc-kr'): void;
  setPlusAsSpace(value: boolean): void;
  setBatchMode(value: boolean): void;
  setQueryTableRows(rows: QueryTableRow[]): void;
  setQueryTableInput(input: string): void;
  process(): Promise<void>;
  addRecent(text: string): void;
  clearRecents(): void;
  copyResult(): Promise<boolean>;
  clearAll(): void;
}

export function useUrlEncoder(): [UseUrlEncoderState, UseUrlEncoderActions] {
  const [state, setState] = useState<UseUrlEncoderState>({
    text: '',
    direction: 'encode',
    mode: 'component',
    charset: 'utf-8',
    plusAsSpace: false,
    batchMode: false,
    queryTableRows: [],
    queryTableInput: '',
    result: null,
    error: null,
    alreadyEncodedHint: false,
    recents: [],
    isLoading: false,
  });

  // Always-current snapshot of state so stable callbacks (process/copyResult)
  // never read a stale closure — assigned every render.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Monotonic request id: guards against out-of-order async settle (EUC-KR
  // dynamic import) so only the latest compute wins.
  const reqIdRef = useRef(0);

  // Mount flag to recover/persist localStorage only on the client.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let loadedRecents: string[] = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          loadedRecents = deserializeRecents(stored);
        }
      }
    } catch {
      // Silent fail: use empty recents if localStorage unavailable
    }

    let loadedCharset: 'utf-8' | 'euc-kr' = 'utf-8';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(CHARSET_KEY);
        if (stored === 'euc-kr' || stored === 'utf-8') {
          loadedCharset = stored;
        }
      }
    } catch {
      // Silent fail: default to utf-8
    }

    setState((prev) => ({
      ...prev,
      recents: loadedRecents,
      charset: loadedCharset,
    }));
    setMounted(true);
  }, []);

  // Persist recents whenever they change (after mount, so we never overwrite
  // stored recents with the pre-load empty array).
  useEffect(() => {
    if (!mounted) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, serializeRecents(state.recents));
      }
    } catch {
      // Silent fail
    }
  }, [state.recents, mounted]);

  // Live recompute: the result always reflects the current input + options.
  // Debounced so async EUC-KR loading does not churn per keystroke; the reqId
  // guard drops stale settles. This removes the need to press Enter and keeps
  // the result in sync when direction/mode/charset change.
  useEffect(() => {
    const { text, direction, mode, charset, plusAsSpace, batchMode } = state;

    if (!text.trim()) {
      setState((prev) =>
        prev.result === null && prev.error === null && !prev.alreadyEncodedHint && !prev.isLoading
          ? prev
          : { ...prev, result: null, error: null, alreadyEncodedHint: false, isLoading: false }
      );
      return;
    }

    const reqId = ++reqIdRef.current;
    setState((prev) => (prev.isLoading ? prev : { ...prev, isLoading: true }));

    const timer = setTimeout(() => {
      computeResult({ text, direction, mode, charset, plusAsSpace, batchMode })
        .then((next) => {
          if (reqId !== reqIdRef.current) return; // superseded
          setState((prev) => ({ ...prev, ...next, isLoading: false }));
        })
        .catch((err) => {
          if (reqId !== reqIdRef.current) return;
          setState((prev) => ({
            ...prev,
            error: {
              code: 'encodingFailed',
              message: 'Unexpected error',
              details: err instanceof Error ? err.message : String(err),
            },
            result: null,
            isLoading: false,
          }));
        });
    }, COMPUTE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [
    state.text,
    state.direction,
    state.mode,
    state.charset,
    state.plusAsSpace,
    state.batchMode,
  ]);

  const persistCharset = useCallback((charset: 'utf-8' | 'euc-kr') => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CHARSET_KEY, charset);
      }
    } catch {
      // Silent fail
    }
  }, []);

  const setText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, text: text.slice(0, INPUT_MAX_LEN) }));
  }, []);

  // Option setters only update their field — the live effect recomputes the
  // result, so toggling direction/mode/charset re-runs instead of clearing.
  const setDirection = useCallback((dir: 'encode' | 'decode') => {
    setState((prev) => ({ ...prev, direction: dir }));
  }, []);

  const setMode = useCallback((mode: 'component' | 'uri') => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const setCharset = useCallback(
    (charset: 'utf-8' | 'euc-kr') => {
      setState((prev) => ({ ...prev, charset }));
      persistCharset(charset);
    },
    [persistCharset]
  );

  const setPlusAsSpace = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, plusAsSpace: value }));
  }, []);

  const setBatchMode = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, batchMode: value }));
  }, []);

  const setQueryTableRows = useCallback((rows: QueryTableRow[]) => {
    setState((prev) => ({ ...prev, queryTableRows: rows }));
  }, []);

  const setQueryTableInput = useCallback((input: string) => {
    const rows = parseQueryString(input);
    setState((prev) => ({ ...prev, queryTableInput: input, queryTableRows: rows }));
  }, []);

  // Immediate dispatch (Enter): computes now, bypassing the debounce. Reads the
  // latest state via stateRef and bumps reqId so any pending debounced compute
  // does not clobber this result.
  const process = useCallback(async () => {
    const s = stateRef.current;

    if (!s.text.trim()) {
      setState((prev) => ({
        ...prev,
        result: null,
        error: null,
        alreadyEncodedHint: false,
        isLoading: false,
      }));
      return;
    }

    const reqId = ++reqIdRef.current;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const next = await computeResult({
        text: s.text,
        direction: s.direction,
        mode: s.mode,
        charset: s.charset,
        plusAsSpace: s.plusAsSpace,
        batchMode: s.batchMode,
      });
      if (reqId !== reqIdRef.current) return;
      setState((prev) => ({ ...prev, ...next, isLoading: false }));
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      setState((prev) => ({
        ...prev,
        error: {
          code: 'encodingFailed',
          message: 'Unexpected error',
          details: err instanceof Error ? err.message : String(err),
        },
        result: null,
        isLoading: false,
      }));
    }
  }, []);

  // Functional update so batched calls accumulate correctly (no stale closure).
  const addRecent = useCallback((text: string) => {
    if (!text.trim()) return;
    setState((prev) => ({ ...prev, recents: pushRecent(prev.recents, text, RECENTS_MAX) }));
  }, []);

  const clearRecents = useCallback(() => {
    setState((prev) => ({ ...prev, recents: [] }));
  }, []);

  const copyResult = useCallback(async (): Promise<boolean> => {
    const result = stateRef.current.result;
    if (!result) return false;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(result);
        return true;
      }

      const textarea = document.createElement('textarea');
      textarea.value = result;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }, []);

  const clearAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      text: '',
      result: null,
      error: null,
      alreadyEncodedHint: false,
    }));
  }, []);

  return [
    state,
    {
      setText,
      setDirection,
      setMode,
      setCharset,
      setPlusAsSpace,
      setBatchMode,
      setQueryTableRows,
      setQueryTableInput,
      process,
      addRecent,
      clearRecents,
      copyResult,
      clearAll,
    },
  ];
}
