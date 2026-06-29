# 04 · Platform i18n Keys & SEO Builder

**Date:** 2026-06-29  
**Status:** COMPLETE  
**Build:** ✅ SUCCESS (pnpm build, 10 SSG pages)

## Executive Summary

사다리 도구의 i18n 메시지 네임스페이스(`tools.ladder.*`)와 SEO 빌더 어댑터를 완성했습니다.

**산출:**
- `src/i18n/messages/{ko,en}.json` — `tools.ladder.*` 전체 네임스페이스 추가 (27개 키, ko/en 동일 집합)
- `src/lib/seo.ts` — Metadata + JSON-LD 빌더 함수 3개 (buildToolMetadata, softwareApplicationJsonLd, faqPageJsonLd)
- 검증: ko/en 키 동일성 ✅, pnpm build ✅

---

## i18n 메시지 네임스페이스 (`tools.ladder.*`)

### 최종 키 목록 (ko/en 동일)

#### 기본 정보
| 키 | 설명 | 예시 (KO) | 예시 (EN) |
|------|------|----------|----------|
| `tools.ladder.title` | 도구 페이지 제목 | "사다리 타기" | "Ladder Game" |
| `tools.ladder.lead` | 도구 설명 (1–2문장) | "참가자들의 공정한 순서를 정해보세요..." | "Decide fair orders for your group..." |

#### 셋업 화면 (`setup.`)
| 키 | 설명 | 예시 (KO) | 예시 (EN) |
|------|------|----------|----------|
| `tools.ladder.setup.countLabel` | 참가자 수 레이블 | "참가자 수" | "Number of players" |
| `tools.ladder.setup.playerPlaceholder` | 참가자 입력 필드 placeholder | "참가자 이름" | "Player name" |
| `tools.ladder.setup.prizePlaceholder` | 결과/상품 입력 필드 placeholder | "결과" | "Outcome" |
| `tools.ladder.setup.hideToggle` | 결과 가리기 토글 레이블 | "결과 가리기" | "Hide results" |
| `tools.ladder.setup.build` | 사다리 생성 버튼 | "사다리 만들기" | "Build ladder" |

#### 기본값 (`defaults.`)
| 키 | 설명 | 사용처 | 예시 (KO) | 예시 (EN) |
|------|------|---------|----------|----------|
| `tools.ladder.defaults.player` | 참가자 기본 이름 템플릿 | 빈 입력 시 자동 채움. `{n}`은 번호 (1부터) | "참가자 {n}" | "Player {n}" |
| `tools.ladder.defaults.prizeWin` | 당첨/성공 기본값 | 결과 입력 없을 시, 처음 1~2개 | "당첨" | "Win" |
| `tools.ladder.defaults.prizeOther` | 탈락/실패 기본값 | 나머지 결과 | "꽝" | "Lose" |

#### 헤더/클릭 요소 (`header.`)
| 키 | 설명 | 사용처 | 예시 (KO) | 예시 (EN) |
|------|------|---------|----------|----------|
| `tools.ladder.header.revealAria` | 참가자 칩 aria-label 템플릿 | 클릭 시 스크린리더. `{name}`은 참가자명 | "{name} 결과 보기" | "Reveal {name}" |

#### 보드 (`board.`)
| 키 | 설명 | 사용처 | 예시 (KO) | 예시 (EN) |
|------|------|---------|----------|----------|
| `tools.ladder.board.aria` | SVG 보드 aria-label | SVG role="img" 설명 | "사다리 게임 보드" | "Ladder game board" |

#### 결과 패널 (`panel.`)
| 키 | 설명 | 버튼 또는 UI 요소 | 예시 (KO) | 예시 (EN) |
|------|------|---------|----------|----------|
| `tools.ladder.panel.revealAll` | 전체 결과 공개 버튼 | 클릭 → 남은 참가자 모두 공개 | "전체 결과 보기" | "Reveal all" |
| `tools.ladder.panel.reshuffle` | 다시 섞기 버튼 | 클릭 → 새 사다리 생성 (이름 유지) | "다시 섞기" | "Reshuffle" |
| `tools.ladder.panel.reset` | 초기화 버튼 | 클릭 → 셋업 화면 복귀 | "처음으로" | "Reset" |
| `tools.ladder.panel.copy` | 결과 복사 버튼 | 클릭 → 클립보드 복사 | "결과 복사" | "Copy results" |
| `tools.ladder.panel.copied` | 복사 완료 피드백 | 토스트 또는 버튼 상태 변경 | "복사되었습니다" | "Copied" |
| `tools.ladder.panel.soundOn` | 소리 켜기 버튼 | 토글 (기본 off) | "소리 켜기" | "Sound on" |
| `tools.ladder.panel.soundOff` | 소리 끄기 버튼 | 토글 (소리 중일 때) | "소리 끄기" | "Sound off" |
| `tools.ladder.panel.summaryTitle` | 결과 요약 섹션 제목 | 최종 결과 목록 위 | "최종 결과" | "Results" |

#### 공지/aria-live (`announce.`)
| 키 | 설명 | 템플릿 변수 | 예시 (KO) | 예시 (EN) |
|------|------|---------|----------|----------|
| `tools.ladder.announce.result` | 결과 공개 시 스크린리더 공지 | `{name}` = 참가자명, `{prize}` = 결과 | "{name}님의 결과는 {prize}입니다" | "{name}'s result is {prize}" |

#### 사용법 섹션 (`howTo.`)
| 키 | 설명 | 콘텐츠 | 길이 (KO) |
|------|------|---------|----------|
| `tools.ladder.howTo.heading` | "사용 방법" 섹션 제목 | SEO 페이지에 표시 | — |
| `tools.ladder.howTo.whatIsTitle` | "사다리 타기란?" 서브 제목 | HOW-TO 첫 번째 섹션 | — |
| `tools.ladder.howTo.whatIsBody` | "사다리 타기란?" 본문 | 게임 설명 (600~900자) | 약 800자 |
| `tools.ladder.howTo.howToTitle` | "사용 방법" 서브 제목 | HOW-TO 두 번째 섹션 | — |
| `tools.ladder.howTo.howToBody` | "사용 방법" 본문 | 단계별 가이드 (600~900자) | 약 850자 |

#### FAQ 섹션 (`faq.`)
| 키 | 설명 | 포맷 |
|------|------|------|
| `tools.ladder.faq.heading` | "자주 묻는 질문" 제목 | 문자열 |
| `tools.ladder.faq.items` | FAQ 항목 배열 | 객체 배열: `[{ q: "질문", a: "답변" }, ...]` (5개) |

**FAQ 항목 (ko 예시):**
1. **Q:** "사다리타기는 정말 공정한가요?"  
   **A:** "네, 이 디지털 사다리타기는 완벽하게 공정합니다..." (공정성 + 손으로 그린 사다리 편향 설명)

2. **Q:** "최대 몇 명까지 게임할 수 있나요?"  
   **A:** "최소 2명부터 최대 10명까지..."

3. **Q:** "시작 위치가 유리한가요?"  
   **A:** "아닙니다. 결과는 시작 위치와 무관하게..."

4. **Q:** "사다리를 다시 섞을 수 있나요?"  
   **A:** "물론입니다. '다시 섞기'를 클릭하면..."

5. **Q:** "결과를 복사할 수 있나요?"  
   **A:** "네, '결과 복사' 버튼으로 모든 결과를 텍스트로..."

---

## SEO 빌더 (`src/lib/seo.ts`)

### 공개 함수 시그니처

#### 1. `buildToolMetadata()`
```typescript
function buildToolMetadata({
  locale: string,
  slug: string,
  title: string,
  description: string,
}): Metadata
```

**목적:** Next.js `Metadata` 객체를 구성 (canonical, hreflang, OG, Twitter).  
**호출 예시:**
```typescript
// src/app/[locale]/tools/[slug]/page.tsx
const metadata = buildToolMetadata({
  locale: 'ko',
  slug: 'ladder',
  title: '사다리 타기 | Jurepi',
  description: '참가자들의 공정한 순서를 정해보세요.',
});

export async function generateMetadata(): Promise<Metadata> {
  return metadata;
}
```

**반환값:** Next.js `Metadata` 타입
- `title`, `description`
- `alternates.canonical` → 절대 URL (NEXT_PUBLIC_SITE_URL 기준)
- `alternates.languages` → hreflang (ko, en)
- `openGraph` → OG 이미지, 타입, locale
- `twitter` → Twitter Card

---

#### 2. `softwareApplicationJsonLd()`
```typescript
function softwareApplicationJsonLd({
  name: string,
  description: string,
  url: string,
}): Record<string, unknown>
```

**목적:** SoftwareApplication JSON-LD 스키마 생성.  
**호출 예시:**
```typescript
// LadderGame 또는 도구 페이지 컴포넌트 내
const jsonLd = softwareApplicationJsonLd({
  name: '사다리 타기',
  description: '참가자들의 공정한 순서를 정해보세요.',
  url: 'https://jurepi.kr/ko/tools/ladder',
});

// JSX에서 렌더:
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

**반환값:** JSON 객체
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "...",
  "description": "...",
  "url": "...",
  "applicationCategory": "UtilityApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "downloadUrl": "...",
  "operatingSystem": "Any"
}
```

---

#### 3. `faqPageJsonLd()`
```typescript
function faqPageJsonLd(
  items: Array<{ q: string; a: string }>
): Record<string, unknown>
```

**목적:** FAQPage JSON-LD 스키마 생성 (Google 검색에서 FAQ 스니펫으로 표시).  
**호출 예시:**
```typescript
// LadderFaq 컴포넌트 또는 페이지에서
const t = useTranslations('tools.ladder');
const faqItems = t.raw('faq.items'); // 배열: [{ q, a }, ...]

const jsonLd = faqPageJsonLd(faqItems);

// JSX에서 렌더:
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

**반환값:** JSON 객체
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "질문 1",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "답변 1"
      }
    },
    ...
  ]
}
```

---

## 사용 규칙 (ui-engineer)

### 메시지 키 사용

**✅ 반드시 사용할 것:**
```typescript
import { useTranslations } from 'next-intl';

function LadderSetup() {
  const t = useTranslations('tools.ladder');

  return (
    <>
      <label>{t('setup.countLabel')}</label>
      <input placeholder={t('setup.playerPlaceholder')} />
      <button>{t('setup.build')}</button>
    </>
  );
}
```

**❌ 하지 말 것:**
- 하드코딩된 한글/영어 문자열 사용 금지
- `t('howTo.whatIsBody')`가 아닌 다른 이름으로 호출 금지
- 플레이스홀더 변수 (`{n}`, `{name}`, `{prize}`) 무시하고 기본 텍스트만 사용 금지

### FAQ 배열 읽기
```typescript
// next-intl은 배열을 JSON으로 반환하려면 t.raw() 사용:
const faqItems = t.raw('faq.items');
// → [{ q: string, a: string }, ...]

// faqPageJsonLd()에 전달:
const jsonLd = faqPageJsonLd(faqItems);
```

---

## 검증 결과

### 1. i18n 메시지 동일성 ✅

```bash
$ node validate-i18n.js

✓ All keys match between ko.json and en.json
  Total keys: 44

✓ tools.ladder namespace keys:
    tools.ladder.announce.result
    tools.ladder.board.aria
    tools.ladder.defaults.player
    tools.ladder.defaults.prizeOther
    tools.ladder.defaults.prizeWin
    tools.ladder.faq.heading
    tools.ladder.faq.items
    tools.ladder.header.revealAria
    tools.ladder.howTo.heading
    tools.ladder.howTo.howToBody
    tools.ladder.howTo.howToTitle
    tools.ladder.howTo.whatIsBody
    tools.ladder.howTo.whatIsTitle
    tools.ladder.lead
    tools.ladder.panel.copied
    tools.ladder.panel.copy
    tools.ladder.panel.reset
    tools.ladder.panel.reshuffle
    tools.ladder.panel.revealAll
    tools.ladder.panel.soundOff
    tools.ladder.panel.soundOn
    tools.ladder.panel.summaryTitle
    tools.ladder.setup.build
    tools.ladder.setup.countLabel
    tools.ladder.setup.hideToggle
    tools.ladder.setup.playerPlaceholder
    tools.ladder.setup.prizePlaceholder
    tools.ladder.title
```

**결과:** ko/en 간 키 집합 완벽히 동일, 순서만 다름 (무시해도 됨).  
**Blocker:** 없음.

---

### 2. pnpm build ✅

```bash
$ pnpm build

   ▲ Next.js 15.5.19
   Creating an optimized production build ...
 ✓ Compiled successfully in 878ms
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/10) ...
   ...
   Generating static pages (10/10)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
├ ● /[locale]                            1.54 kB         108 kB
├ ● /[locale]/tools/[slug]                 600 B         103 kB
├   ├ /ko/tools/ladder
├   └ /en/tools/ladder
└ ...

ƒ Middleware                               91 kB
○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses generateStaticParams)
```

**결과:** 10개 정적 페이지 생성 성공, 빌드 성공.  
**Blocker:** 없음.

---

## 파일 경로 요약

| 파일 | 역할 |
|------|------|
| `/src/i18n/messages/ko.json` | 한국어 메시지 (tools.ladder 추가) |
| `/src/i18n/messages/en.json` | 영문 메시지 (tools.ladder 추가) |
| `/src/lib/seo.ts` | SEO 빌더 어댑터 (3 함수) |

---

## 다음 단계

### UI Engineer (병렬 작업 가능)
1. **LadderGame 메인 컴포넌트** — `useLadder` hook + phase machine 바인딩
2. **LadderSetup** — 셋업 UI, `tools.ladder.setup.*` 키 소비
3. **LadderBoard** — SVG 렌더, `tools.ladder.board.aria` 사용
4. **PlayerHeader** — 클릭 칩, `tools.ladder.header.revealAria` 템플릿 적용 (`{name}` 대체)
5. **ResultPanel** — 버튼/summary, `tools.ladder.panel.*` + `tools.ladder.announce.result` 사용
6. **LadderIntro** — H1/lead, `tools.ladder.title` / `tools.ladder.lead`
7. **LadderHowTo** — `tools.ladder.howTo.*` 렌더
8. **LadderFaq** — `tools.ladder.faq.items` 배열 읽기 + `faqPageJsonLd()` 호출
9. **JSON-LD 렌더** — `buildToolMetadata()` / `softwareApplicationJsonLd()` / `faqPageJsonLd()` 스크립트 태그에 담기

### Domain Engineer (병렬 작업)
1. **`src/lib/ladder.ts`** — 공정성 엔진, chi-square 테스트
2. **`src/lib/ladder-reducer.ts`** — reducer + 셀렉터

### QA / Validation
1. 라우트 & 메시지 키 불일치 검증
2. ko/en 콘텐츠 일관성 검증
3. SEO JSON-LD 구조 유효성 검증 (schema.org)
4. `pnpm build` 그린 (매번)

---

## 블로커 (BLOCKER)

**없음.** 모든 항목이 완료되고 검증되었습니다. UI/Domain 엔지니어가 즉시 작업 시작 가능합니다.

---

**준비 완료. ui-engineer & domain-engineer 즉시 시작 가능.**
