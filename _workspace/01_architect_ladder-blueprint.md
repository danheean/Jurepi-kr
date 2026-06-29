# 01 · Architect Blueprint — 사다리타기 (ghost-leg) 수직 슬라이스

## 범위 (이번 실행)
"사다리타기를 개발하세요" → **실행 가능한 수직 슬라이스**: 빈 레포에 Next.js 15 SSG 골격을 세우고, `/[locale]/tools/ladder`에서 동작하는 **완전한 사다리 게임**을 클린 아키텍처 + TDD로 구현한다.

- **포함:** 스캐폴드(Next.js 15·TS strict·Tailwind v4·Vitest·Playwright), `tokens.css`(↔DESIGN.md), next-intl(ko/en) 라우팅, 도구 레지스트리(ladder 엔트리), `[locale]/tools/[slug]` 라우트 + Error Boundary, 최소 홈(ladder로 링크), **사다리 엔진(공정성)·reducer·전체 게임 UI·SEO(JSON-LD)·테스트**.
- **이번 범위 밖(플랫폼 PRD 별도):** 풀 대시보드(Hero/검색/카테고리 필터/전체 그리드 상태), 실제 AdSense·동의 CMP 전 흐름, GA, 법무 페이지. → AdSlot은 **고정 높이 스텁**(CLS 보호)만, 동의/광고 실로딩은 보류로 명시.

## 계층 분해

| 계층 | 모듈/파일 | 책임 | 허용 import | 담당 |
|------|-----------|------|------------|------|
| 1 도메인 | `src/lib/ladder.ts` | 공정성 엔진(순수, 주입 RNG) | 표준 JS만 | domain |
| 1 도메인 | `src/tools/types.ts` | ToolMeta 타입·불변식 | 표준 JS만 | platform(타입)/domain(불변식 테스트) |
| 2 유스케이스 | `src/lib/ladder-reducer.ts` | phase 머신 reducer + 셀렉터(순수) | `./ladder` | domain |
| 3 어댑터 | `src/components/tools/ladder/*` | React 컴포넌트 | usecase/domain, react | ui |
| 3 어댑터 | `src/components/tools/ladder/useLadder.ts` | reducer↔React 바인딩(얇음) | ladder-reducer, react | ui |
| 3 어댑터 | `src/components/ui/*`, `src/styles/tokens.css` | 프리미티브·토큰 | react | ui |
| 3 어댑터 | `src/lib/seo.ts` | Metadata/JSON-LD 빌더 | next, registry | platform |
| 4 프레임워크 | `src/app/**`, `src/i18n/**`, `src/tools/registry.ts`, 설정 | App Router·SSG·i18n·배선 | 모든 안쪽 | platform |

**의존성 규칙:** 1·2계층(`src/lib/ladder.ts`, `src/lib/ladder-reducer.ts`, `src/tools/types.ts`)은 `react`/`next`/DOM/`crypto` 직접 import **금지**. 난수는 주입.

## 계약 (CONTRACT — 변경은 architect 승인 필요)

### 도메인 엔진 `src/lib/ladder.ts`
```ts
export type Rng = () => number;                       // [0,1) 균등
export const cryptoRng: Rng;                          // 런타임 기본(crypto.getRandomValues)
export function mulberry32(seed: number): Rng;        // 시드 PRNG (테스트/Phase2 재현)
export function uniformPermutation(n: number, rng?: Rng): number[];   // perm[startCol]=prizeIndex, Fisher–Yates
export function ladderFromPermutation(perm: number[], rng?: Rng): boolean[][]; // rungs[level][c], c∈0..n-2
export function tracePath(rungs: boolean[][], startCol: number): Array<{ col: number; level: number }>;
export function resolveAll(rungs: boolean[][], cols: number): number[]; // endCol per startCol
```
**불변식:**
- 구조: 한 레벨 내 인접 rung 동시 금지(`rungs[l][c] && rungs[l][c+1]` 불가).
- 공정성(CRITICAL): `uniformPermutation`은 균등 — 각 start→prize = 1/N, 모든 N! 동일확률. **순열 먼저, 그다음 사다리.**
- 일관성: `resolveAll(ladderFromPermutation(perm), perm.length) === perm`.

### 유스케이스 reducer `src/lib/ladder-reducer.ts`
```ts
export interface Player { id: string; name: string }   // name 공백 허용(렌더 시 fallback)
export interface Prize  { id: string; label: string }
export type LadderPhase = 'setup' | 'ready' | 'revealing' | 'done';
export interface LadderState {
  playerCount: number;            // 2..10
  players: Player[]; prizes: Prize[];
  hideResults: boolean;           // 기본 true
  soundOn: boolean;               // 기본 false
  phase: LadderPhase;
  rungs: boolean[][];
  permutation: number[];          // BUILD 시 확정
  revealed: string[];             // 공개된 playerId (직렬화 위해 배열)
  activeTrace: string | null;
}
export type LadderAction =
  | { type: 'SET_COUNT'; count: number }              // 2..10 clamp, 행 추가/삭제 시 기존 값 보존
  | { type: 'SET_PLAYER_NAME'; index: number; name: string }   // ≤12자
  | { type: 'SET_PRIZE_LABEL'; index: number; label: string }  // ≤12자
  | { type: 'TOGGLE_HIDE' } | { type: 'TOGGLE_SOUND' }
  | { type: 'BUILD'; rng?: Rng }                      // setup→ready, permutation+rungs 생성
  | { type: 'START_TRACE'; playerId: string }         // ready/revealing, activeTrace 설정(애니메이션 잠금)
  | { type: 'COMPLETE_REVEAL'; playerId: string }     // revealed에 추가, activeTrace 해제, 전원 공개 시 done
  | { type: 'REVEAL_ALL' }                            // 남은 전원 revealed
  | { type: 'RESHUFFLE'; rng?: Rng }                  // 라벨 유지, 새 rungs/perm, revealed 초기화
  | { type: 'RESET' };                                // setup 복귀(라벨 유지)
export function initLadderState(count?: number): LadderState;        // 기본 count=4
export function ladderReducer(state: LadderState, action: LadderAction): LadderState;  // 순수
export function selectMapping(state: LadderState): Record<string, string>; // playerId→prizeId
```
**규칙:** reducer는 순수(부수효과·문자열 i18n 없음). 기본 라벨("참가자 N"/"당첨")은 **렌더 시 어댑터가 i18n으로 채움** — reducer는 공백을 그대로 보관. BUILD/RESHUFFLE만 `rng` 사용(미주입 시 cryptoRng).

### 레지스트리 `src/tools/types.ts` / `registry.ts`
```ts
export type ToolCategory = 'random'|'calculator'|'text'|'converter'|'fun'|'dev';
export type AccentColor = 'coral'|'mint'|'sky'|'sun'|'grape'|'rose';
export interface ToolMeta { id:string; slug:string; category:ToolCategory; icon:string;
  accent:AccentColor; status:'live'|'coming_soon'; isNew?:boolean; isPopular?:boolean; order:number; keywords:string[]; }
// ladder: id/slug 'ladder', category 'random', icon 'ListTree', accent 'coral', status 'live', isNew/isPopular true, order 1
```

## i18n 키 네임스페이스 (`tools.ladder.*`, ko/en 동일 집합)
`title, lead, setup.count, setup.playerPlaceholder, setup.prizePlaceholder, setup.hideToggle, setup.build, defaults.player, defaults.prize[], header.reveal, panel.revealAll, panel.reshuffle, panel.reset, panel.copy, panel.sound, announce.result, howTo.*, faq[]` — 정확 목록은 ui가 사용분을 platform에 통지.

## 작업 분배 & 빌드 순서
1. **platform** — 스캐폴드(아래 "스캐폴드 사양") + 도메인 단위테스트 실행 가능 상태(Vitest). 토큰·i18n 라우팅·레지스트리·라우트 셸·최소 홈.
2. **domain** — `ladder.ts` 공정성 chi-square 테스트 **RED 먼저** → GREEN → reducer 전이 테스트. 계약을 `02_domain_ladder-contract.md`로 확정, ui/platform에 통지.
3. **ui ∥ platform(2차)** — ui: 전체 게임 컴포넌트+useLadder+토큰 사용+a11y+컴포넌트 테스트 ‖ platform: ko/en 메시지·registry·slug 분기·seo(JSON-LD).
4. **qa** — 경계 교차(엔진path↔SVG·레지스트리↔라우트↔i18n·ko/en 키)+커버리지+E2E+a11y+빌드.

## 스캐폴드 사양 (platform 1차)
- pnpm. Next.js 15(App Router, React 19), TS strict, `@/*`→`src/*`.
- Tailwind v4 + `@tailwindcss/postcss`; `src/styles/tokens.css`가 DESIGN.md 토큰을 CSS 변수로(브랜드·6액센트·shadow·radius·ease). globals에서 import.
- next-intl v3: `routing.ts`(locales ["ko","en"], defaultLocale "ko", localePrefix "always"), `request.ts`, `next.config.ts` 플러그인, `middleware.ts`. `/`→`/ko`.
- Vitest(jsdom) + @testing-library/react + coverage(v8). Playwright 설정(스크립트만, 실행은 qa).
- 폰트: next/font/local 자리(실파일 없으면 시스템 폴백 + swap, 추후 교체 주석).
- 최소 `app/layout.tsx`(html lang, tokens), `[locale]/layout.tsx`(NextIntlClientProvider), `[locale]/page.tsx`(ladder 링크 카드 1개), `[locale]/tools/[slug]/page.tsx`(generateStaticParams=live×locales, slug==='ladder'→`<LadderGame/>`, Error Boundary, 고정높이 AdSlot 스텁), `not-found.tsx`.

## 게이트 (qa 합격 기준)
도메인 ≥90%/전체 ≥80% 커버리지 · 공정성 chi-square p>0.01 & ±1% & 전 컬럼 도달 · `resolveAll===perm` · 계층 import 규칙 준수 · `pnpm build` 그린 · ko/en 키 동일 · a11y(키보드·aria-live·reduced-motion) · AdSlot 높이 예약(CLS 보호).
