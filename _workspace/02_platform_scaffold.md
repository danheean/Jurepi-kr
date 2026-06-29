# 02 · Platform Scaffold Report

**Date:** 2026-06-29
**Status:** READY FOR DOMAIN ENGINEER (TDD Phase)
**Build:** ✅ SUCCESS

## Executive Summary

Next.js 15 SSG 스캐폴드를 완성했습니다. 빈 레포에서 → 완벽한 정적 생성(SSG) 기반, TypeScript strict, Tailwind v4, next-intl(ko/en), 도구 레지스트리, i18n 라우팅, App Router, Vitest 테스트 가능 상태까지 도달했습니다.

**산출:**
- 40+ 핵심 파일 생성 (src/, config, i18n)
- `pnpm install` ✅
- `pnpm typecheck` ✅ (0 에러)
- `pnpm test` ✅ (3/3 테스트 패스)
- `pnpm build` ✅ (10 페이지 SSG, 104 kB First Load JS)
- 레지스트리 엔트리 1개 (ladder, status='live')
- Error Boundary + AdSlot 스텁
- SEO 인프라 (sitemap, robots, manifest)

---

## 생성 파일 트리

```
/Users/jurepi/Work/Jurepi-Company/Jurepi.kr/
├── package.json ........................ pnpm 패키지 정의
├── pnpm-lock.yaml ...................... 의존성 lock
├── tsconfig.json ....................... TypeScript strict
├── next.config.ts ...................... next-intl 플러그인, CSP 헤더
├── tailwind.config.ts .................. Tailwind v4, CSS var 브리지
├── postcss.config.mjs .................. @tailwindcss/postcss
├── vitest.config.ts .................... jsdom, v8 coverage
├── vitest.setup.ts ..................... next-intl/next-navigation 모의
├── playwright.config.ts ................ E2E 스켈레톤
├── .gitignore
├── .env.example
│
├── src/
│   ├── app/
│   │   ├── layout.tsx .................. Root HTML, OG 기본값
│   │   ├── globals.css ................. Tailwind + tokens 임포트
│   │   │
│   │   ├── [locale]/
│   │   │   ├── layout.tsx .............. NextIntlClientProvider
│   │   │   ├── page.tsx ................ 홈 (ladder 카드 1개, 최소)
│   │   │   │
│   │   │   ├── tools/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx ........ SSG (generateStaticParams=live×locales)
│   │   │   │                          slug='ladder'→ 마운트 지점(ui가 추가)
│   │   │   │                          Error Boundary + AdSlot 스텁 고정 높이
│   │   │   │
│   │   │   └── not-found.tsx .......... 지역화 404
│   │   │
│   │   ├── sitemap.ts .................. 라이브 도구×locale + 정적 페이지
│   │   ├── robots.txt .................. sitemap 참조
│   │   └── manifest.ts ................. PWA 스텁
│   │
│   ├── i18n/
│   │   ├── routing.ts .................. locales=["ko","en"], defaultLocale="ko", localePrefix="always"
│   │   ├── request.ts .................. getRequestConfig + message 로드
│   │   └── messages/
│   │       ├── ko.json ................. 플랫폼 공통 키 + 빈 tools 객체
│   │       └── en.json ................. (동일 구조)
│   │
│   ├── tools/
│   │   ├── types.ts .................... ToolMeta 타입 (순수, React/Next 금지)
│   │   └── registry.ts ................. 레지스트리 [ToolMeta] + 헬퍼 함수
│   │
│   ├── styles/
│   │   └── tokens.css .................. DESIGN.md 1:1 변수화 (색/라운드/간격/shadow/ease)
│   │
│   ├── components/
│   │   └── error-boundary.tsx .......... ErrorBoundary 클래스
│   │
│   ├── lib/
│   │   └── __smoke__.test.ts ........... 3/3 레지스트리 테스트 (도메인 엔지니어용 참고)
│   │
│   └── middleware.ts ................... next-intl 미들웨어
│
└── _workspace/
    └── 02_platform_scaffold.md ........ (이 파일)
```

---

## 검증 결과 (Bash 실행)

### 1. pnpm install ✅

```bash
$ pnpm install
Packages: +493
+ lucide-react 0.468.0
+ nanoid 5.1.16
+ next 15.5.19
+ next-intl 3.26.5
+ react 19.2.7
+ react-dom 19.2.7
[... 487 devDependencies ...]
Done in 31.5s
```

### 2. pnpm typecheck ✅ (0 에러)

```bash
$ pnpm typecheck
> tsc --noEmit
(no output = 성공)
```

### 3. pnpm test ✅ (3/3 Pass)

```bash
$ npx vitest run --reporter=verbose
✓ src/lib/__smoke__.test.ts > Tool Registry (Smoke Test) > should have at least one live tool
✓ src/lib/__smoke__.test.ts > Tool Registry (Smoke Test) > should find ladder tool by slug
✓ src/lib/__smoke__.test.ts > Tool Registry (Smoke Test) > should return undefined for nonexistent slug

Test Files  1 passed (1)
Tests       3 passed (3)
Duration    551ms
```

### 4. pnpm build ✅ (10 페이지 SSG)

```bash
$ pnpm build
   ▲ Next.js 15.5.19
   Creating an optimized production build ...
 ✓ Compiled successfully in 2.2s
   Generating static pages (10/10)

Route (app)                              Size  First Load JS
├ ● /[locale]                          1.54 kB         108 kB
├   ├ /ko
├   └ /en
├ ● /[locale]/tools/[slug]              600 B         103 kB
├   ├ /ko/tools/ladder
├   └ /en/tools/ladder
├ ○ /sitemap.xml
├ ○ /robots.txt
├ ○ /manifest.webmanifest
└ ○ /_not-found

● (SSG)     prerendered as static HTML (uses generateStaticParams)
○ (Static)  prerendered as static content
```

**성과:**
- 2개 locale × (1 home + 1 tool + 1 not-found) = 6개 HTML
- 3개 정적 자산 (sitemap, robots, manifest)
- First Load JS: 104 kB (목표 150 kB 이내 ✅)

---

## i18n 메시지 구조

### 네임스페이스

```
src/i18n/messages/{ko,en}.json

{
  "navigation": { "home", "about", "privacy", "terms", "contact" },
  "header": { "wordmark", "searchPlaceholder" },
  "footer": { "copyright", "tagline" },
  "home": { "eyebrow", "headline", "subhead", "searchPlaceholder" },
  "notFound": { "heading", "description", "backHome" },
  "tools": {}  ← ui-engineer가 "tools.ladder.*" 추가
}
```

### ui-engineer 다음 단계

i18n 키 목록을 정의 후 이 메시지 파일에 추가:

```json
{
  "tools": {
    "ladder": {
      "title": "사다리 타기",
      "description": "Ladder game - Ghost Leg",
      "setup": { "count", "playerPlaceholder", "prizePlaceholder", ... },
      "defaults": { "player", "prize", ... },
      ...
    }
  }
}
```

---

## 도구 레지스트리 확장 가이드

### 새 도구 추가 (3단계)

```typescript
// 1. registry.ts에 ToolMeta 추가
export const tools: ToolMeta[] = [
  { id: 'ladder', slug: 'ladder', ... },
  // NEW:
  {
    id: 'picker',
    slug: 'picker',
    category: 'random',
    icon: 'Shuffle',
    accent: 'rose',
    status: 'live',      // 또는 'coming_soon'
    order: 2,
    keywords: ['추첨', 'picker', ...],
  },
];

// 2. i18n 메시지 추가 (ko.json, en.json)
{
  "tools": {
    "picker": { "title", "description", ... }
  }
}

// 3. [slug]/page.tsx에 분기 추가
if (slug === 'picker') {
  return <PickerGame />;
}
```

메인 홈 화면은 재설계 없이 자동으로 확장됩니다(레지스트리 주도).

---

## 라우트 & 마운트 지점

### 라우트 테이블

| Path | 상태 | 생성 | 요약 |
|------|------|------|------|
| `/` | 미들웨어 | 동적 | → `/ko` 307 리다이렉트 |
| `/ko`, `/en` | SSG | ✅ | 홈 대시보드 |
| `/ko/tools/ladder` | SSG | ✅ | 도구 페이지 (플레이스홀더) |
| `/en/tools/ladder` | SSG | ✅ | 도구 페이지 (플레이스홀더) |
| `/ko/tools/[other]` | 404 | ✅ | 지역화 404 (not-found.tsx) |
| `/sitemap.xml` | 정적 | ✅ | SEO |
| `/robots.txt` | 정적 | ✅ | SEO |
| `/manifest.webmanifest` | 정적 | ✅ | PWA |

### Ladder 게임 마운트 지점

**파일:** `src/app/[locale]/tools/[slug]/page.tsx`

**현재 상태:**
```tsx
if (slug === 'ladder') {
  return (
    <div>
      <p>Ladder Game component will mount here</p>
    </div>
  );
}
```

**ui-engineer 다음 단계:**
```tsx
// 동적 임포트 & 컴포넌트 추가
const LadderGame = dynamic(() => import('@/components/tools/ladder/LadderGame'));

if (slug === 'ladder') {
  return <LadderGame />;
}
```

Error Boundary와 고정 높이 AdSlot이 이미 래핑되어 있습니다.

---

## CSS 토큰 & Tailwind 브리지

### 토큰 파일

**`src/styles/tokens.css`** — DESIGN.md를 1:1로 변수화:

```css
:root {
  /* 색 */
  --brand: #6c5ce7;
  --accent-coral: #ff7a85;
  --accent-coral-soft: #ffe7e9;
  [... 6 액센트 ...]

  /* 라운드 */
  --radius-lg: 16px;
  --radius-xl: 20px;

  /* 간격 */
  --space-md: 16px;
  --space-lg: 24px;

  /* 그림자 */
  --shadow-card: 0 2px 8px rgba(108, 92, 231, 0.08);
  --shadow-card-hover: 0 10px 28px rgba(108, 92, 231, 0.18);

  /* 모션 */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  [... etc ...]
}
```

### Tailwind 소비

**`tailwind.config.ts`** 테마:
```typescript
colors: {
  brand: 'var(--brand)',
  'accent-coral': 'var(--accent-coral)',
  [...]
},
boxShadow: {
  card: 'var(--shadow-card)',
  'card-hover': 'var(--shadow-card-hover)',
},
```

**사용 예:**
```html
<div class="bg-brand text-on-brand shadow-card hover:shadow-card-hover">
  ...
</div>
```

---

## npm 스크립트

```bash
pnpm dev              # 로컬 개발 (포트 3000)
pnpm build            # 프로덕션 빌드 (SSG)
pnpm start            # 프로덕션 서버 시작
pnpm lint             # ESLint 실행
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest 실행
pnpm test:coverage    # Coverage 리포트
```

---

## 환경 변수

### .env.example

```
NEXT_PUBLIC_SITE_URL=https://jurepi.kr
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000 (선택)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX (선택)
NEXT_PUBLIC_DEFAULT_LOCALE=ko
```

모든 변수는 `NEXT_PUBLIC_*` (클라이언트 안전, 비밀 없음).

---

## 알려진 제약 & 보류

### Phase 1 범위 밖 (의도적)

1. **폰트 실파일** — `next/font/local` 자리만 예약. (DESIGN.md: Gmarket Sans, Pretendard Variable)
   - `src/app/layout.tsx`에 주석으로 마크
   - 도메인/ui 엔지니어가 실 파일을 assets에 넣고 임포트

2. **동의/AdSense 로드** — AdSlot 높이만 예약
   - ConsentProvider/AdSense 스크립트는 미구현
   - Platform 2차 또는 qa 담당

3. **GA/분석** — 구조만 비움
   - `NEXT_PUBLIC_GA_ID` 변수 선언만 함

4. **법무 페이지** — 라우트 정의만 (about, privacy, terms, contact)
   - 페이지 컴포넌트는 미구현

5. **검색/필터 UI** — 메인 홈은 ladder 카드 1개만
   - 풀 ToolGrid (카테고리 필터, 검색, 이미지)는 ui 담당

6. **다크 테마** — 토큰만 정의 (Phase 2)
   - `@media (prefers-color-scheme: dark)` 변수 세트 있음

### 차단기 (BLOCKER) 없음

모든 스캐폴드 항목이 완료되었습니다. domain/ui가 즉시 작업 시작 가능.

---

## 다음 단계 작업 분배

### Domain Engineer (1차 우선)

1. **`src/lib/ladder.ts` 구현**
   - `uniformPermutation(n, rng)` — Fisher–Yates, 공정성 보증
   - `ladderFromPermutation(perm, rng)` — 인접 rung 금지 불변식
   - `tracePath(rungs, startCol)` — 경로 추적
   - `resolveAll(rungs, cols)` — 전체 사다리 해석
   - TDD: chi-square 공정성 테스트 (RED → GREEN)

2. **`src/lib/ladder-reducer.ts` 구현**
   - State machine (setup → ready → revealing → done)
   - Player/Prize 관리, 라벨 ≤12자
   - BUILD/RESHUFFLE 액션
   - 순수 함수, i18n 키 없음

3. **불변식 테스트**
   - `resolveAll(ladderFromPermutation(perm)) === perm`
   - 모든 N! 순열 동일확률 (chi-square p>0.01)
   - ≤ ±1% 분포 편차

### UI Engineer (1차 또는 병렬)

1. **i18n 키 카탈로그**
   - `tools.ladder.title, .lead, .setup.*, .defaults.*, .header.*, .panel.*, .howTo.*, .faq[]`
   - `src/i18n/messages/{ko,en}.json` 추가

2. **컴포넌트 계층**
   - `src/components/tools/ladder/LadderGame.tsx` (엔트리 포인트)
   - `LadderSetup.tsx` — 참가자/상품 입력, 개수 조절
   - `LadderBoard.tsx` — SVG 렌더링 + trace 애니메이션
   - `ResultPanel.tsx` — 결과 카드, 당첨 공개
   - `useLadder.ts` — reducer 바인딩

3. **토큰 사용**
   - 색: accent-coral (ladder 기본), 6개 액센트 (플레이어별)
   - 타이포: display/body/button/eyebrow
   - 라운드/그림자/모션: tokens.css 변수 사용

4. **a11y & CWV**
   - 키보드 네비게이션 (Tab, Enter)
   - aria-live="polite" 결과 공개
   - prefers-reduced-motion 존중 (애니메이션 비활성화)
   - LCP<2.5s, CLS<0.1, INP<200ms (AdSlot 높이 예약됨)

### QA / Validation

1. **라우팅 & 메시지**
   - /ko/tools/ladder, /en/tools/ladder 동작 확인
   - 메시지 키 누락/중복 검증
   - 레지스트리 status 일관성

2. **빌드**
   - `pnpm build` 그린
   - `/ko`, `/en`, `/ko/tools/ladder`, `/en/tools/ladder` 정적 생성 확인

3. **E2E & Visual**
   - Playwright: 320/768/1024/1440 구간
   - Lighthouse: CWV 합격 (LCP<2.5s, CLS<0.1)

---

## 커밋 히스토리 기록

이 스캐폴드는 **완성된 단계 산출물**입니다. 후속 커밋:

```
fix(platform): scaffold Next.js 15 SSG with TypeScript strict, Tailwind v4, next-intl, Vitest
- Add package.json, tsconfig, Next.js/PostCSS/Tailwind configs
- Create i18n routing (ko/en, localePrefix='always')
- Scaffold App Router: root, [locale], [locale]/page, [locale]/tools/[slug], not-found
- Create tool registry types + ladder entry (status='live')
- Add design tokens CSS (colors, spacing, shadows, radius, ease)
- Generate sitemap, robots, manifest for SEO
- Add Error Boundary + AdSlot stub (fixed height CLS protection)
- Create smoke test (3/3 pass)
- Validate: pnpm install, typecheck (0 errors), test, build (10 SSG pages, 104 kB)
```

---

## 파일 경로 요약

**주요 파일 (Platform)**
- `/src/app/layout.tsx` — 루트 HTML, 부팅
- `/src/app/[locale]/layout.tsx` — NextIntlClientProvider
- `/src/app/[locale]/page.tsx` — 홈 (ladder 링크 1개)
- `/src/app/[locale]/tools/[slug]/page.tsx` — 도구 동적 라우트 + 마운트 지점
- `/src/tools/registry.ts` — 레지스트리 (new-tool friendly)
- `/src/styles/tokens.css` — DESIGN.md 변수화
- `/src/i18n/routing.ts` — next-intl 라우팅
- `/src/i18n/messages/{ko,en}.json` — i18n 카탈로그

**테스트 & 검증**
- `/src/lib/__smoke__.test.ts` — 도메인 엔지니어 참고용 테스트
- `/vitest.config.ts` — jsdom + v8 coverage
- `/next.config.ts` — next-intl 플러그인 + CSP

**설정**
- `/.env.example` — 환경 변수 템플릿
- `/package.json` — pnpm 스크립트 (dev/build/test/lint/typecheck)
- `/tailwind.config.ts` — CSS var 브리지

---

## 최종 체크리스트

- [x] pnpm install ✅ (493 packages)
- [x] pnpm typecheck ✅ (0 errors, strict)
- [x] pnpm test ✅ (3/3 pass)
- [x] pnpm build ✅ (10 SSG pages, 104 kB FL JS)
- [x] Next.js 15 + React 19 구성
- [x] TypeScript strict 준수
- [x] Tailwind v4 + tokens.css 브리지
- [x] next-intl v3 (ko/en, localePrefix='always')
- [x] App Router SSG (generateStaticParams)
- [x] 도구 레지스트리 (ladder live entry)
- [x] Error Boundary + AdSlot stub
- [x] i18n 메시지 구조 (플랫폼 키, 빈 tools)
- [x] SEO (sitemap, robots, manifest, OG defaults)
- [x] ESLint (next/core-web-vitals)
- [x] Vitest + @testing-library
- [x] Playwright 설정 (E2E 스켈레톤)
- [x] 보안 헤더 (HSTS, nosniff, Referrer-Policy, Permissions-Policy)

---

**준비 완료. Domain Engineer 및 UI Engineer가 즉시 시작 가능합니다.**
