# Bookmarks Tool — Clean Architecture Blueprint

**Author Role:** Architect  
**Date:** 2026-07-02  
**Status:** READY FOR IMPLEMENTATION  
**Pattern Reference:** `rankings` tool (structural mirror with shape divergence noted)

---

## 1. Layer Decomposition

### Dependency Flow
```
┌─────────────────────────────────────────────┐
│  FRAMEWORK                                  │
│  (Next.js App Router, tool route branch)    │
│  src/app/[locale]/tools/[slug]/page.tsx     │
└─────────┬───────────────────────────────────┘
          │ (orchestrates)
┌─────────▼───────────────────────────────────┐
│  ADAPTERS / UI LAYER                        │
│  src/components/tools/bookmarks/            │
│  (React components, next-intl, localStorage)│
└─────────┬───────────────────────────────────┘
          │ (consumes)
┌─────────▼───────────────────────────────────┐
│  USE-CASE / HOOK LAYER                      │
│  src/components/tools/bookmarks/            │
│  useBookmarksCatalog.ts (state machine)     │
└─────────┬───────────────────────────────────┘
          │ (calls)
┌─────────▼───────────────────────────────────┐
│  DOMAIN LAYER (PURE, NO REACT/NEXT)         │
│  src/lib/bookmarks/                         │
│  (schema, merge, slug, catalog, search,     │
│   favorites — all immutable, fully tested)  │
└─────────────────────────────────────────────┘
```

### File Structure (Exact Path Mapping)

#### Domain Layer — Pure TypeScript (no React, no Next.js)
```
src/lib/bookmarks/
├── schema.ts              # zod schemas: TopicFileFront, MergedTopic, BookmarksStore constants
├── schema.test.ts         # Parse validation: required fields, section counts, link counts
├── slug.ts                # slugify(title), resolveSlug(front, filename)
├── slug.test.ts           # Slug derivation, uniqueness, ASCII safety
├── merge.ts               # mergePair(koFront, enFront): canonical ko slug, en inherit
├── merge.test.ts          # Pair integrity, locale mismatches, slug collision
├── catalog.ts             # Typed read-only catalog accessor: allTopics(), byId(slug), topics()
├── catalog.test.ts        # Uniqueness, completeness (both locales), no orphans
├── search.ts              # filterTopics(topics, query, locale): normalize NFC/case/diacritics
├── search.test.ts         # Match logic: title, description, section headings, link labels (both locales)
├── favorites.ts           # Immutable ops: toggleFavorite(list, slug), pushRecent(list, slug, max)
└── favorites.test.ts      # MRU order, de-dupe, max truncation, pruneUnknown
```

#### Hook Layer — State Machine (UI orchestration, no component render)
```
src/components/tools/bookmarks/
├── useBookmarksCatalog.ts    # SINGLE hook: mounts catalog, manages favorites/recents localStorage,
                              # exposes filtered list, select(id), toggleFavorite, search query
├── (no .test.ts directly — tested via component integration + E2E)
```

#### UI Components Layer (React, Client Components)
```
src/components/tools/bookmarks/
├── Bookmarks.tsx             # "use client"; owns component state (query, selectedId); mounts useBookmarksCatalog()
├── BookmarksSearch.tsx        # Search input: "/" focus, clear, aria-controls, result count
├── TopicTabs.tsx             # Pill tabs: All / Topics / Favorites (when pinned) / Recent (when viewed)
├── TopicsList.tsx            # Card grid (1-col <768px, 2-col ≥768px); roving tabindex
├── TopicCard.tsx             # One card: title, description, section/link count tag, star (favorite toggle)
├── TopicDetail.tsx           # Full-width detail panel (below list); title, description, TopicSections
├── TopicSections.tsx         # Section heading + link row list
├── LinkRow.tsx               # One link: title, optional description, external-link icon
├── BookmarksIntro.tsx        # H1 + lead (SEO, server-render where possible)
├── BookmarksHowTo.tsx        # "What are curated bookmarks?" / long-form SEO section
├── BookmarksFaq.tsx          # FAQPage + ItemList JSON-LD (server-render prerender)
├── RankingsStructuredData.tsx # SoftwareApplication + ItemList JSON-LD (topics as items, links as sub-items)
├── index.ts                  # Barrel: export { Bookmarks }
└── data/
    └── bookmarks.generated.json  # GENERATED ARTIFACT: [MergedTopic...] (code-split dynamic import)
```

#### Generator Layer (Build-time, Node.js script)
```
scripts/
└── generate-bookmarks.mjs     # Scan content/bookmarks/, parse, validate pairs, emit .generated.json
```

#### Content Layer (Markdown source)
```
content/bookmarks/
├── _TEMPLATE.md
├── _TEMPLATE_en.md
├── README.md                 # Authoring guide: markdown format, required fields, section structure
└── topics/
    └── *.md + *_en.md        # Topic pairs: 하네스-엔지니어링.md/.md_en, 프런트엔드-리소스.md/.md_en, etc.
```

#### Platform Integration (Existing files, ONE entry + branches added)
```
src/tools/
├── registry.ts               # ADD ONE ToolMeta entry (bookmarks, id bookmarks, category dev, accent sky, status)
├── types.ts                  # (unchanged; ToolMeta interface already handles all fields)

src/app/[locale]/tools/
└── [slug]/page.tsx           # ADD slug→component branch (Bookmarks) + generateMetadata branch

src/i18n/messages/
├── ko.json                   # ADD nested tools.bookmarks.* keys
└── en.json                   # ADD nested tools.bookmarks.* keys (English translations)
```

---

## 2. Public API Contract — Domain Layer

### `schema.ts`

```typescript
/**
 * Constants
 */
export const STORE_VERSION = 1;
export const RECENTS_MAX = 20;
export const SEARCH_DEBOUNCE = 120;
export const LINK_DESC_MAX = 100;
export const SECTION_MAX = 10;
export const LINKS_MIN_PER_TOPIC = 3;

/**
 * Individual markdown file frontmatter (parser unit).
 * Each bookmarks file (ko + en pair) carries these YAML fields.
 * NO field enum. NO asOfDate/sourceNote/sourceUrl.
 * Sections are per-locale (can differ between ko/en).
 */
export const TopicFileFrontSchema = z.object({
  // REQUIRED: title (per locale, non-empty)
  title: z.string().min(1, 'title required'),

  // OPTIONAL: derivable slug (canonical from KO, EN inherits)
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),

  // REQUIRED: description (curator intent, per locale, non-empty, ≤200 chars)
  description: z.string().min(1).max(200, 'description max 200 chars'),

  // REQUIRED: sections array (≥1 section, ≥3 links total per topic)
  sections: z.array(
    z.object({
      heading: z.string().min(1, 'section heading required'),
      links: z.array(
        z.object({
          label: z.string().min(1, 'link label required'),
          url: z.string().url('invalid URL format'),
          description: z.string().max(100, 'link description max 100 chars').optional(),
        })
      ).min(1, 'section must have ≥1 link'),
    })
  ).min(1, 'topic must have ≥1 section'),
});

export type TopicFileFront = z.infer<typeof TopicFileFrontSchema>;

/**
 * Merged ko+en record (catalog item, emitted to bookmarks.generated.json).
 * Result of mergePair(koFront, enFront) via canonical rule.
 * Sections/links are per-locale (can differ).
 */
export const MergedTopicSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  ko: z.object({
    title: z.string(),
    description: z.string(),
    sections: z.array(
      z.object({
        heading: z.string(),
        links: z.array(
          z.object({
            label: z.string(),
            url: z.string().url(),
            description: z.string().optional(),
          })
        ),
      })
    ),
  }),
  en: z.object({
    title: z.string(),
    description: z.string(),
    sections: z.array(
      z.object({
        heading: z.string(),
        links: z.array(
          z.object({
            label: z.string(),
            url: z.string().url(),
            description: z.string().optional(),
          })
        ),
      })
    ),
  }),
});

export type MergedTopic = z.infer<typeof MergedTopicSchema>;

/**
 * localStorage persistence blob.
 * Stores user preferences: favorites (pinned topics), recents (MRU views).
 */
export const BookmarksStoreSchema = z.object({
  version: z.number().int().min(1),
  favorites: z.array(z.string()),   // topic slugs
  recents: z.array(z.string()),     // topic slugs, MRU-first
  meta: z.object({
    lastQuery: z.string().optional(),
    createdAt: z.number().int(),
  }),
});

export type BookmarksStore = z.infer<typeof BookmarksStoreSchema>;

/**
 * Safe JSON parser: never throws, returns null on zod failure.
 * Used for corrupt localStorage recovery.
 */
export function safeJsonParse<T>(json: string, schema: z.ZodType<T>): T | null;
```

### `slug.ts`

```typescript
/**
 * Slugify: lowercase, normalize NFC, remove diacritics, replace spaces with hyphens.
 * Input: "프런트엔드 리소스" → Output: "frontend-resources" (after normalization).
 * Input: "하네스 엔지니어링" → Output: "harness-engineering" (English romanization via diacritics removal).
 * INVARIANT: output is ASCII alphanumeric + hyphen only, no spaces.
 */
export function slugify(title: string): string;

/**
 * Resolve slug: prefer explicit frontmatter slug, else derive from filename.
 * Filename: "frontend-resources.md" → slug: "frontend-resources".
 * Filename: "frontend-resources_en.md" → slug: "frontend-resources" (strip _en suffix).
 * INVARIANT: always lowercase, ASCII, no spaces.
 */
export function resolveSlug(front: TopicFileFront, filename: string): string;
```

### `merge.ts`

```typescript
/**
 * Apply canonical rule: KO slug is canonical, EN inherits if absent.
 * Sections/links stay per-locale (can differ between ko/en).
 * Returns MergedTopic ready for catalog.
 * INVARIANT: both ko + en present, slug matches, all required fields filled.
 */
export function mergePair(
  koFront: TopicFileFront,
  enFront: TopicFileFront,
  koFilename?: string // for error reporting
): MergedTopic;

/**
 * Validate pair integrity: zod parse both, collect all errors (non-blocking).
 * Check: required fields, section/link counts, URL validity (http(s) only).
 * Returns: errors[] (empty = valid, non-empty = validation failed).
 */
export function validatePair(
  koFilename: string,
  koFront: TopicFileFront,
  enFront: TopicFileFront
): string[]; // error messages
```

### `catalog.ts`

```typescript
/**
 * Typed catalog accessor. Load once at runtime, read-only thereafter.
 * Catalog is bookmarks.generated.json (emitted by generator).
 */

/**
 * All topics, in generation order.
 */
export function allTopics(): MergedTopic[];

/**
 * Topic by slug, or undefined if not found.
 */
export function byId(slug: string): MergedTopic | undefined;

/**
 * All topic slugs present in current catalog.
 */
export function topics(): string[];

/**
 * Unique topics derived from catalog (for tab generation).
 * INVARIANT: no duplicates, stable order.
 */
export function uniqueTopics(): MergedTopic[];
```

### `search.ts`

```typescript
/**
 * Filter topics by query string, locale-aware.
 * Blank query → return as-is (fast path).
 * Else: normalize query (NFC, lowercase, strip diacritics), match if ANY of:
 *   - ko.title, en.title
 *   - ko.description, en.description
 *   - ko.sections[].heading, en.sections[].heading
 *   - ko.sections[].links[].label, en.sections[].links[].label
 * PRIMARY match = topic title/desc; SECONDARY = link labels.
 * Stable sort order (generation order).
 * INVARIANT: case/diacritic-insensitive, both locales searched.
 */
export function filterTopics(
  topics: MergedTopic[],
  query: string,
  locale: 'ko' | 'en'
): MergedTopic[];

/**
 * Normalize for search: trim, NFC, lowercase, remove diacritics.
 * Input: "  프런트엔드  " → "프론트엔드".
 */
export function normalizeQuery(query: string): string;
```

### `favorites.ts`

```typescript
/**
 * Immutable ops on favorites/recents arrays.
 * All return NEW arrays (never mutate input).
 */

/**
 * Toggle favorite: add if absent, remove if present.
 * Preserves order (insertion order for favorites, MRU for recents).
 */
export function toggleFavorite(list: string[], slug: string): string[];

/**
 * Push recent: move to front if present, or insert; de-dupe; truncate to max.
 * Most recent = index 0.
 * INVARIANT: no duplicates, length ≤ max.
 */
export function pushRecent(list: string[], slug: string, max: number = RECENTS_MAX): string[];

/**
 * Prune unknown: filter out ids not in current catalog.
 * Run on load: if topics were removed, favorites/recents auto-clean.
 */
export function pruneUnknown(ids: string[], catalogTopics: MergedTopic[]): string[];
```

---

## 3. i18n Key Contract — UI Chrome

### Tools.bookmarks.* Namespace

**Top-level (required by registry/footer/search):**
```json
{
  "tools.bookmarks.title": "즐겨찾기",
  "tools.bookmarks.description": "하네스·프런트엔드·디자인·개발 등 각 분야의 신뢰할 수 있는 큐레이션 링크 모음을 찾아보세요.",
  "tools.bookmarks.meta.title": "즐겨찾기 | Jurepi — 무료 온라인 도구",
  "tools.bookmarks.meta.description": "신뢰할 수 있는 큐레이션 링크 디렉토리 — 각 분야의 리소스를 주제별로 정렬해 검색하고 즐겨찾기로 저장하세요."
}
```

**Tab labels:**
```json
{
  "tools.bookmarks.tabs.all": "전체",
  "tools.bookmarks.tabs.topics": "주제",
  "tools.bookmarks.tabs.favorites": "즐겨찾기",
  "tools.bookmarks.tabs.recent": "최근"
}
```

**Search:**
```json
{
  "tools.bookmarks.search.placeholder": "주제·리소스로 검색…",
  "tools.bookmarks.search.label": "검색",
  "tools.bookmarks.search.resultCount": "결과 {count}개"
}
```

**Empty states:**
```json
{
  "tools.bookmarks.empty.noResults": "'{query}'에 해당하는 주제가 없어요",
  "tools.bookmarks.empty.clearSearch": "검색 초기화",
  "tools.bookmarks.empty.noFavorites": "별을 눌러 즐겨찾기를 저장하세요",
  "tools.bookmarks.empty.noRecent": "아직 본 주제가 없어요"
}
```

**Link affordances:**
```json
{
  "tools.bookmarks.link.externalLink": "외부 링크",
  "tools.bookmarks.link.openInNewTab": "새 탭에서 열기"
}
```

**Toast notifications:**
```json
{
  "tools.bookmarks.toast.favoriteAdded": "즐겨찾기에 저장됨",
  "tools.bookmarks.toast.favoriteRemoved": "즐겨찾기에서 제거됨"
}
```

**Detail view:**
```json
{
  "tools.bookmarks.detail.sections": "섹션",
  "tools.bookmarks.detail.links": "링크",
  "tools.bookmarks.detail.close": "닫기"
}
```

**How-to / FAQ (long-form SEO):**
```json
{
  "tools.bookmarks.howto.title": "즐겨찾기란?",
  "tools.bookmarks.howto.intro": "신뢰할 수 있는 큐레이션 링크 모음입니다.",
  "tools.bookmarks.howto.description": "각 분야의 에디터가 신중하게 엄선한 리소스를 주제별로 정렬…",
  
  "tools.bookmarks.faq.title": "자주 묻는 질문",
  "tools.bookmarks.faq.q1": "즐겨찾기 주제를 추가할 수 있나요?",
  "tools.bookmarks.faq.a1": "아니요. 주제는 에디터가 직접 작성하고 관리합니다…"
}
```

**Keyboard hints:**
```json
{
  "tools.bookmarks.keyboard.search": "/ 키로 검색 포커스",
  "tools.bookmarks.keyboard.navigate": "화살표 키로 이동",
  "tools.bookmarks.keyboard.select": "Enter로 선택",
  "tools.bookmarks.keyboard.favorite": "F 키로 즐겨찾기 토글"
}
```

All keys must be prefixed `tools.bookmarks.*` and organized as shown. English translations follow 1:1 structure in `en.json`.

---

## 4. Component Tree + Props

### Root Orchestrator: `Bookmarks.tsx`

```typescript
// "use client"

interface BookmarksProps {}

export function Bookmarks(props: BookmarksProps) {
  // Component-level state
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Hook: dynamic catalog import + localStorage favorites/recents
  const r = useBookmarksCatalog(CATALOG); // See useBookmarksCatalog contract below
  
  // Mount gate (SSR safety)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  // Main render
  return (
    <div className="space-y-16">
      {/* SEO/GEO: rendered unconditionally (outside mounted gate) */}
      <BookmarksIntro />
      
      {mounted && (
        <div className="space-y-6">
          {/* Selector: search + tabs + card grid */}
          <div className="min-w-0 space-y-4">
            <BookmarksSearch {...} />
            <TopicTabs {...} />
            <TopicsList {...} />
          </div>
          
          {/* Detail: full-width panel below selector, only if selected */}
          {selectedId && (
            <TopicDetail topicSlug={selectedId} onClose={() => setSelectedId(null)} />
          )}
        </div>
      )}
      
      {/* SEO long-form: how-to, FAQ, structured data (outside mounted gate) */}
      <BookmarksHowTo />
      <BookmarksFaq />
    </div>
  );
}
```

### Hook: `useBookmarksCatalog.ts`

```typescript
/**
 * Single hook: manages catalog load, localStorage persistence, state machine.
 * Returns: filtered list, tab state, selected topic, search query, favorites, recents.
 * DESIGN: mount once, expose immutable ops.
 */

interface UseBookmarksCatalogReturn {
  // Catalog (static)
  catalog: MergedTopic[];
  
  // Search state
  query: string;
  setQuery: (q: string) => void;
  
  // Tab state
  activeTab: 'all' | 'topics' | 'favorites' | 'recent';
  setActiveTab: (tab: 'all' | 'topics' | 'favorites' | 'recent') => void;
  
  // Selection state
  selectedId: string | null;
  select: (slug: string | null) => void;
  
  // Derived state
  filtered: MergedTopic[];          // topics matching query + tab
  resultCount: number;
  
  // Persistence
  favorites: string[];               // topic slugs
  recents: string[];                 // topic slugs, MRU-first
  toggleFavorite: (slug: string) => void;
  
  // Search debounce
  debouncedQuery: string;            // debounced (120ms) for filtering
}

export function useBookmarksCatalog(
  staticCatalog: MergedTopic[]
): UseBookmarksCatalogReturn;

// INTERNAL NOTES:
// - Dynamic import catalog only on bookmarks route (code-split).
// - localStorage key: 'jurepi-bookmarks'.
// - On select: call pushRecent(recents, slug) to update MRU.
// - On favorite: immutable toggle.
// - Debounce search input 120ms before filtering (fast typing).
// - If localStorage corrupt: start fresh (no throw).
// - Load → pruneUnknown(favorites, catalog), pruneUnknown(recents, catalog).
```

### Search: `BookmarksSearch.tsx`

```typescript
interface BookmarksSearchProps {
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
  onClearQuery?: () => void;
}

export function BookmarksSearch({
  query,
  setQuery,
  resultCount,
  onClearQuery,
}: BookmarksSearchProps) {
  // "/" focus
  // Trailing clear (×) button when non-empty
  // aria-controls={list id}
  // Result count caption: "결과 N개"
}
```

### Tabs: `TopicTabs.tsx`

```typescript
interface TopicTabsProps {
  activeTab: 'all' | 'topics' | 'favorites' | 'recent';
  setActiveTab: (tab: 'all' | 'topics' | 'favorites' | 'recent') => void;
  topicsCount: number;      // unique topics in catalog
  favCount: number;         // pinned topics
  recentCount: number;      // viewed topics
}

export function TopicTabs({
  activeTab,
  setActiveTab,
  topicsCount,
  favCount,
  recentCount,
}: TopicTabsProps) {
  // Pill row: All → Topics (all topics) → Favorites (if favCount > 0) → Recent (if recentCount > 0)
  // aria-selected, role="tablist"
  // ArrowLeft/Right navigate
}
```

### List: `TopicsList.tsx`

```typescript
interface TopicsListProps {
  topics: MergedTopic[];
  selectedSlug: string | null;
  favorites: string[];
  query: string;
  onSelect: (slug: string) => void;
  onToggleFavorite: (slug: string) => void;
  locale: 'ko' | 'en';
}

export function TopicsList({
  topics,
  selectedSlug,
  favorites,
  query,
  onSelect,
  onToggleFavorite,
  locale,
}: TopicsListProps) {
  // Responsive grid: 1-col <768px, 2-col ≥768px
  // Roving tabindex
  // Each card is TopicCard
  // Empty state if topics.length === 0
}
```

### Card: `TopicCard.tsx`

```typescript
interface TopicCardProps {
  topic: MergedTopic;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: (slug: string) => void;
  onToggleFavorite: (slug: string) => void;
  locale: 'ko' | 'en';
}

export function TopicCard({
  topic,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  locale,
}: TopicCardProps) {
  // Title, description, compact tag line (sections + links count)
  // Star button (favorite toggle)
  // Click to select
  // var(--surface) + var(--hairline) border + var(--shadow-card)
  // Hover: translateY(-2px), var(--shadow-card-hover)
  // Selected: 2px var(--accent-sky) ring
}
```

### Detail: `TopicDetail.tsx`

```typescript
interface TopicDetailProps {
  topic: MergedTopic;
  onClose: () => void;
  locale: 'ko' | 'en';
}

export function TopicDetail({
  topic,
  onClose,
  locale,
}: TopicDetailProps) {
  // Full-width panel below selector
  // Title (large), description, TopicSections
  // X button (mobile only) + Esc to close
  // var(--surface) + var(--radius-xxl)
}
```

### Sections: `TopicSections.tsx`

```typescript
interface TopicSectionsProps {
  sections: MergedTopic['ko']['sections'];  // or ['en'] depending on locale
  locale: 'ko' | 'en';
}

export function TopicSections({
  sections,
  locale,
}: TopicSectionsProps) {
  // Render each section: heading (eyebrow 12px/700) + link rows
  // No table; clean list rendering
}
```

### Link Row: `LinkRow.tsx`

```typescript
interface LinkRowProps {
  label: string;
  url: string;
  description?: string;
  locale: 'ko' | 'en';
}

export function LinkRow({
  label,
  url,
  description,
  locale,
}: LinkRowProps) {
  // Title (16px/600), description (14px secondary), external-link icon (16–18px)
  // rel="noopener" target="_blank"
  // Hover: bg var(--surface-muted)
  // Focus: var(--focus-ring)
}
```

### SEO Sections (Server Render Where Possible)

```typescript
export function BookmarksIntro() {
  // H1: "즐겨찾기" / "Curated Bookmarks"
  // Lead: curator's intro sentence
  // Rendered unconditionally (outside mounted gate) for SEO/GEO
}

export function BookmarksHowTo() {
  // "What are curated bookmarks?"
  // Long-form SEO section (HowToSection JSON-LD)
  // Rendered unconditionally
}

export function BookmarksFaq() {
  // Q&A pairs
  // FAQPage + ItemList JSON-LD (topics as items, links as sub-items)
  // Rendered unconditionally
}

export function BookmarksStructuredData() {
  // SoftwareApplication + ItemList schema.org
  // Topics as ListItems, links as sub-items
  // Canonical url via seo.absoluteToolUrl(locale, 'bookmarks')
}
```

---

## 5. Generator Contract

### `scripts/generate-bookmarks.mjs`

**Purpose:**  
Scan `content/bookmarks/`, parse markdown, validate, merge ko+en pairs, emit `src/components/tools/bookmarks/data/bookmarks.generated.json`.

**Algorithm:**

```
1. readdirSync('content/bookmarks/') → files
2. Group by base filename (ko/en pairs): 
     harness-engineering.md → pair with harness-engineering_en.md
3. For each pair:
   a. gray-matter(koFile).data → zod TopicFileFrontSchema.safeParse → koFront
   b. gray-matter(enFile).data → zod TopicFileFrontSchema.safeParse → enFront
   c. Collect parse errors (non-blocking)
   d. mergePair(koFront, enFront, koFilename) → MergedTopic candidate
   e. Validate: slug unique, pair integrity, section/link counts (≥1 section, ≥3 links total), URL validity (http(s) only)
   f. Collect validation errors
4. If errors.length > 0:
   → stderr each error with file path + field + reason
   → process.exit(1) — BUILD FAILS
5. Else:
   → Sort alphabetically by slug
   → MergedTopicSchema.parse(record) for final validation (redundant but defensive)
   → JSON.stringify(sorted array, null, 2) → bookmarks.generated.json
   → Deterministic output (no Date/random)
```

**Contract — Input:**
- `content/bookmarks/` folder structure:
  - `_TEMPLATE.md`, `_TEMPLATE_en.md` → SKIP (matched by `_` prefix)
  - `README.md` → SKIP
  - `<topic>.md`, `<topic>_en.md` → PROCESS (exact pairs required)

**Contract — Output:**
- `src/components/tools/bookmarks/data/bookmarks.generated.json`
- Format: `[MergedTopic, ...]` (JSON array, deterministic sort)
- SCHEMA: zod MergedTopicSchema validates each record

**Contract — Errors:**
- Missing EN pair: "harness-engineering.md found, but harness-engineering_en.md missing — pair required"
- Invalid URL: "file.md: link 'https://bad@url' invalid — must be valid http(s)"
- <3 links: "file.md: only 2 links total, minimum 3 required per topic"
- Duplicate slug: "file1.md + file2.md: both resolve to slug 'frontend-resources' — must be unique"
- Orphan EN: "harness-engineering_en.md found without harness-engineering.md — pair required"
- All errors → stderr, exit(1) → CI fails

**Wiring:**
```json
{
  "scripts": {
    "predev": "node scripts/generate-bookmarks.mjs",
    "prebuild": "node scripts/generate-bookmarks.mjs"
  }
}
```

---

## 6. Platform Changes

### 6.1 Registry Entry (`src/tools/registry.ts`)

**ADD ONE entry to `tools: ToolMeta[]` array:**

```typescript
{
  id: 'bookmarks',
  slug: 'bookmarks',
  category: 'dev',
  icon: 'Bookmark',
  accent: 'sky',
  status: 'live',           // NOTE: CRITICAL — set to 'live' on launch (not 'coming_soon')
  isNew: true,
  order: 18,                // Adjust per product priorities
  keywords: [
    '즐겨찾기', '북마크', '링크', '모음', '자료', '큐레이션', '리소스', 
    '하네스', '엔지니어링', '프런트엔드', '디자인', '개발',
    'bookmarks', 'links', 'directory', 'resources', 'curated', 
    'engineering', 'frontend', 'design', 'dev', 'tools'
  ],
}
```

**RATIONALE for status='live':**  
The SPEC says "status 'coming_soon' initially then 'live'". Since this blueprint is for immediate implementation + launch with seed content + 1 real topic added, **recommend `status: 'live'`** so:
- `generateStaticParams()` includes `/[locale]/tools/bookmarks` routes.
- `generateMetadata()` branch activates.
- UI does NOT render "Coming Soon" badge.
- Tool is searchable in the hub.

If preview-only launch is desired, use `status: 'coming_soon'` instead. Document the choice.

### 6.2 Tool Route Branch (`src/app/[locale]/tools/[slug]/page.tsx`)

**ADD slug→component mapping:**

```typescript
// Inside tool route handler, add branch:

import { Bookmarks } from '@/components/tools/bookmarks';

export default async function ToolPage({
  params: { slug, locale },
}: {
  params: { slug: string; locale: string };
}) {
  // ... existing code ...
  
  // ADD slug branch (preserve existing order):
  if (slug === 'ladder') return <Ladder />;
  if (slug === 'qna-a-day') return <QnADay />;
  if (slug === 'new-word') return <NewWord />;
  if (slug === 'url-encoder') return <UrlEncoder />;
  if (slug === 'rankings') return <Rankings />;
  if (slug === 'bookmarks') return <Bookmarks />;  // ← ADD
  
  notFound();
}
```

### 6.3 generateMetadata Branch (`src/app/[locale]/tools/[slug]/page.tsx`)

**ADD metadata generation:**

```typescript
export async function generateMetadata({
  params: { slug, locale },
}: {
  params: { slug: string; locale: string };
}): Promise<Metadata> {
  const t = getTranslations({ locale, namespace: 'tools' });
  
  // ... existing branches ...
  
  if (slug === 'bookmarks') {
    return {
      title: t('bookmarks.meta.title'),
      description: t('bookmarks.meta.description'),
      openGraph: {
        title: t('bookmarks.meta.title'),
        description: t('bookmarks.meta.description'),
        url: seo.absoluteToolUrl(locale, 'bookmarks'),
        type: 'website',
      },
      alternates: {
        canonical: seo.absoluteToolUrl(locale, 'bookmarks'),
        languages: {
          ko: seo.absoluteToolUrl('ko', 'bookmarks'),
          en: seo.absoluteToolUrl('en', 'bookmarks'),
        },
      },
    };
  }
  
  // ... fallback ...
}
```

### 6.4 i18n Messages (`src/i18n/messages/{ko,en}.json`)

**ADD nested keys under `tools.bookmarks.*`:**  
(See Section 3 for full key list. Add all keys to both ko.json and en.json with proper translations.)

---

## 7. Build Order + Agent Assignment

**PHASE 1 — DOMAIN (PURE, TESTABLE)**

1. **domain-engineer**
   - Create `src/lib/bookmarks/schema.ts` + `.test.ts`
   - Create `src/lib/bookmarks/slug.ts` + `.test.ts`
   - Create `src/lib/bookmarks/merge.ts` + `.test.ts`
   - Create `src/lib/bookmarks/catalog.ts` + `.test.ts`
   - Create `src/lib/bookmarks/search.ts` + `.test.ts`
   - Create `src/lib/bookmarks/favorites.ts` + `.test.ts`
   - **Target:** ≥80% coverage per module, all TDD RED→GREEN, TS 0 errors.

**PHASE 2 — GENERATOR + CONTENT**

2. **platform-engineer**
   - Create `scripts/generate-bookmarks.mjs`
   - Create `content/bookmarks/_TEMPLATE.md`, `_TEMPLATE_en.md`
   - Create `content/bookmarks/README.md` (authoring guide)
   - Create seed topics (4): `하네스-엔지니어링.md/.md_en`, `프런트엔드-리소스.md/.md_en`, `디자인-참고.md/.md_en`, `무료-개발-도구.md/.md_en`
   - Wire `predev` + `prebuild` in `package.json`
   - **Validation:** `pnpm predev` → `bookmarks.generated.json` contains all 4 topics, valid structure, 0 errors.

**PHASE 3 — i18n + HOOK**

3. **platform-engineer** (or **ui-engineer** if parallelized)
   - Add `tools.bookmarks.*` keys to `src/i18n/messages/ko.json` + `en.json`
   - Create `src/components/tools/bookmarks/useBookmarksCatalog.ts`
   - Import catalog: `import bookmarks from './data/bookmarks.generated.json'`
   - Implement hook contract (see Section 4).
   - **Validation:** Hook exports correct interface, TS 0 errors.

**PHASE 4 — UI COMPONENTS (REACT ISLAND)**

4. **ui-engineer**
   - Create `src/components/tools/bookmarks/Bookmarks.tsx` (orchestrator)
   - Create `src/components/tools/bookmarks/BookmarksSearch.tsx`
   - Create `src/components/tools/bookmarks/TopicTabs.tsx`
   - Create `src/components/tools/bookmarks/TopicsList.tsx`
   - Create `src/components/tools/bookmarks/TopicCard.tsx`
   - Create `src/components/tools/bookmarks/TopicDetail.tsx`
   - Create `src/components/tools/bookmarks/TopicSections.tsx`
   - Create `src/components/tools/bookmarks/LinkRow.tsx`
   - Create `src/components/tools/bookmarks/index.ts` (barrel)
   - Implement all props as per Section 4.
   - **Validation:** `pnpm build` succeeds, no TS errors, component visual regression passes (320/768/1024).

**PHASE 5 — SEO + STRUCTURED DATA**

5. **seo-geo-engineer** (or **ui-engineer** + **platform-engineer**)
   - Create `src/components/tools/bookmarks/BookmarksIntro.tsx`
   - Create `src/components/tools/bookmarks/BookmarksHowTo.tsx`
   - Create `src/components/tools/bookmarks/BookmarksFaq.tsx`
   - Create `src/components/tools/bookmarks/BookmarksStructuredData.tsx`
   - Implement JSON-LD: SoftwareApplication + ItemList + FAQPage (topics as items, links as sub-items).
   - Use `seo.absoluteToolUrl(locale, 'bookmarks')` for canonical in JSON-LD.
   - **Validation:** Prerender HTML includes all meta, JSON-LD valid (schema.org), url == canonical.

**PHASE 6 — PLATFORM WIRING**

6. **platform-engineer**
   - Add registry entry (`src/tools/registry.ts`)
   - Add slug→component branch in tool route
   - Add generateMetadata branch in tool route
   - **Validation:** `pnpm build` → SSG renders /ko/tools/bookmarks + /en/tools/bookmarks, status prerendered.

**PHASE 7 — INTEGRATION QA**

7. **qa-integration** (or **senior engineer**)
   - Full `pnpm build` + static export success.
   - E2E: scenarios 1–5 (markdown auto-compose, search, detail, favorites/recents, locale swap).
   - Visual regression: 320/768/1024 both themes (light/dark if implemented).
   - Axe a11y: no violations.
   - **Validation:** Commit only on 100% green.

**PARALLEL TEAMS (after Phase 1):**
- Phases 2–3 can overlap (generator, i18n, hook).
- Phase 4 can overlap with 2–3.
- Phase 5 overlaps with 4–6.
- Phase 6 depends on 4 being mostly complete.
- Phase 7 is gate for merge.

---

## 8. Invariants & Gotchas

### CRITICAL Invariants

1. **Pair Integrity (Content Model)**
   - EVERY topic MUST have BOTH ko + en markdown files.
   - Absence → generator FAILS BUILD.
   - Duplicate slug across files → generator FAILS BUILD.

2. **Link Validation (Security)**
   - Every link URL must be valid `http://` or `https://` (no `ftp://`, no relative).
   - Invalid URL → generator FAILS BUILD.
   - Renderer: `rel="noopener target="_blank"` (always).

3. **Minimum Content (Quality Gate)**
   - Every topic must have ≥1 section.
   - Every topic must have ≥3 links total (across all sections).
   - Violation → generator FAILS BUILD.

4. **Slug Uniqueness**
   - Derived slugs (from filename or explicit frontmatter) must be UNIQUE per catalog.
   - Collision → generator FAILS BUILD + stderr per file.

5. **Immutability (Domain Layer)**
   - All domain functions return new arrays/objects (never mutate input).
   - toggleFavorite, pushRecent return NEW arrays.
   - Search filters return NEW array in new order.
   - Tested by Vitest mutant checks (e.g., toEqual !== toBe).

6. **localStorage Persistence**
   - On load: pruneUnknown(favorites, catalog) auto-cleans orphaned ids.
   - Corrupt blob → start fresh (no throw, no error boundary).
   - Recents: MRU order (index 0 = most recent).
   - Favorites: insertion order (stable).

7. **SEO/GEO Outside Mounted Gate (CRITICAL)**
   - BookmarksIntro, BookmarksHowTo, BookmarksFaq, StructuredData rendered UNCONDITIONALLY (no `{mounted && ...}`).
   - AI crawlers don't execute JS → unmounted gate hides SEO content from HTML.
   - **PATTERN:** All tools use this rule. Violation detected by integration-qa.

8. **Search Index (Both Locales)**
   - Search MUST index ko title/description/sections + en title/description/sections.
   - If only one locale indexed → regression on other locale search.
   - Tested by search.test.ts (ko query matches en title, etc.).

9. **Token Validity (Design System)**
   - Only use design tokens from DESIGN.md + tokens.css.
   - `--accent-sky`, `--accent-sky-soft` exist (verified in DESIGN.md).
   - Phantom tokens (e.g., `--accent-sky-muted`, `--surface-secondary`) → silent transparent render → test/visual gate catches.
   - **Action:** If new token needed, add to DESIGN.md + tokens.css FIRST, THEN use in CSS.

10. **Canonical URL Sync (i18n + JSON-LD)**
    - `tools.bookmarks.meta.description` (i18n key) MUST contain NO locale-specific phrases (ko/en canonical).
    - JSON-LD `url` MUST match canonical link (via seo.absoluteToolUrl).
    - Mismatch → integration-qa gate catches (link audit).

### Gotchas (from Jurepi.kr experience)

**Gotcha 1: Phantom Design Tokens**
- Tailwind renders phantom `--surface-secondary` as `transparent` silently.
- Selector/active state becomes invisible (passed unit + visual regression if boundingBox not checked).
- **Prevention:** design-system-fidelity: validate token names against tokens.css on every new component.

**Gotcha 2: "Stale Closure" in debounced Search**
- If debounce callback captures `query` state at closure time, typing multiple chars updates closure but old query persists → shows wrong results.
- **Prevention:** jurepi-tdd: pass query as argument to debounced handler, or use ref for latest value.

**Gotcha 3: localStorage Corrupt → Crash if No Fallback**
- If zod parse fails + component throws, ErrorBoundary catches but user loses interaction.
- **Prevention:** useBookmarksCatalog: safeJsonParse returns null on fail, initialize to fresh state (no throw).

**Gotcha 4: Search Debounce Persists Too Long**
- Debounced `setQuery(...)` called but rendered output lags user expectation (user sees old results for 120ms after each char).
- **Solution:** OK by spec (user sees "123 results" caption update immediately, list lags slightly). Don't over-debounce.

**Gotcha 5: SSR ≠ "Rendered"**
- Test passes (component renders), but SEO HTML missing JSON-LD because it's inside `{mounted && ...}`.
- **Prevention:** integration-qa: always inspect prerender HTML body for meta + JSON-LD (not just run Vitest).

**Gotcha 6: Slug Canonicalization Drift**
- KO filename `하네스 엔지니어링.md` → slug `harness-engineering` (after diacritics strip).
- EN filename mismatch → EN becomes orphan (generator fails).
- **Prevention:** Use consistent ASCII filenames (e.g., `harness-engineering.md`). Include authoring guide in README.

**Gotcha 7: "No topics" ≠ "no recents" vs "Favorites empty"**
- Three empty states: (1) query results empty, (2) no favorites pinned, (3) no recent views.
- Each needs distinct message (confirm i18n keys cover all).
- **Prevention:** List all empty states in i18n keys (Section 3).

**Gotcha 8: LinkRow href → new tab but no loader**
- External link: user clicks, browser opens new tab, no client transition.
- Roving focus: after click, focus should remain on the closed link row (not move). Test with keyboard-only.
- **Prevention:** Playwright E2E: tab + arrow, click, Tab (verify focus stays in list not jumping).

---

## 9. Testing Strategy

### Unit Tests (Vitest, RED→GREEN)

**Domain Layer (≥80% coverage, fully isolated):**
- `schema.test.ts`: zod parse success/failure cases, optional vs required, URL validation, section/link counts.
- `slug.test.ts`: slugify diacritics, uniqueness check, resolveSlug filename handling, ASCII-only output.
- `merge.test.ts`: canonical rule (ko canonical, en inherits), pair validation, all required fields.
- `catalog.test.ts`: uniqueness, locale completeness (every merged topic has ko + en), no orphans.
- `search.test.ts`: query normalization (NFC, diacritics, case), match logic (title/desc/sections/links, both locales), stable order.
- `favorites.test.ts`: toggleFavorite immutability, pushRecent MRU + de-dupe, pruneUnknown removes unknown ids.

**Generator (Fixtures):**
- `generate-bookmarks.mjs`: test fixtures in `.test.mjs` (pair-missing, <3-links, invalid-URL, duplicate-slug → all exit non-zero).

**Hook + Component (Vitest + React Testing Library):**
- `useBookmarksCatalog.test.ts`: mount hook, verify localStorage read/write, favorites toggle, recents MRU, query filter + debounce.
- `BookmarksSearch.test.ts`: type → setQuery + debounce, clear button, result count.
- `TopicTabs.test.ts`: tab switch, favorites/recents tabs hidden when empty, aria-selected.
- `TopicsList.test.ts`: roving tabindex, arrow navigation, Enter to select.
- `TopicCard.test.ts`: title/desc/count rendered, star toggle favorite, selected ring.
- `TopicDetail.test.ts`: sections/links rendered, link rows styled, Esc closes.
- `LinkRow.test.ts`: rel/target attrs, external icon, hover/focus states.

### E2E Tests (Playwright, 5+ scenarios)

**Scenario 1: Markdown folder → list auto-compose**
- Setup: seed topics exist in `content/bookmarks/`.
- `pnpm predev` → `bookmarks.generated.json` created.
- Visit `/ko/tools/bookmarks` → all 4 seed topics visible in grid.
- Add new pair in content, rebuild → new topic appears.
- Missing EN pair → build fails (verified stderr).

**Scenario 2: Search, empty states**
- Type "프런트엔드" → list narrows to matching topics.
- Type "asdfqwer" → empty state: "asdfqwer에 해당하는 주제가 없어요".
- Clear → full list restored.
- Tab to Favorites (empty initially) → "별을 눌러 즐겨찾기를 저장하세요".

**Scenario 3: Detail — sections and link rows**
- Click "하네스 엔지니어링" → detail opens below list.
- Title, description (curator intent) visible.
- Each section: heading + link rows (title, desc, external-link icon).
- Link row clickable, opens in new tab (verify target="_blank").
- No horizontal scroll at 320px.

**Scenario 4: Favorites, recent, persistence, keyboard**
- Open 2 topics → Recent tab shows both MRU.
- Star card → Favorites tab shows it.
- Reload (F5) → favorites/recents persist.
- "/" → search focus.
- Arrow keys → navigate cards.
- "f" (card focused) → toggle favorite (aria-live announces).

**Scenario 5: i18n, SEO**
- Switch to `/en/tools/bookmarks` → chrome English, topic titles English.
- Prerender HTML has SoftwareApplication + ItemList JSON-LD (url == canonical).
- `curl` → HTTP 200, `<title>` matches meta.title, `<meta name="description">`.

### Accessibility (axe, Manual)

- Card/link buttons ≥44px tap target.
- Focus ring visible (2px var(--focus-ring)).
- Roving focus works (arrow keys navigate, Enter selects).
- aria-live announces favorite toggle.
- Section headings semantic (`<h3>`).
- Links rel=noopener (no external-link security issue).
- Prefers-reduced-motion: no animation if set (motion-reduce class).
- Color contrast: text ≥4.5:1 on all backgrounds.

### Performance (Lighthouse)

- LCP < 2.5s (static prerender, no JS bloat).
- CLS < 0.1 (no layout shift from ads, reserved heights).
- Catalog code-split dynamic import (not in main bundle).
- No unused CSS (Tailwind purge active).

---

## 10. Key Implementation Notes

### Design System Alignment

- **Accent (Sky):** `--accent-sky` for tool identity (favorite star, selected card ring, intro icon).
- **Brand (Honey-Gold):** `--brand` for CTA buttons (future), active tabs.
- **Surfaces:** `--surface` (white) for cards/detail, `--surface-muted` for link row hover.
- **Text:** `--text` (dark ink) for title, `--text-secondary` for description, `--text-muted` for icon.
- **Typography:** H1 Gmarket Sans 28–40px/700 (clamp); title 18–20px/700; link 16px/600; desc 14–15px; section eyebrow 12px/700.
- **Radius:** Card lg (16px), detail xxl (28px).
- **Shadow:** Card default + hover lift (translateY -2px).
- **Motion:** 150ms cubic-bezier(0.16, 1, 0.3, 1) (ease-out-expo), gated by prefers-reduced-motion.

### Routing & Locale

- Single route: `/[locale]/tools/bookmarks` (no per-topic deep-link routes; Phase 2 candidate).
- Locale-prefixed: `/ko/tools/bookmarks`, `/en/tools/bookmarks` (both prerendered SSG).
- Canonical tag: `seo.absoluteToolUrl(locale, 'bookmarks')` (existing platform utility).
- hreflang: alternate links to both locales (Next.js built-in via next-intl).

### Content Authoring

- Templates: `content/bookmarks/_TEMPLATE.md` + `_TEMPLATE_en.md` (exact structure example).
- README: `content/bookmarks/README.md` (authoring guide: YAML structure, link format, slug rules).
- Seed topics: 4 files (haiki, frontend, design, tools) × 2 locales = 8 markdown files.
- Versioning: all in git, no CMS (deploy = git push to main).

### Code Organization (File Size)

- `src/lib/bookmarks/*.ts`: ≤200 lines each (small, focused, fully tested).
- `src/components/tools/bookmarks/*.tsx`: ≤300 lines each (UI + logic decoupled via hook).
- No barrel re-exports outside `index.ts`.
- Alphabetical file order.

### Deployment

- `output: 'export'` (static export, no SSR at runtime).
- `bookmarks.generated.json` code-split: dynamic import only on tool route.
- Catalog NOT in i18n messages bundle (stays <50KB total overhead).
- No client-side API calls (all content in JSON).

---

## 11. Success Criteria (Pass/Fail Gate)

**Must Pass (Green):**
1. `pnpm build` → no TS errors, ≥80% coverage (domain + hook + components).
2. All Vitest tests pass (domain, generator fixtures, hook, components).
3. All Playwright E2E scenarios pass (5+).
4. Axe a11y: 0 violations.
5. Lighthouse: LCP < 2.5s, CLS < 0.1, no budget violations.
6. Prerender HTML includes meta (title, description) + all JSON-LD (url == canonical).
7. `/ko/tools/bookmarks` + `/en/tools/bookmarks` both SSG, routes live, searchable in hub.
8. Seed 4 topics + 1 real topic authored + git pushed.
9. Visual regression: 320/768/1024 both light/dark, no deviations.
10. Keyboard-only workflow: "/" → search, arrow navigate, "f" favorite, Esc close (all work).

**Must NOT Pass (Fail Gate):**
1. Generator exits non-zero (content errors uncaught).
2. Any orphan markdown files (pair missing, duplicate slug, invalid URL).
3. SEO sections inside `{mounted && ...}` (no pre-render HTML).
4. Phantom design tokens used (tests green, visual fails).
5. >300 lines in any UI component (split if larger).
6. No fallback for corrupt localStorage (throw → error boundary).
7. Stale closure in debounced search (async test catches).
8. Missing i18n keys (translate calls throw MISSING_MESSAGE).
9. Link rows overflow at 320px (responsive test fails).
10. No description provided for link/section (nullable renders as blank).

---

## 12. Notes & Assumptions

### ASSUMPTION: Status = 'live' on Launch
The SPEC says status initially 'coming_soon', then 'live' on launch. This blueprint assumes **`status: 'live'` from day 1** (not coming_soon) because the request is to "build and launch now" with seed content. If preview-only is desired, change to 'coming_soon' and note in registry.

### ASSUMPTION: No Deep-Link Routes (Phase 2)
Tool detail does NOT render at per-topic URLs (e.g., `/tools/bookmarks/frontend-resources`). All content loaded client-side via state + SPA. Phase 2 can add per-topic routes for deeper SEO.

### ASSUMPTION: Catalog Code-Split
`bookmarks.generated.json` NOT inline in page HTML. Dynamically imported when component mounts. Saves main bundle size, OK for client-side app (SPA expectation).

### ASSUMPTION: No User Submissions
No "add link" UI, no backend. Only editor-authored markdown in repo. (Phase 3 candidate.)

### ASSUMPTION: 4 Seed Topics + 1 Real Topic
Recommendation: build 4 templates in content (harness, frontend, design, tools) + add 1 real topic from user/team. Total ≥5 topics live at launch (solid, non-empty launch).

### ASSUMPTION: Reduced-Motion Respected
All motion (card hover lift, fade-in) gated by `prefers-reduced-motion`. Component CSS uses `@media (prefers-reduced-motion: no-preference)` wrapper.

---

## Appendix: File Checklist

**Files to Create (Domain):**
- [ ] `src/lib/bookmarks/schema.ts` + `.test.ts`
- [ ] `src/lib/bookmarks/slug.ts` + `.test.ts`
- [ ] `src/lib/bookmarks/merge.ts` + `.test.ts`
- [ ] `src/lib/bookmarks/catalog.ts` + `.test.ts`
- [ ] `src/lib/bookmarks/search.ts` + `.test.ts`
- [ ] `src/lib/bookmarks/favorites.ts` + `.test.ts`

**Files to Create (Generator + Content):**
- [ ] `scripts/generate-bookmarks.mjs`
- [ ] `content/bookmarks/_TEMPLATE.md`
- [ ] `content/bookmarks/_TEMPLATE_en.md`
- [ ] `content/bookmarks/README.md`
- [ ] `content/bookmarks/topics/harness-engineering.md`
- [ ] `content/bookmarks/topics/harness-engineering_en.md`
- [ ] `content/bookmarks/topics/frontend-resources.md`
- [ ] `content/bookmarks/topics/frontend-resources_en.md`
- [ ] `content/bookmarks/topics/design-reference.md`
- [ ] `content/bookmarks/topics/design-reference_en.md`
- [ ] `content/bookmarks/topics/free-dev-tools.md`
- [ ] `content/bookmarks/topics/free-dev-tools_en.md`

**Files to Create (UI + Hook):**
- [ ] `src/components/tools/bookmarks/useBookmarksCatalog.ts`
- [ ] `src/components/tools/bookmarks/Bookmarks.tsx`
- [ ] `src/components/tools/bookmarks/BookmarksSearch.tsx`
- [ ] `src/components/tools/bookmarks/TopicTabs.tsx`
- [ ] `src/components/tools/bookmarks/TopicsList.tsx`
- [ ] `src/components/tools/bookmarks/TopicCard.tsx`
- [ ] `src/components/tools/bookmarks/TopicDetail.tsx`
- [ ] `src/components/tools/bookmarks/TopicSections.tsx`
- [ ] `src/components/tools/bookmarks/LinkRow.tsx`
- [ ] `src/components/tools/bookmarks/BookmarksIntro.tsx`
- [ ] `src/components/tools/bookmarks/BookmarksHowTo.tsx`
- [ ] `src/components/tools/bookmarks/BookmarksFaq.tsx`
- [ ] `src/components/tools/bookmarks/BookmarksStructuredData.tsx`
- [ ] `src/components/tools/bookmarks/index.ts` (barrel)
- [ ] `src/components/tools/bookmarks/data/` (directory for generated JSON)

**Files to Modify:**
- [ ] `src/tools/registry.ts` — add ONE entry
- [ ] `src/app/[locale]/tools/[slug]/page.tsx` — add slug branch + generateMetadata branch
- [ ] `src/i18n/messages/ko.json` — add tools.bookmarks.* keys
- [ ] `src/i18n/messages/en.json` — add tools.bookmarks.* keys
- [ ] `package.json` — wire predev/prebuild (if not already auto)

**Files to Generate (At Build Time):**
- [ ] `src/components/tools/bookmarks/data/bookmarks.generated.json` (output of generate-bookmarks.mjs)

---

**END OF BLUEPRINT**

---

**Handoff Notes for Agents:**

1. **domain-engineer:** Start with Phase 1 (all domain `.ts` + `.test.ts` files). Fully TDD, ≥80% coverage. No React.
2. **platform-engineer:** Phase 2 (generator + content + predev wiring) + Phase 6 (registry + route branches). Async with domain.
3. **ui-engineer:** Phase 4 (UI components). Depends on Phase 3 (hook) being ready.
4. **seo-geo-engineer:** Phase 5 (SEO sections + JSON-LD). Can overlap with Phase 4.
5. **qa-integration:** Phase 7 (full build + E2E + visual + a11y). Gate before merge.

All work **follows clean architecture**: domain pure/testable, adapters consume domain, platform orchestrates adapters.

All work **follows TDD**: tests RED first, implementation GREEN, refactor IMPROVE.

All work **respects i18n contracts**, **avoids phantom tokens**, **respects SEO/GEO invariants**, **tests keyboard + a11y**, **validates generator output**.

This blueprint is the contract. Implementation must not deviate without architect approval. Questions → ask architect (this thread) before coding.
