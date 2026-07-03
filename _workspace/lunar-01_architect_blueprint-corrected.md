# Lunar Converter — Architect Blueprint (Corrected)
**Status:** Architecture finalized per leader contract + VERIFIED KASI anchors. Ready for parallel implementation.

**Worktree (absolute):** `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-lunar-converter`  
**Branch:** `converter/lunar-converter`

**CRITICAL CORRECTIONS (from leader's verified KASI anchors):**
1. **SPEC test_scenario_1 was WRONG:** "solar 2024-03-15 → 윤2월 6일" is FALSE. **Actual = 음력 2024년 2월 6일 (평달, intercalation=FALSE).** 2024 has NO leap month. ✓ sexagenary/zodiac (甲辰/용) remain correct.
2. **Range validation:** lib's `setSolarDate` accepts 1390 (wider than SPEC). **conversion.ts must enforce 1391–2050 itself** (error: 'out_of_range'). lib's boolean is only for invalid_date/no_leap_month.
3. **Stateful lib:** If set*() returns false, **DO NOT call get***() — returns stale data. Each conversion must use a **new instance**.
4. **Test anchors:** Use verified file `lunar-00b_leader_verified-anchors.md` values, not SPEC examples.

---

## 1. Domain Layer — Pure TS (NO React/Next)

### conversion.ts
**CRITICAL CONTRACT:**
- Range validation: conversion.ts checks year ∈ [1391, 2050] → error: 'out_of_range'
- lib boolean: only indicates invalid_date or leap-month-not-exist
- Stateful lib: new instance per conversion; never call get*() after false
- Error codes: 'out_of_range', 'no_leap_month', 'invalid_date' (resolved to i18n messages in UI)

```typescript
export interface LunarEngine {
  setSolarDate(y: number, m: number, d: number): boolean;
  getLunarCalendar(): { year: number; month: number; day: number; intercalation: boolean };
  setLunarDate(y: number, m: number, d: number, intercalation: boolean): boolean;
  getSolarCalendar(): { year: number; month: number; day: number };
  getKoreanGapja(): { year: string; month: string; day: string; intercalation: boolean };
}

const TABLE_YEAR_MIN = 1391;
const TABLE_YEAR_MAX = 2050;

/**
 * CRITICAL: conversion.ts owns range validation (1391–2050).
 * lib's setSolarDate may accept 1390, but we enforce SPEC bounds.
 */
export async function solarToLunar(
  year: number, month: number, day: number,
  engine?: LunarEngine
): Promise<ConversionResult | ConversionError> {
  const eng = engine || (await loadEngine());
  
  // OUR validation (not lib's)
  if (year < TABLE_YEAR_MIN || year > TABLE_YEAR_MAX) {
    return { error: 'out_of_range' };
  }
  
  if (month < 1 || month > 12) return { error: 'invalid_date' };
  const maxDay = daysInMonth(month, year);
  if (day < 1 || day > maxDay) return { error: 'invalid_date' };
  
  // lib call
  if (!eng.setSolarDate(year, month, day)) {
    return { error: 'invalid_date' };
  }
  
  // ONLY read get*() if setSolarDate returned true
  const lunar = eng.getLunarCalendar();
  const sex = computeSexagenary(lunar.year);
  const zod = computeZodiac(lunar.year);
  
  return {
    solarDate: { year, month, day },
    lunarDate: {
      year: lunar.year,
      month: lunar.month,
      day: lunar.day,
      isLeap: lunar.intercalation,
    },
    sexagenary: { name: sex.name, hanja: sex.hanja, english: sex.english, stemIndex: sex.stemIndex, branchIndex: sex.branchIndex },
    zodiac: { key: zod.key, emoji: zod.emoji, branchIndex: zod.branchIndex },
  };
}

export async function lunarToSolar(
  year: number, month: number, day: number, isLeap: boolean,
  engine?: LunarEngine
): Promise<ConversionResult | ConversionError> {
  const eng = engine || (await loadEngine());
  
  if (year < TABLE_YEAR_MIN || year > TABLE_YEAR_MAX) {
    return { error: 'out_of_range' };
  }
  
  if (month < 1 || month > 12 || day < 1 || day > 30) {
    return { error: 'invalid_date' };
  }
  
  if (!eng.setLunarDate(year, month, day, isLeap)) {
    // If isLeap=true and false returned, likely "no leap month"
    return isLeap ? { error: 'no_leap_month' } : { error: 'invalid_date' };
  }
  
  // ONLY read get*() if setLunarDate returned true
  const solar = eng.getSolarCalendar();
  const sex = computeSexagenary(year);
  const zod = computeZodiac(year);
  
  return {
    solarDate: { year: solar.year, month: solar.month, day: solar.day },
    lunarDate: { year, month, day, isLeap },
    sexagenary: { name: sex.name, hanja: sex.hanja, english: sex.english, stemIndex: sex.stemIndex, branchIndex: sex.branchIndex },
    zodiac: { key: zod.key, emoji: zod.emoji, branchIndex: zod.branchIndex },
  };
}

async function loadEngine(): Promise<LunarEngine> {
  const mod = await import('korean-lunar-calendar');
  return {
    setSolarDate: (y, m, d) => mod.setSolarDate?.(y, m, d) ?? false,
    getLunarCalendar: () => mod.getLunarCalendar?.() ?? { year: 0, month: 0, day: 0, intercalation: false },
    setLunarDate: (y, m, d, i) => mod.setLunarDate?.(y, m, d, i) ?? false,
    getSolarCalendar: () => mod.getSolarCalendar?.() ?? { year: 0, month: 0, day: 0 },
    getKoreanGapja: () => mod.getKoreanGapja?.() ?? { year: '', month: '', day: '', intercalation: false },
  };
}
```

### sexagenary.ts & zodiac.ts
**Pure computation: (year - 4) % {10, 12} = stem/branch indices**

Verified anchors (from `lunar-00b_leader_verified-anchors.md`):
- 2024: (2024-4)%10=0→甲, %12=8→辰 = **甲辰 (Wood Dragon)** ✓
- 2023: (2023-4)%10=9→癸, %12=3→卯 = **癸卯 (Water Rabbit)** ✓
- 1391: (1391-4)%10=7→庚, %12=11→亥 = **庚亥 (Metal Pig)** ✓
- 2050: (2050-4)%10=6→庚, %12=6→午 = **庚午 (Metal Horse)** ✓

### schema.ts
Error codes (resolved in UI by i18n):
```typescript
error: 'out_of_range' | 'no_leap_month' | 'invalid_date'
```

### recents.ts
Immutable ops (pushRecent, pruneUnknown, loadRecents, saveRecents).

---

## 2. VERIFIED KASI Conversion Test Anchors

**From `lunar-00b_leader_verified-anchors.md` (ground truth):**

### solar → lunar
```
| solar      | lunar          | intercalation | note |
|------------|----------------|---------------|------|
| 2024-03-15 | 2024-02-06     | FALSE         | (NOT 윤2월) |
| 2024-10-18 | 2024-09-16     | FALSE         |      |
| 2023-04-04 | 2023-02-14     | TRUE (윤2월)  | Leap month |
| 1391-01-01 | 1390-11-18     | FALSE         | Min boundary |
| 2050-12-31 | 2050-11-18     | FALSE         | Max boundary |
```

### lunar → solar
```
| lunar      | leap  | solar      | note |
|------------|-------|------------|------|
| 2024-01-01 | FALSE | 2024-02-10 | 설날 2024 |
| 2024-08-15 | FALSE | 2024-09-17 | 추석 2024 |
| 2023-02-15 | TRUE  | 2023-04-05 | 윤2월 |
| 2050-01-01 | FALSE | 2050-01-23 | Max boundary |
```

### no_leap_month error case
```
- Year 2024: NO leap month
- Test: lunarToSolar(2024, m, d, isLeap=TRUE) → error: 'no_leap_month'
```

---

## 3. Domain Test Suite Structure

**RED→GREEN discipline (≥90% coverage):**

```typescript
describe('conversion.ts', () => {
  describe('solarToLunar', () => {
    it('converts 2024-03-15 to 2024년 2월 6일 (평달)', async () => {
      const result = await solarToLunar(2024, 3, 15);
      expect(result).toEqual({
        solarDate: { year: 2024, month: 3, day: 15 },
        lunarDate: { year: 2024, month: 2, day: 6, isLeap: false }, // NOT true
        sexagenary: { name: '갑진', hanja: '甲辰', english: 'Wood Dragon', stemIndex: 0, branchIndex: 4 },
        zodiac: { key: 'dragon', emoji: '🐉', branchIndex: 4 },
      });
    });
    
    it('converts 2023-04-04 to 2023년 윤2월 14일', async () => {
      const result = await solarToLunar(2023, 4, 4);
      expect((result as any).lunarDate.isLeap).toBe(true);
      expect((result as any).lunarDate.month).toBe(2);
    });
    
    it('rejects 1390-01-01 as out_of_range', async () => {
      const result = await solarToLunar(1390, 1, 1);
      expect(result).toEqual({ error: 'out_of_range' });
    });
    
    it('rejects 2051-01-01 as out_of_range', async () => {
      const result = await solarToLunar(2051, 1, 1);
      expect(result).toEqual({ error: 'out_of_range' });
    });
  });
  
  describe('lunarToSolar', () => {
    it('converts 2024-01-01 to 2024-02-10 (설날)', async () => {
      const result = await lunarToSolar(2024, 1, 1, false);
      expect((result as any).solarDate).toEqual({ year: 2024, month: 2, day: 10 });
    });
    
    it('converts 2023 윤2월 15일 to 2023-04-05', async () => {
      const result = await lunarToSolar(2023, 2, 15, true);
      expect((result as any).solarDate).toEqual({ year: 2023, month: 4, day: 5 });
      expect((result as any).lunarDate.isLeap).toBe(true);
    });
    
    it('rejects 2024 윤달 (no leap month that year)', async () => {
      const result = await lunarToSolar(2024, 1, 1, true);
      expect(result).toEqual({ error: 'no_leap_month' });
    });
  });
});

describe('sexagenary.ts', () => {
  it('computes 2024 as 甲辰 (Wood Dragon)', () => {
    const s = computeSexagenary(2024);
    expect(s).toEqual({
      name: '갑진', hanja: '甲辰', english: 'Wood Dragon',
      stemIndex: 0, branchIndex: 4,
    });
  });
  
  it('computes 2023 as 癸卯 (Water Rabbit)', () => {
    const s = computeSexagenary(2023);
    expect(s).toEqual({
      name: '계묘', hanja: '癸卯', english: 'Water Rabbit',
      stemIndex: 9, branchIndex: 3,
    });
  });
  
  it('computes 1391 as 庚亥 (Metal Pig)', () => {
    const s = computeSexagenary(1391);
    expect(s.hanja).toBe('庚亥');
    expect(s.english).toBe('Metal Pig');
  });
  
  it('computes 2050 as 庚午 (Metal Horse)', () => {
    const s = computeSexagenary(2050);
    expect(s.hanja).toBe('庚午');
    expect(s.english).toBe('Metal Horse');
  });
});

describe('zodiac.ts', () => {
  it('computes 2024 as dragon', () => {
    const z = computeZodiac(2024);
    expect(z).toEqual({ key: 'dragon', emoji: '🐉', branchIndex: 4 });
  });
  
  it('computes 2023 as rabbit', () => {
    const z = computeZodiac(2023);
    expect(z.key).toBe('rabbit');
    expect(z.emoji).toBe('🐰');
  });
});

describe('recents.ts', () => {
  it('pushRecent deduplicates and trims to 10', () => {
    const curr = [
      { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 1000 },
    ];
    const next = pushRecent(curr, '2024-03-15', '2024-02-06');
    expect(next).toHaveLength(1); // Deduplicated
    expect(next[0].ts).toBeGreaterThan(1000); // Updated ts
  });
  
  it('pruneUnknown filters out-of-range years', () => {
    const entries = [
      { solarDate: '1390-01-01', lunarDate: '1390-11-18', ts: 1000 },
      { solarDate: '2024-03-15', lunarDate: '2024-02-06', ts: 2000 },
      { solarDate: '2051-01-01', lunarDate: '2050-11-18', ts: 3000 },
    ];
    const pruned = pruneUnknown(entries);
    expect(pruned).toHaveLength(1);
    expect(pruned[0].solarDate).toBe('2024-03-15');
  });
});
```

---

## 4. useConverter Hook Contract

```typescript
interface ConverterState {
  solarYear, solarMonth, solarDay: number;
  lunarYear, lunarMonth, lunarDay: number;
  lunarIsLeap: boolean;
  result: ConversionResult | ConversionError | null;
  recents: Recent[];
  copyKey: 'solar' | 'lunar' | 'both' | null;
  isMounted: boolean;
}

export function useConverter(engine?: LunarEngine) {
  // Load recents on mount
  // Conversion effect: solar/lunar change → solarToLunar / lunarToSolar
  // Copy adapter: navigator.clipboard.writeText(text)
  // Return: {state, setSolar, setLunar, setToday, copy, loadRecent}
}
```

---

## 5. i18n Key Tree (tools.lunar-converter.*)

```json
{
  "title": "음력·양력 변환기",
  "description": "음력과 양력 사이의 날짜를 쉽게 변환하고, 60갑자와 띠를 확인하세요.",
  "meta": { "title": "음력·양력 변환기 - 간지·띠 조회", "description": "..." },
  "intro": { "eyebrow": "변환 도구", "h1": "음력·양력 변환기", "lead": "..." },
  "solar": { "label": "서력(양력)", "year": "연도", "month": "월", "day": "일" },
  "lunar": { "label": "음력", "year": "연도", "month": "월", "day": "일", "leapMonthLabel": "윤달" },
  "today": "오늘 조회",
  "result": { "sexagenary": "간지", "zodiac": "띠", "leap": "(윤)", "copyButtons": {...} },
  "zodiac": { "rat": "쥐", "ox": "소", ..., "pig": "돼지" },
  "recents": { "header": "최근 조회", "empty": "최근 조회 기록이 없습니다." },
  "errors": {
    "out_of_range": "지원하지 않는 년도입니다 (1391–2050).",
    "no_leap_month": "선택한 연도에 윤달이 없습니다.",
    "invalid_date": "유효하지 않은 날짜입니다."
  },
  "copyToast": "복사했습니다!",
  "howTo": { "title": "...", "introduction": "...", ... },
  "faq": { "q1": "...", "a1": "...", ... }
}
```

---

## 6. Platform Wiring

### Registry Entry (tools/registry.ts)
```typescript
{ id: 'lunar-converter', slug: 'lunar-converter', title: 'tools.lunar-converter.title', description: 'tools.lunar-converter.description', category: 'converter', accent: 'grape', icon: 'CalendarSync', status: 'live', isNew: false, keywords: ['음력', '양력', ...], order: 1 }
```

### Route Branch ([locale]/tools/[slug]/page.tsx)
```typescript
if (slug === 'lunar-converter') {
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(softwareApplicationJsonLd(...))}</script>
      <script type="application/ld+json">{JSON.stringify(faqPageJsonLd(...))}</script>
      <LunarConverterIntro locale={locale} />
      <Suspense fallback={<Skeleton />}><LunarConverter locale={locale} /></Suspense>
      <LunarConverterHowTo locale={locale} />
      <LunarConverterFaq locale={locale} />
    </>
  );
}
```

### llms.txt
```
/tools/lunar-converter — Lunar–Solar Calendar Converter: convert between Gregorian and Korean lunar dates (1391–2050), display sexagenary (간지), zodiac animal (띠).
```

---

## 7. Build Order

1. **Domain (domain-engineer, 1–1.5 days)**
   - schema.ts (zod), sexagenary.ts (pure 60-cycle), zodiac.ts (pure 12-animal), recents.ts (immutable ops), conversion.ts (engine wrapper + range validation).
   - Tests: verified KASI anchors (2024-03-15, 2023-04-04, 1391, 2050, out-of-range, no_leap_month).
   - ≥90% coverage.

2. **useConverter hook (domain-engineer, 0.5 days)**
   - Reducer + dynamic import + localStorage wiring + copy adapter.
   - ≥80% coverage.

3. **UI Components (ui-engineer, 2 days parallel)**
   - SolarInput, LunarInput, TodayButton, ConversionResult, RecentsList, ErrorMessage, LunarConverter (orchestrator).
   - Desktop 2-col (40%|60%), mobile 1-col.
   - aria-label, ≥44px tap targets, WCAG AA.

4. **Content + SEO (ui-engineer, 1 day parallel)**
   - LunarConverterIntro, LunarConverterHowTo, LunarConverterFaq + JSON-LD hooks.
   - **SSR outside mounted gate** (AI crawlers don't execute JS).

5. **i18n + Platform Wiring (platform-engineer, 1 day)**
   - Extend messages/{ko,en}.json, add registry entry, route branch + generateMetadata, llms.txt.

6. **Testing + Validation (qa-integration, 1 day)**
   - Vitest: domain ≥90%, overall ≥80%, 30+ units (conversion, sexagenary, zodiac, recents).
   - E2E: 5 scenarios (basic, boundaries+leap, Today+locale, recents+copy+a11y, SSR HTML).
   - tsc 0, SSG build (ko/en), visual regression (320/768/1024 both themes).

---

## Summary

**Core Contracts:**
- conversion.ts: range 1391–2050 (its own validation) + stateful lib (new instance per call) + error codes.
- sexagenary/zodiac: pure (year-4)%{10,12} math.
- useConverter: state machine + localStorage + copy.
- i18n: full tree `tools.lunar-converter.*`.
- Platform: ONE registry entry, slug branch, JSON-LD via seo.ts.

**Verified Anchors:**
- solarToLunar(2024, 3, 15) → 2024-02-06 평월 (NOT 윤달)
- solarToLunar(2023, 4, 4) → 2023 윤2월 14일
- lunarToSolar(2024, m, d, true) → error: 'no_leap_month'
- Sexagenary: 2024=甲辰, 2023=癸卯, 1391=庚亥, 2050=庚午
- Out-of-range: 1390, 2051 → error: 'out_of_range'

**QA Gates:** tsc 0 · domain ≥90%/overall ≥80% · KASI anchors verified · SSG (ko/en) · E2E 5 scenarios · a11y axe · visual 3bp.

