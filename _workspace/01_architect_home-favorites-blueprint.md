# Home Favorites — 구현 청사진 (리더 작성)

SPEC: `docs/services/home/favorites/SPEC.md` (정본). 워크트리: `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-home-favorites` (branch `home/favorites`).

홈 대시보드 기능(독립 도구 아님): 라이브 도구 카드에 별(하트) 버튼 + 필터 행 "즐겨찾기" pill. 상태는 localStorage(zod)만, SSR 그리드 불변(크롤 앵커 유지), 하이드레이션 안전.

## 계층 분해

| 계층 | 파일 | 담당 |
|------|------|------|
| 도메인 | `src/lib/home-favorites/{schema,favorites}.ts` + tests | domain-engineer |
| 유스케이스(훅) | `src/hooks/useHomeFavorites.ts` + test | domain-engineer |
| 어댑터(UI) | `src/components/home/{FavoriteButton,FavoritesFilterToggle}.tsx` 신규 + `{ToolCard,ToolGrid,ToolExplorer,CategoryFilter}.tsx` 수정 + i18n | ui-engineer |
| 검증 | 전체 vitest·tsc·build·프리렌더 grep·E2E·시각 | 리더 |

## 도메인 계약 (변경 금지 — 변경 필요 시 리더 승인)

```ts
// src/lib/home-favorites/schema.ts
export const STORE_VERSION = 1;
export const STORAGE_KEY = 'jurepi-home-favorites';
export const favoritesStoreSchema = z.object({ version: z.number(), ids: z.array(z.string()) });
export type FavoritesStore = z.infer<typeof favoritesStoreSchema>;
/** raw(unknown, JSON.parse 결과 or null) → ids. 손상/버전 불일치/비객체 → [] (조용한 fresh start, throw 금지) */
export function parseFavoritesStore(raw: unknown): string[];
/** ids → 직렬화용 스토어 객체 */
export function buildFavoritesStore(ids: readonly string[]): FavoritesStore;

// src/lib/home-favorites/favorites.ts (순수·불변, react/DOM import 금지)
export function toggleFavorite(ids: readonly string[], slug: string): string[]; // 있으면 제거, 없으면 끝에 추가. 새 배열 반환
export function isInFavorites(ids: readonly string[], slug: string): boolean;
export function pruneMissing(ids: readonly string[], validSlugs: readonly string[]): string[]; // validSlugs에 없는 id 제거
```

```ts
// src/hooks/useHomeFavorites.ts ('use client')
export interface UseHomeFavoritesReturn {
  favoriteIds: string[];               // 초기값 [] (SSR 일치 — useState 초기값에서 localStorage 읽기 금지!)
  toggleFavorite: (slug: string) => void; // 상태 갱신 + localStorage 즉시 persist (디바운스 금지 — discrete 상태)
  isFavorited: (slug: string) => boolean;
}
export function useHomeFavorites(liveSlugs: readonly string[]): UseHomeFavoritesReturn;
```
- 마운트 1회(useRef 가드): localStorage 읽기 → `parseFavoritesStore` → `pruneMissing(ids, liveSlugs)` → setState. prune 결과가 원본과 다르면 localStorage에 재기록.
- toggle: `toggleFavorite` → setState + `localStorage.setItem(STORAGE_KEY, JSON.stringify(buildFavoritesStore(newIds)))` 즉시. localStorage 예외(사파리 프라이빗 등)는 try/catch로 무시(상태는 갱신).
- **함수형 setState 사용**(스테일 클로저 금지). toggleFavorite/isFavorited는 안정 참조(useCallback) — 단 favoriteIds 최신값 기준.
- 테스트: jsdom 실제 localStorage로 persist/reload 검증(모의 onSave 금지), 손상 JSON → fresh, prune, StrictMode 이중 마운트 안전.

## UI 계약

### FavoriteButton (신규, `src/components/home/FavoriteButton.tsx`)
props: `{ slug: string; name: string; isFavorited: boolean; onToggle: (slug: string) => void; testId?: string }`
- `<button type="button">`, `aria-pressed={isFavorited}`, aria-label: i18n `home.favorites.addAria`/`removeAria` (name 보간, 동적 전환).
- 44px 타깃(`w-11 h-11`), 아이콘 lucide `Heart` 20px. 미즐겨찾기: `text-text-muted`, 즐겨찾기: `text-accent-rose` + fill(하트 채움). **실토큰만**(`accent-rose`·`text-muted`·`surface-sunken`·`focus-ring` — 팬텀 `rose-soft`/`bg-rose-soft` 금지, SPEC 표기는 팬텀이므로 `bg-accent-rose/10` 등 실토큰 파생으로).
- `focus-visible:ring-2 ring-offset-2 ring-focus-ring`, hover 미묘한 bg. 모션 없음(즉시 전환).
- onClick: `e.preventDefault?` 불필요 — **앵커 밖 형제**라 네비게이션 없음.

### ToolCard 수정
- live 카드: 기존 `<Link>`를 `<div className="relative h-full">`로 감싸고, FavoriteButton을 Link **밖 형제**로 `absolute top-3 right-3 z-10` 배치.
- **배지 겹침 주의**: 현재 카드 top-right에 NEW 배지가 있음(대부분의 카드). 배지 flex 컨테이너에 상수 `pr-`(별 버튼 폭만큼, 예: `mr-10` 또는 `pr-11`)을 줘 겹치지 않게 — 상수 오프셋(SSR/클라 동일)이라 CLS 0.
- 신규 optional props: `isFavorited?: boolean; onToggleFavorite?: (slug: string) => void`. `onToggleFavorite` 없거나 coming_soon이면 버튼 미렌더(기존 사용처/테스트 호환).
- coming_soon 카드는 버튼 없음. 기존 hover lift(group) 동작 불변 — 버튼은 group 밖이라 카드 lift 트리거 안 함.

### FavoritesFilterToggle (신규)
props: `{ active: boolean; onToggle: () => void; testId?: string }`
- CategoryFilter pill과 동일 스타일(활성: `bg-brand text-on-brand shadow-card font-semibold` / 비활성: `bg-surface-muted text-text-secondary hover:bg-hairline-strong`), `min-h-11`, `aria-pressed`, aria-label `home.favorites.filterAria`, 라벨 `home.favorites.filterLabel` + Heart 아이콘 16px(활성 시 채움).
- `data-testid="favorites-filter-toggle"` 기본 부여(E2E 앵커).

### CategoryFilter 수정 (최소)
- optional `trailing?: React.ReactNode` prop 추가 — pill 행 끝에 렌더(같은 flex row). 기존 렌더 불변.

### ToolExplorer 수정 (배선 소유자)
```ts
const liveSlugs = useMemo(() => initialTools.filter(t => t.status === 'live').map(t => t.slug), [initialTools]);
const { favoriteIds, toggleFavorite, isFavorited } = useHomeFavorites(liveSlugs);
const [favoritesOnly, setFavoritesOnly] = useState(false); // SSR 일치 상수
```
- URL 하이드레이트(기존 mount effect에 추가): `params.get('favorites') === 'true'` → `setFavoritesOnly(true)`.
- URL 반영(기존 replaceState effect에 추가): `if (favoritesOnly) params.set('favorites','true')`; deps에 favoritesOnly 추가.
- 필터 합성: `const visible = favoritesOnly ? results.filter(t => t.status === 'live' && isInFavorites(favoriteIds, t.slug)) : results;` (search AND category AND favorites).
- `isFiltered`는 `favoritesOnly`도 포함해 resultCount 노출: `const anyFilter = isFiltered || favoritesOnly;`
- 빈 상태 분기: `const isEmptyBecauseFavorites = visible.length === 0 && favoritesOnly && query.trim() === '' && category === 'all';`
- ToolGrid에 전달: `tools={visible}`, `favoriteIds`/`onToggleFavorite`(또는 isFavorited), `isEmptyBecauseFavorites`, `onShowAll={() => setFavoritesOnly(false)}`.
- FavoritesFilterToggle은 `<CategoryFilter trailing={...}/>`로 배선.
- reset(기존 emptyState resetButton)도 `setFavoritesOnly(false)` 포함.

### ToolGrid 수정
- 신규 props: `favoriteIds: string[]`(또는 `isFavorited`), `onToggleFavorite`, `isEmptyBecauseFavorites?: boolean`, `onShowAll?: () => void` (전부 optional로 기존 테스트 호환).
- `tools.length === 0 && isEmptyBecauseFavorites` → EmptyState에 `home.favorites.emptyHeading/emptyBody/showAll` + `onAction=onShowAll`. 그 외 기존 로직.
- 카드에 `isFavorited={favoriteIds.includes(tool.slug)}` + `onToggleFavorite` 전달.

## i18n 키 계약 (ko/en 분리 — 파이프 조인 금지, `home.favorites.*`)

| key | ko | en |
|-----|----|----|
| filterLabel | 즐겨찾기 | Favorites |
| filterAria | 즐겨찾기 필터 | Filter by favorites |
| addAria | {name} 즐겨찾기 추가 | Add {name} to favorites |
| removeAria | {name} 즐겨찾기 해제 | Remove {name} from favorites |
| emptyHeading | 아직 즐겨찾기가 없어요 | No favorites yet |
| emptyBody | 카드의 하트를 눌러 즐겨찾기를 추가하세요. | Tap the heart on a card to add favorites. |
| showAll | 모두 보기 | Show all tools |

ko.json/en.json의 기존 `home` 객체 **안에** `favorites` 노드 추가(최상위 삽입 금지 — 파스 파손 전례). 컴포넌트 테스트는 실카탈로그(en.json) 소비(test-utils 경유), 인라인 mock 금지.

## 비타협 게이트

1. SSR 불변: 프리렌더 `out/ko.html`(홈)의 `<a href="/ko/tools/…">` 앵커 수가 main과 동일. 즐겨찾기 로직은 전부 post-mount.
2. 하이드레이션: useState 초기값에서 localStorage/navigator 읽기 금지. React #418 콘솔 0.
3. CLS: 버튼·배지 오프셋 상수(SSR=클라). 토글 시 reflow 없음.
4. a11y: aria-pressed·aria-label(도구명)·44px·키보드 도달·focus ring.
5. 실토큰만: 완료 후 `npx vitest run src/__test__` (color-tokens 가드) 필수.
6. 기존 테스트 파일은 append(대체·삭제 금지). 전체 `pnpm vitest run` 그린.
7. TDD: 테스트 먼저. 도메인 100% 목표.
