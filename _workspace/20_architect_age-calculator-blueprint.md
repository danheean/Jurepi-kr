# Age Calculator (나이 계산기) — Clean Architecture Blueprint

**Status:** APPROVED FOR BUILD  
**Scope:** Single-route SPA tool (`/[locale]/tools/age-calculator`)  
**Deliverable:** [SPEC.md](../docs/services/calculator/age-calculator/SPEC.md) compliance blueprint  
**Patterns:** Mirror qna-a-day (date.ts), url-encoder (recents.ts); SSR SEO sections outside mounted gate (per new-word/url-encoder pattern)  

---

## 1. Layer Decomposition

Age Calculator follows Jurepi's **clean architecture layering**: dependency flow is **unidirectional inward** (React/Next never pollutes domain).

### Layer 1: Domain (Pure, No React/Next/DOM)
**Files:** `src/lib/age-calculator/*`  
**Responsibility:** All age calculations, date math, localStorage schema (type definitions only).  
**Invariant:** Zero React imports. Fully tested (≥80% coverage). Immutable operations.

| File | Ownership | Key Exports |
|------|-----------|-------------|
| `schema.ts` | domain-engineer | `BirthdateInput`, `Person`, `PeopleStore` (zod schemas); `parseBirthdateInput()`, `parsePeopleStore()` |
| `date.ts` | domain-engineer | `DateKey`, `toDateKey()`, `parseDateKey()`, `addDays()`, `isLeapYear()`, `daysInMonth()`, `today()` (pattern: mirror `qna-a-day/date.ts`) |
| `age.ts` | domain-engineer | `manNai()`, `yeonNai()`, `seeneunNai()`, `dayOfWeek()`, `daysLived()`, `breakdown()`, `nextBirthdayCountdown()`, `AgeResult` type |
| `zodiac.ts` | domain-engineer | `koreanZodiac(year)` → zodiac **key** (e.g. `'rat'`, `'ox'`, not localized), `starSign(month, day)` → sign **key** (e.g. `'aries'`); both return stable i18n keys, not strings. Lookup tables only (no Intl calls). |
| `people.ts` | domain-engineer | `addPerson()`, `removePerson()`, `updatePerson()`, `pruneUnknown()` (immutable ops per spec) |
| `recents.ts` | domain-engineer | `pushRecent()`, `pruneUnknown()`, `serializeRecents()`, `deserializeRecents()` (pattern: mirror `src/lib/url-encoder/recents.ts` exactly) |
| `*.test.ts` | domain-engineer | Vitest; ≥80% coverage threshold (domain must reach 100% for age/zodiac/date calcs) |

**Contracts (exact signatures):**

```typescript
// schema.ts
export const BirthdateInputSchema = z.object({
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  // Internal validation: not future, not >150 years old → zod.refine()
});
export type BirthdateInput = z.infer<typeof BirthdateInputSchema>;

export const PersonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type Person = z.infer<typeof PersonSchema>;

export const PeopleStoreSchema = z.object({
  version: z.literal(1),
  people: z.array(PersonSchema).max(20),
  meta: z.object({ createdAt: z.number(), updatedAt: z.number() }),
});
export type PeopleStore = z.infer<typeof PeopleStoreSchema>;

export function parseBirthdateInput(input: unknown): BirthdateInput | null;
export function parsePeopleStore(raw: unknown): PeopleStore;
```

```typescript
// date.ts
export type DateKey = string; // "YYYY-MM-DD"
export function toDateKey(d: Date): DateKey;
export function parseDateKey(k: DateKey): Date; // local midnight, never UTC
export function addDays(k: DateKey, delta: number): DateKey;
export function isLeapYear(y: number): boolean;
export function daysInMonth(y: number, m: number): number;
export function today(now?: Date): DateKey;
```

```typescript
// age.ts
export interface AgeResult {
  manNai: number;        // Legal age (Korea 2023+)
  yeonNai: number;       // Calendar year based
  seeneunNai: number;    // Traditional Korean counting
  dayOfWeek: number;     // 0–6 (0=Sun)
  daysLived: number;
  breakdown: { years: number; months: number; days: number };
  nextBirthdayCountdown: number; // 1–366
  zodiacKey: string;     // e.g., 'rat', maps to i18n tools.age-calculator.zodiac.rat
  starSignKey: string;   // e.g., 'aries', maps to i18n tools.age-calculator.starSign.aries
}

export function manNai(birthDate: Date, asOfDate: Date): number;
export function yeonNai(birthYear: number, asOfYear: number): number;
export function seeneunNai(birthYear: number, asOfYear: number): number;
export function dayOfWeek(d: Date): number; // getDay()
export function daysLived(birthDate: Date, asOfDate: Date): number;
export function breakdown(birthDate: Date, asOfDate: Date): AgeResult['breakdown'];
export function nextBirthdayCountdown(birthDate: Date, asOfDate: Date): number;
export function calculateAge(birthDate: Date, asOfDate: Date): AgeResult;
```

```typescript
// zodiac.ts
export function koreanZodiac(year: number): string; // key: 'rat', 'ox', 'tiger', ... 'pig'
export function starSign(month: number, day: number): string; // key: 'aries', 'taurus', ...
// Lookup tables only; no localization, no Intl calls
```

```typescript
// people.ts (immutable ops)
export function addPerson(store: PeopleStore, name: string, birthdate: DateKey): PeopleStore;
export function removePerson(store: PeopleStore, personId: string): PeopleStore;
export function updatePerson(store: PeopleStore, personId: string, updates: Partial<Omit<Person, 'id'>>): PeopleStore;
export function pruneUnknown(store: PeopleStore, knownIds?: string[]): PeopleStore;
```

```typescript
// recents.ts (mirror url-encoder pattern)
export function pushRecent(list: string[], dateKey: DateKey, max?: number): string[];
export function pruneUnknown(list: unknown[]): string[]; // validates DateKey format
export function serializeRecents(recents: string[]): string;
export function deserializeRecents(json: string): string[];
```

**Invariants (must never be violated):**
- All ages ≥ 0
- breakdown.years ≤ manNai
- nextBirthdayCountdown ∈ [1, 366]
- DateKey format strict: `\d{4}-\d{2}-\d{2}` (use regex)
- Birthdate not future; not >150 years ago
- Zodiac/starSign keys are **stable, locale-agnostic** strings (e.g., `'rat'`, `'aries'`) — never localized; localization happens in UI layer via i18n.
- People.max = 20; Recents.max = 10
- All date calculations use **local midnight** via `new Date(year, month-1, day)`, NEVER UTC

---

### Layer 2: Use Case / Hook
**Files:** `src/components/tools/age-calculator/useAgeLookup.ts`  
**Responsibility:** Orchestrate birthdate input parsing, age calculation, localStorage I/O for people + recents.  
**Dependency:** Consumes `lib/age-calculator/*` (domain). No external HTTP.

**Contract:**

```typescript
// useAgeLookup.ts
export interface UseAgeLookupState {
  birthdate: string | null;         // DateKey or null
  asOfDate: string;                 // DateKey (default: today())
  useAsOf: boolean;                 // Toggle "as-of" date input
  age: AgeResult | null;
  error: string | null;             // "invalid", "future", "too-old"
  people: Person[];
  recents: string[];                // DateKey[]
  selectedPersonId: string | null;
}

export interface UseAgeLookupActions {
  setBirthdate(dateKey: DateKey | null): void;
  setAsOfDate(dateKey: DateKey): void;
  setUseAsOf(use: boolean): void;
  addPerson(name: string, birthdate: DateKey): void;     // Validates, records to recents too
  removePerson(personId: string): void;
  selectRecent(dateKey: DateKey): void;                  // Prefills birthdate, recalcs
  clearRecents(): void;
  clearError(): void;
  copyResultToClipboard(): Promise<boolean>;
}

export function useAgeLookup(): UseAgeLookupState & UseAgeLookupActions;

// Internal behaviors:
// - On mount: load people + recents from localStorage (graceful fail: empty if unavailable)
// - On birthdate change: parse via BirthdateInputSchema, validate, calculate age, push to recents (ONLY if valid)
// - Copy: formats age summary + facts as text, writes to clipboard (silent fail if unavailable)
// - Toast lifecycle: error toasts auto-dismiss 2s; success toast 1.6s (via platform Toast)
```

**Invariants:**
- recents only recorded on VALID calculation (invalid input ≠ push to recents)
- Copy only enabled if birthdate is set and valid
- localStorage quota exceeded: keep in-memory, fully usable, no error throw
- Selecting a recent prefills birthdate + recalculates immediately

---

### Layer 3: UI Components (Client Island)
**Files:** `src/components/tools/age-calculator/*.tsx`  
**Responsibility:** Render interactive UI, bind to `useAgeLookup()` state/actions.  
**Dependency:** Consumes `useAgeLookup()`, platform Toast, platform Intl (useLocale), DESIGN tokens.

**Component Hierarchy:**

```
AgeCalculator (Client Component, "use client")
├─ AgeCalculatorIntro (SSR, server-render where possible)
├─ BirthdateInput
│  └── Native date input + "as-of" toggle
├─ AgeSummary
│  ├── AgeCard (만 나이)
│  ├── AgeCard (연 나이)
│  └── AgeCard (세는 나이) + note about 2023 unification
├─ DateFacts
│  ├── ZodiacTile (띠 + icon)
│  ├── StarSignTile (별자리 + Unicode symbol)
│  ├── DayOfWeekTile (요일 via Intl.DateTimeFormat)
│  ├── DaysLivedTile
│  ├── BreakdownTile (X년 Y개월 Z일)
│  └── CountdownTile (다음 생일까지 X일)
├─ CopyButton (enabled when birthdate set)
├─ RecentLookups (if any; most-recent-first chips)
│  └── [Recent chip button] (each with 만 나이 hint)
├─ PeopleList (favorites)
│  ├── [Person card] (name + birthdate, remove ×)
│  └── [Add button] (opens modal)
├─ AgeCalculatorHowTo (SSR, gate outside)
├─ AgeCalculatorFaq (SSR, gate outside)
└─ AgeCalculatorStructuredData (JSON-LD prescript, SSR)
```

**Key Contracts:**

```typescript
// AgeCalculator.tsx ("use client")
export function AgeCalculator() {
  const { birthdate, age, people, recents, ... } = useAgeLookup();
  return (
    // 2-split desktop (input left, result right); stacked mobile
    // Render SEO sections OUTSIDE mounted gate (server-render first)
  );
}

// BirthdateInput.tsx
interface Props {
  value: string | null;
  asOfDate: string;
  useAsOf: boolean;
  error: string | null;
  onChange: (dateKey: DateKey | null) => void;
  onAsOfDateChange: (dateKey: DateKey) => void;
  onUseAsOfChange: (use: boolean) => void;
  onClearError: () => void;
}

// AgeSummary.tsx
interface Props {
  age: AgeResult;
}

// DateFacts.tsx
interface Props {
  age: AgeResult;
  locale: string; // from useLocale()
}

// RecentLookups.tsx
interface Props {
  recents: string[]; // DateKey[]
  onSelectRecent: (dateKey: DateKey) => void;
  onClear: () => void;
}

// PeopleList.tsx
interface Props {
  people: Person[];
  onAdd: (name: string, birthdate: DateKey) => void;
  onRemove: (personId: string) => void;
  onSelect: (person: Person) => void;
}
```

**Styling & Motion:**
- Input focus: mint accent ring (DESIGN token)
- Age cards: var(--surface) + 1px var(--hairline), radius var(--radius-lg), mint left bar 3px
- Card hover: translateY(-2px) + shadow-hover (DESIGN token), 150ms ease-out, gated by prefers-reduced-motion
- Fact tiles: var(--surface-muted), radius var(--radius-md)
- Result cross-fade on birthdate change: opacity 200ms
- All motion uses transform/opacity (compositor-friendly); no animate-height

---

### Layer 4: SEO & Structured Data (Server Components, Gate Outside `<Suspense>`)
**Files:** `src/components/tools/age-calculator/AgeCalculatorIntro.tsx`, `AgeCalculatorHowTo.tsx`, `AgeCalculatorFaq.tsx`, `AgeCalculatorStructuredData.tsx`  
**Responsibility:** H1 + lead + FAQ + HowTo (HTML + JSON-LD), all renderable server-side BEFORE client island mounts.  
**Dependency:** `useTranslations()` (isomorphic), `lib/seo.ts`, DESIGN tokens.

**Contract:**

```typescript
// AgeCalculatorIntro.tsx (server or async)
export function AgeCalculatorIntro() {
  const t = useTranslations('tools.age-calculator');
  return (
    <>
      <span className="eyebrow">{t('intro.eyebrow')}</span>
      <h1>{t('intro.title')}</h1>
      <p className="body-lg">{t('intro.lead')}</p>
    </>
  );
}

// AgeCalculatorStructuredData.tsx (server)
export function AgeCalculatorStructuredData() {
  const t = useTranslations('tools.age-calculator');
  const locale = useLocale();
  // Render SoftwareApplication + FAQPage + HowTo JSON-LD
  // url === seo.absoluteToolUrl(locale, 'age-calculator')
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// AgeCalculatorHowTo.tsx, AgeCalculatorFaq.tsx (server)
// Render <section> with title, paragraphs, lists (no client state)
```

**Invariant:** SEO sections MUST render OUTSIDE the mounted/Suspense boundary in the page layout. They are SSR'd on every request and indexed by search crawlers (including AI crawlers that don't run JS).

---

### Layer 5: Framework & Routing (Platform)
**Files:** `src/app/[locale]/tools/[slug]/page.tsx` (branch for 'age-calculator' slug)  
**Responsibility:** SSG route, metadata generation, dynamic imports.

**Contract:**

```typescript
// [slug]/page.tsx (extract for age-calculator branch)
if (slug === 'age-calculator') {
  const AgeCalculatorIsland = dynamic(() =>
    import('@/components/tools/age-calculator/AgeCalculator').then((m) => ({
      default: m.AgeCalculator,
    }))
  );

  return (
    <>
      <AgeCalculatorStructuredData />
      <AgeCalculatorIntro />
      <AgeCalculatorIsland />
      <AgeCalculatorHowTo />
      <AgeCalculatorFaq />
    </>
  );
}

// generateMetadata branch:
if (slug === 'age-calculator') {
  title = t('meta.title'); // tools.age-calculator.meta.title
  description = t('meta.description'); // tools.age-calculator.meta.description
}
```

---

## 2. i18n Key Contract

All UI strings are consumed from `tools.age-calculator.*` namespace. Parallel ui-engineer and platform-engineer must maintain this contract in `src/i18n/messages/{ko,en}.json`.

**Full required key list (MANDATORY to prevent parallel UI/platform drift):**

```json
{
  "tools": {
    "age-calculator": {
      "title": "나이 계산기",
      "description": "생년월일을 입력하면 만 나이, 연 나이, 세는 나이와 생년월일 정보를 확인할 수 있습니다.",
      "meta": {
        "title": "나이 계산기 · 나이를 정확히 계산해보세요",
        "description": "생년월일을 입력하면 만 나이, 연 나이, 세는 나이를 한눈에 비교할 수 있습니다. 한국의 2023년 나이 통일법과 전통 계산법을 모두 지원하고, 띠와 별자리, 살아온 날 수도 알려드립니다."
      },
      "intro": {
        "eyebrow": "계산 도구",
        "title": "나이 계산기",
        "lead": "생년월일을 입력하면 만 나이, 연 나이, 세는 나이와 생년월일 정보(띠, 별자리, 요일)를 확인할 수 있습니다."
      },
      "input": {
        "birthdateLegend": "생년월일",
        "birthdatePlaceholder": "YYYY-MM-DD",
        "birthdateHelp": "예: 2000-03-15",
        "asOfToggle": "기준일",
        "asOfLabel": "기준일 설정",
        "asOfDate": "기준일",
        "asOfPlaceholder": "YYYY-MM-DD",
        "asOfHelp": "기본값: 오늘 (로컬 시간)",
        "errorInvalidDate": "유효한 날짜를 입력해주세요 (YYYY-MM-DD)",
        "errorFutureDate": "미래 날짜는 입력할 수 없습니다",
        "errorTooOld": "150년 이상 전 날짜는 입력할 수 없습니다"
      },
      "ageSummary": {
        "title": "나이",
        "manNai": {
          "label": "만 나이",
          "unit": "세",
          "explanation": "한국 법정 나이 (2023년 이후)"
        },
        "yeonNai": {
          "label": "연 나이",
          "unit": "세",
          "explanation": "신년 기준 연도 차이"
        },
        "seeneunNai": {
          "label": "세는 나이",
          "unit": "세",
          "explanation": "한국 전통 나이 계산법 (현재는 만나이로 통일됨)"
        },
        "note": "한국은 2023년 6월 28일부터 법적 나이 기준을 '만 나이'로 통일했습니다."
      },
      "dateFacts": {
        "title": "생년월일 정보",
        "zodiac": "띠",
        "starSign": "별자리",
        "dayOfWeek": "요일",
        "daysLived": "살아온 날",
        "breakdown": "정확한 나이",
        "countdown": "다음 생일까지"
      },
      "zodiac": {
        "rat": "쥐띠",
        "ox": "소띠",
        "tiger": "호랑이띠",
        "rabbit": "토끼띠",
        "dragon": "용띠",
        "snake": "뱀띠",
        "horse": "말띠",
        "goat": "양띠",
        "monkey": "원숭이띠",
        "rooster": "닭띠",
        "dog": "개띠",
        "pig": "돼지띠"
      },
      "starSign": {
        "aries": "♈ 양자리",
        "taurus": "♉ 황소자리",
        "gemini": "♊ 쌍둥이자리",
        "cancer": "♋ 게자리",
        "leo": "♌ 사자자리",
        "virgo": "♍ 처녀자리",
        "libra": "♎ 천칭자리",
        "scorpio": "♏ 전갈자리",
        "sagittarius": "♐ 궁수자리",
        "capricorn": "♑ 염소자리",
        "aquarius": "♒ 물병자리",
        "pisces": "♓ 물고기자리"
      },
      "recents": {
        "heading": "최근 계산",
        "clear": "전체 지우기",
        "ariaReuse": "{datekey}로 다시 계산"
      },
      "people": {
        "heading": "자주 계산하는 사람들",
        "addButton": "사람 추가",
        "addModal": {
          "title": "사람 추가",
          "nameLabel": "이름",
          "namePlaceholder": "예: 홍길동",
          "birthdateLabel": "생년월일",
          "birthdatePlaceholder": "YYYY-MM-DD",
          "save": "저장",
          "cancel": "취소"
        },
        "removeButton": "제거",
        "selectAria": "{name}의 생년월일로 계산",
        "emptyState": "생일을 저장해두고 클릭하면 바로 계산해요."
      },
      "actions": {
        "copy": "결과 복사",
        "copied": "복사되었습니다",
        "enter": "Enter 키로 계산"
      },
      "howTo": {
        "heading": "나이 계산기 사용 방법",
        "whatIsTitle": "나이 계산기란?",
        "whatIsBody": "생년월일을 입력하면 한국의 세 가지 나이 계산법(만 나이, 연 나이, 세는 나이)을 한눈에 비교할 수 있습니다. 2023년 법정 나이 통일로 '만 나이'가 표준이 되었지만, 여전히 생일이 다가오면 반사적으로 '연 나이'를 세곤 하지요. 이 도구는 그 혼동을 깔끔하게 정리해줍니다.",
        "howToTitle": "사용 방법",
        "howToBody": "생년월일 입력창에 'YYYY-MM-DD' 형식으로 생년월일을 입력하세요. (예: 2000-03-15) 기본적으로 오늘 날짜 기준으로 나이를 계산합니다. '기준일' 토글을 켜면 특정 날짜 기준의 나이를 계산할 수도 있어요. Enter 키를 누르거나 입력을 완료하면 즉시 계산 결과가 표시됩니다.",
        "featuresTitle": "이런 기능이 있어요",
        "featuresBody": "자주 계산하는 사람들의 생년월일을 저장해 나중에 한 번의 클릭으로 재검색할 수 있습니다. '최근 계산'에는 이전에 계산했던 생년월일이 자동으로 저장되어, 여러 번 입력할 필요가 없어요. 결과를 클립보드에 복사해 공유할 수도 있습니다."
      },
      "faq": {
        "heading": "자주 묻는 질문",
        "items": [
          {
            "q": "만 나이, 연 나이, 세는 나이의 차이는?",
            "a": "만 나이는 정확히 생일이 지난 횟수(국제 표준, 한국 법정 기준)이고, 연 나이는 현재 연도 - 출생 연도입니다. 세는 나이는 한국 전통 계산법으로 태어난 해를 1세로 센 후 매년 1월 1일마다 나이가 하나씩 늡니다. 한국은 2023년 6월 28일부터 만 나이를 법정 나이로 통일했습니다."
          },
          {
            "q": "2월 29일(윤달)에 태어났으면 생일은 언제인가요?",
            "a": "2월 29일생은 윤년이 아닌 해에 생일을 3월 1일 또는 2월 28일로 계산합니다. 이 도구는 기준 연도에 따라 자동으로 올바른 계산을 수행합니다."
          },
          {
            "q": "입력한 정보가 저장되나요?",
            "a": "최근 계산 목록과 저장된 사람들 정보는 이 브라우저의 로컬 스토리지에만 저장되며, 어느 서버에도 전송되지 않습니다. 브라우저 데이터를 삭제하면 정보도 함께 사라집니다."
          },
          {
            "q": "다른 기준 날짜로 계산할 수 있나요?",
            "a": "네. '기준일' 토글을 켜면 특정 날짜 기준으로 나이를 계산할 수 있습니다. 예를 들어, 3년 전 특정 날짜의 나이가 몇 살이었는지 역산할 수 있죠."
          },
          {
            "q": "모바일에서도 사용 가능한가요?",
            "a": "네. 별도의 설치 없이 모바일 브라우저에서 그대로 사용할 수 있습니다."
          },
          {
            "q": "띠와 별자리는 정확한가요?",
            "a": "이 도구는 음력을 기반으로 한 전통적 계산법을 사용합니다. 전통 한국 문화에서 일반적으로 사용하는 띠 계산법을 따르고 있습니다. (정교한 음력 계산은 향후 업데이트 예정)"
          }
        ]
      }
    }
  }
}
```

**English (en.json) equivalent keys with same structure, all values translated.**

**Invariant:** Every UI text must have a corresponding key. If platform-engineer wires a component and finds `t()` key missing, build fails. Use grep to diff all `t('...')` calls vs. i18n catalog.

---

## 3. Data Contracts & localStorage

**localStorage keys (client-only):**

```
jurepi-age-calculator-people  → JSON(PeopleStore)
jurepi-age-calculator-recents → JSON(string[])  // DateKey[] array
```

**Graceful Fail Policy:**
- Read on mount: if parse fails or localStorage unavailable (private mode), start fresh (empty state). No error throw.
- Write on change: if quota exceeded, keep in-memory (fully usable). Persist on next page visit if space recovers.

**JSON-LD Structure (SoftwareApplication + FAQPage + HowTo):**

```typescript
// SoftwareApplication
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "나이 계산기",
  "description": "...",
  "url": "https://apps.jurepi.kr/ko/tools/age-calculator",
  "applicationCategory": "Utilities",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW"
  }
}

// FAQPage
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "...",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "..."
      }
    }
  ]
}

// HowTo (optional; FAQPage sufficient)
```

---

## 4. JSON-LD & SEO Plan

**Rendering strategy:** All SEO/JSON-LD rendered in server components, OUTSIDE the mounted/Suspense boundary.

```typescript
// In page.tsx:
<>
  {/* SSR JSON-LD + intro, gate outside client island */}
  <AgeCalculatorStructuredData />
  <AgeCalculatorIntro />
  
  {/* Client island, dynamic import, lazy */}
  <AgeCalculatorIsland />
  
  {/* SSR long-form, gate outside */}
  <AgeCalculatorHowTo />
  <AgeCalculatorFaq />
</>
```

**Invariants:**
- url in JSON-LD === canonical === `seo.absoluteToolUrl(locale, 'age-calculator')`
- Both `/ko/tools/age-calculator` and `/en/tools/age-calculator` must have unique meta.title, meta.description, and localized JSON-LD
- Sitemap auto-includes both via `generateStaticParams()`

---

## 5. Registry Entry

**Add to `src/tools/registry.ts`:**

```typescript
{
  id: 'age-calculator',
  slug: 'age-calculator',
  category: 'calculator',        // Already exists with mint accent
  icon: 'Cake',                  // lucide-react icon
  accent: 'mint',                // calculator category identity
  status: 'live',
  isNew: true,
  order: 3,                      // Example; inspect existing orders to place sensibly
  keywords: [
    '나이', '나이 계산', '만 나이', '연 나이', '세는 나이', '생년월일', 
    '생일', '띠', '별자리', '요일', '생년월일 정보',
    'age', 'age calculator', 'birthday', 'zodiac', 'star sign', 'how old'
  ],
}
```

**No platform changes needed:** Category `calculator` already exists in `tools/types.ts`; category label "계산기" / "Calculator" already in i18n.

---

## 6. Task Decomposition & Work Assignment

**Build sequence: domain first (RED→GREEN tests), then UI, then integration.**

### Phase 1: Domain Layer (domain-engineer)
**Files:** `src/lib/age-calculator/{schema,date,age,zodiac,people,recents}.ts` + all `.test.ts`  
**Duration:** 3 days  
**Acceptance:** Vitest ≥80% (domain 100%), 0 TypeScript errors, all signatures match contracts above.

1. **date.ts** — local-time date conversion, addDays, isLeapYear, daysInMonth (mirror qna-a-day exactly)
2. **schema.ts** — zod schemas (BirthdateInput, Person, PeopleStore) + safeparse helpers
3. **age.ts** — manNai, yeonNai, seeneunNai, dayOfWeek, daysLived, breakdown, nextBirthdayCountdown, calculateAge; AgeResult type
4. **zodiac.ts** — koreanZodiac (key), starSign (key) lookup tables only (no Intl calls)
5. **people.ts** — immutable ops (addPerson, removePerson, updatePerson, pruneUnknown)
6. **recents.ts** — immutable recents (pushRecent, pruneUnknown, serialize/deserialize) mirror url-encoder exactly

### Phase 2: i18n Messages (platform-engineer)
**Files:** `src/i18n/messages/{ko,en}.json` section `tools.age-calculator.*`  
**Duration:** 1 day  
**Acceptance:** Full key contract above present; keys match UI component `t()` calls (verified post-UI grep).

- Add all keys from contract section 2 above
- Verify English (en.json) matches Korean structure exactly

### Phase 3: Hook & UI Components (ui-engineer × 2, parallel)
**Files:** `src/components/tools/age-calculator/{useAgeLookup.ts, AgeCalculator.tsx, BirthdateInput.tsx, AgeSummary.tsx, DateFacts.tsx, RecentLookups.tsx, PeopleList.tsx}` + .test.tsx  
**Duration:** 4 days  
**Acceptance:** E2E scenarios 1–5 (SPEC), visual regression (320/768/1024, both themes), axe a11y pass, ≥80% component coverage.

- **useAgeLookup.ts** (1 engineer): localStorage binding, birthdate parsing, age calc dispatch, copy adapter
- **AgeCalculator.tsx** (1 engineer): Layout orchestrator, state management, responsive 2-split/stacked
- **BirthdateInput.tsx** (parallel): Date input + as-of toggle, validation feedback
- **AgeSummary.tsx** (parallel): Three age cards with mint accents, Korean unification note
- **DateFacts.tsx** (parallel): 2×2 fact tiles, Intl.DateTimeFormat for day-of-week
- **RecentLookups.tsx** (parallel): Recent chips, clear button, one-click re-check
- **PeopleList.tsx** (parallel): Favorites browser, add/remove modal

### Phase 4: SEO & Structured Data (platform-engineer + seo-geo-engineer)
**Files:** `src/components/tools/age-calculator/{AgeCalculatorIntro.tsx, AgeCalculatorHowTo.tsx, AgeCalculatorFaq.tsx, AgeCalculatorStructuredData.tsx}`  
**Duration:** 1 day  
**Acceptance:** JSON-LD valid, prescript renders in HTML (not in mounted gate), URL matches canonical.

- **AgeCalculatorIntro.tsx** (platform-engineer): H1 + lead (server-render)
- **AgeCalculatorHowTo.tsx** (platform-engineer): Long-form "How to" section
- **AgeCalculatorFaq.tsx** (platform-engineer): FAQ section (SSR)
- **AgeCalculatorStructuredData.tsx** (seo-geo-engineer): JSON-LD (SoftwareApplication, FAQPage)

### Phase 5: Route & Registry (platform-engineer)
**Files:** `src/app/[locale]/tools/[slug]/page.tsx` (add branch for 'age-calculator'), `src/tools/registry.ts` (add entry), generateMetadata branch  
**Duration:** 1 day  
**Acceptance:** SSG generates both `/ko/tools/age-calculator` and `/en/tools/age-calculator`, unique titles/descs, 200 response.

### Phase 6: E2E & Visual Regression (qa-integration)
**Files:** `tests/e2e/age-calculator.spec.ts` + screenshots  
**Duration:** 2 days  
**Acceptance:** SPEC scenarios 1–5 all pass (RED before GREEN); visual regression 320/768/1024 both themes; axe accessibility 0 violations.

---

## 7. Dependency Graph

```
domain-engineer              (lib/age-calculator/*.ts)
    ↓
ui-engineer ×2              (components/tools/age-calculator/*.tsx)
    ↓
platform-engineer           (route branch, registry, i18n)
    ↓
seo-geo-engineer            (JSON-LD, llms.txt entry)
    ↓
qa-integration              (E2E, visual)
```

**Blocking order:**
1. domain-engineer completes TDD → domain tests GREEN ✓
2. ui-engineer starts (consumes domain via lock-in signature) → component tests GREEN ✓
3. platform-engineer adds registry + route branch (consumes all above)
4. qa-integration runs full E2E (all systems integrated)

---

## 8. Risk Mitigation (Harness-Specific Traps)

### Risk 1: Intl Locale Confusion
**Trap:** Passing i18n message key to `Intl.DateTimeFormat` → RangeError  
**Mitigation:** CRITICAL: Always extract locale via `useLocale()` (BCP-47: "ko"/"en"). Use in `Intl.DateTimeFormat(locale, ...)` directly. Never pass i18n keys to Intl.

### Risk 2: Local vs. UTC Dates
**Trap:** Using `new Date()` with ISO string or UTC → wrong day-of-week, wrong age on timezone boundary  
**Mitigation:** CRITICAL: All date construction via `new Date(year, month-1, day)` (local midnight). Mirror `qna-a-day/date.ts` exactly. No UTC.

### Risk 3: Phantom Tailwind Tokens
**Trap:** Using `max-w-{sm,md,lg}` or non-existent color on floating layers → renders transparent  
**Mitigation:** Age cards use DESIGN tokens only (`var(--accent-mint)`, `var(--surface)`). Grep `className` values against DESIGN.md token list. Input focus ring = `var(--focus-ring)`.

### Risk 4: SEO Sections in Mounted Gate
**Trap:** JSON-LD / HowTo / FAQ rendered inside `mounted` gate or Suspense → AI crawlers don't execute JS, index zeros  
**Mitigation:** CRITICAL: AgeCalculatorStructuredData, Intro, HowTo, Faq all render OUTSIDE the mounted/Suspense boundary in page.tsx layout. Prescript top-of-page, client island below.

### Risk 5: i18n Key Drift
**Trap:** ui-engineer and platform-engineer don't coordinate; one side adds UI that consumes missing i18n key → runtime MISSING_MESSAGE warning  
**Mitigation:** Full i18n key contract locked in section 2 above. Platform-engineer adds ALL keys upfront. UI components render with real message catalog (not mocked). grep all `t()` calls post-merge.

### Risk 6: Recents & People Auto-Save Edge Case
**Trap:** Invalid birthdate still recorded to recents → recents polluted  
**Mitigation:** CRITICAL: `useAgeLookup()` only calls `pushRecent()` AFTER successful age calculation (AgeResult returned). Invalid input ≠ push.

### Risk 7: localStorage Quota & Silent Fail
**Trap:** localStorage quota exceeded silently (private mode, quota maxed) → app seems to work but people/recents never persist → user data loss  
**Mitigation:** Catch quota error in hook, keep in-memory state (fully usable). No error toast (graceful). E2E test with `jsdom` localStorage isolated; test both success and quota-exceed paths.

### Risk 8: Component Tests with Mocked Messages
**Trap:** Vitest mocks i18n messages with stubs; component tests pass, but real app crashes with MISSING_MESSAGE  
**Mitigation:** Component tests must render with REAL message catalog. Use `NextIntlClientProvider` with actual messages in test setup (mirror new-word pattern).

### Risk 9: Zodiac/StarSign Localization Mismatch
**Trap:** Zodiac key is "rat" (domain), but i18n key is "zodiac.Rat" (typo capitalization) → no match → MISSING_MESSAGE  
**Mitigation:** Domain `zodiac.ts` returns lowercase stable keys ("rat", "aries"). i18n keys are `tools.age-calculator.zodiac.rat` and `tools.age-calculator.starSign.aries` (lowercase). Case-match audit.

### Risk 10: Leap-Day Age Calculation
**Trap:** Feb 29 birth → non-leap-year "as-of" date → next birthday countdown off by 1  
**Mitigation:** Test scenario 2 (SPEC): birthdate 1996-02-29, as-of 2025-03-01. Expected age 29 years, countdown 0 (birthday just passed) or 1 (if same-day). Ensure `nextBirthdayCountdown` handles leap-day edge.

---

## 9. Build Order & Timeline

| Phase | Duration | Blocker | Status |
|-------|----------|---------|--------|
| 1. Domain (TDD) | 3d | None | Start immediately |
| 2. i18n Messages | 1d | Domain contract locked | Start after domain contracts finalized |
| 3. UI Components | 4d | Domain tests GREEN, i18n keys present | Start after domain |
| 4. SEO & JSON-LD | 1d | Domain contract locked | Parallel to phase 3 |
| 5. Route & Registry | 1d | All components complete | Start after phase 3 |
| 6. E2E & Visual | 2d | Route live, all components integrated | Start after phase 5 |
| **Total** | **~9d** | — | Estimate for 5-person parallel team |

---

## 10. Definition of Done

### Domain Layer
- [ ] `src/lib/age-calculator/*.ts` all exports match signatures in section 1
- [ ] `vitest run --coverage` reports ≥80% overall, 100% for age/zodiac/date modules
- [ ] `pnpm tsc --noEmit` returns 0 errors
- [ ] All invariants from section 1 enforced (age ≥0, breakdown.years ≤ manNai, etc.)
- [ ] `git push` to feature branch, pending code review

### UI & Hooks
- [ ] All components render with `useAgeLookup()` hook
- [ ] Real message catalog (not mocked) in test setup
- [ ] E2E scenarios 1–5 (SPEC) pass (RED→GREEN)
- [ ] Visual regression: 320/768/1024 breakpoints, both themes
- [ ] axe accessibility: 0 violations (run in E2E browser context)
- [ ] ≥80% component coverage
- [ ] Copy button + toast working (manual test on real clipboard)
- [ ] localStorage persistence tested (jsdom isolated)
- [ ] Recent deduplication verified (same birthdate pushed twice → single entry at front)

### SEO & Metadata
- [ ] `generateMetadata()` branch wired for 'age-calculator' slug
- [ ] Both `/ko/tools/age-calculator` and `/en/tools/age-calculator` build successfully
- [ ] Unique title/description per locale in meta
- [ ] JSON-LD validates at [schema.org validator](https://validator.schema.org)
- [ ] Sitemap contains both routes
- [ ] URL in JSON-LD === canonical === `seo.absoluteToolUrl(locale, 'age-calculator')`

### Registry & i18n
- [ ] `src/tools/registry.ts` entry added (id/slug/category/icon/accent/status/order/keywords)
- [ ] All i18n keys from section 2 present in ko.json and en.json
- [ ] grep all `t()` calls in UI vs. i18n keys — 0 mismatches
- [ ] Category `calculator` confirmed in FOOTER_CATEGORIES and CATEGORY_ORDER (if those exist separately) — if not required, note in PR

### Integration
- [ ] `pnpm build` completes (SSG + static export)
- [ ] No type errors post-merge with main
- [ ] Sitemap/robots/manifest correctly reference age-calculator routes
- [ ] All linked docs updated (CLAUDE.md changelog, if needed)

---

## 11. Reference Implementations

**Reuse patterns exactly from:**

1. **qna-a-day/date.ts** → `age-calculator/date.ts`  
   Pattern: toDateKey, parseDateKey, local-time constructor, isLeapYear, daysInMonth

2. **url-encoder/recents.ts** → `age-calculator/recents.ts`  
   Pattern: pushRecent (dedupe + prepend + truncate), pruneUnknown, serialize/deserialize

3. **url-encoder component structure** → age-calculator UI  
   Pattern: useAgeLookup hook, SSR intro/howto/faq outside mounted gate, JSON-LD prescript

4. **[slug]/page.tsx route branching** → add age-calculator branch  
   Pattern: slug matching, dynamic import, generateMetadata namespace branch

---

## 12. Assumption Summary

No major architectural assumptions; SPEC is comprehensive. Minor clarifications:

1. **Category `calculator` already exists** with mint accent and "계산기" label — confirmed in `tools/types.ts` (no new platform category needed).
2. **localStorage two-key strategy** (people + recents) is simpler than one composite store; follows url-encoder pattern.
3. **No per-person deep-link URLs in MVP** (Phase 2 candidate per SPEC).
4. **Zodiac heuristic over full lunar calendar** in MVP (Phase 2 candidate; current impl uses solar month heuristics).
5. **Native `<input type="date">` or text input YYYY-MM-DD** both acceptable (DESIGN doesn't mandate one).

---

## Conclusion

This blueprint is **ready for parallel team handoff**. Each engineer owns clear file boundaries and contracts. Domain-engineer starts immediately (domain tests first); ui-engineers start post-domain; platform-engineer wires route + registry late in pipeline. qa-integration closes the loop with full E2E coverage per SPEC scenarios 1–5.

**Output:** Jurepi platform gains a mint-accented **Age Calculator** tool, live at `/[locale]/tools/age-calculator`, SSG-optimized, SEO-indexed by search + AI crawlers, fully accessible, graceful localStorage fallback, zero backend.

