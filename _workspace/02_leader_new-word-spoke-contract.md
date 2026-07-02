# New Word 허브+스포크 리팩터링 — 계약 (단일 소스)

리더가 architect 겸 확정. 모든 에이전트는 이 파일을 준수한다. 작업 트리: `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr` (메인, 형제 워크트리 아님).

## 목표

new-word를 **허브 + 스포크**로. 허브(`/tools/new-word`, 기존 SPA)는 유지. 각 용어를 정적 스포크 페이지
`/{locale}/tools/new-word/{termSlug}`로 분리. 스포크 = 고유 메타/canonical/hreflang + **게이트 밖 SSR 본문**
(정의·예문·origin·마크다운 본문) + DefinedTerm+BreadcrumbList JSON-LD + 허브↔스포크 내부 링크.
원칙 소스: `.claude/skills/seo-geo-optimization/SKILL.md`의 "허브 + 스포크" 절.

- 용어 16개 × ko/en = **32 스포크 페이지**. 카탈로그: `src/components/tools/new-word/data/terms.generated.json`.
- 용어 조회: `byId(catalog, slug)` (무상태, `src/lib/new-word/catalog.ts`) — 이미 존재.
- 라우트 우선순위: 정적 세그먼트 `new-word/`는 `[slug]`보다 우선. `/tools/new-word`(page 없음)는 여전히
  `[slug]`(허브)로, `/tools/new-word/god-saeng`은 새 `new-word/[term]`로 해석 — **충돌 없음**.

## 계약 A — seo.ts 헬퍼 (owner: platform-engineer)

`src/lib/seo.ts`에 추가(+ 단위 테스트 `seo.test.ts` 있으면 확장, 없으면 신설):

```ts
// 엔티티(스포크) 절대 URL — canonical/JSON-LD/sitemap 단일 소스
export function absoluteEntityUrl(locale: string, toolSlug: string, entitySlug: string): string
  // → `${siteUrl}/${locale}/tools/${toolSlug}/${entitySlug}`  (siteUrl = NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr')

// 스포크 메타 (buildToolMetadata 미러: canonical + languages ko/en + OG + twitter)
export function buildToolEntityMetadata({ locale, toolSlug, entitySlug, title, description }): Metadata
  // canonical/languages/og.url 모두 absoluteEntityUrl 사용. og.type 'article'.

// 단일 DefinedTerm
export function definedTermJsonLd({ name, description, url, inDefinedTermSetUrl }): Record<string, unknown>
  // @type DefinedTerm, name, description, url, inDefinedTermSet: { '@id': inDefinedTermSetUrl }

// BreadcrumbList
export function breadcrumbListJsonLd(items: Array<{ name: string; url: string }>): Record<string, unknown>
  // itemListElement: position(1-base)/name/item(url)
```

- 기존 `buildToolMetadata`/`absoluteToolUrl`/`definedTermSetJsonLd`는 손대지 말 것(회귀 금지).
- URL 하드코딩 금지 — 전부 `absoluteEntityUrl`.

## 계약 B — 스포크 라우트 (owner: platform-engineer)

새 파일 `src/app/[locale]/tools/new-word/[term]/page.tsx` — **서버 컴포넌트**.

```
import CATALOG from terms.generated.json; byId from catalog

generateStaticParams(): [ko,en] × CATALOG.slug → [{locale, term: slug}]   // 32개
generateMetadata({params}): const {locale, term} = await params;
   const item = byId(CATALOG, term); if(!item) return {};
   const t = await getTranslations({locale, namespace:'tools.new-word'});
   const name = item[locale].term;
   const title = `${name} ${t('spoke.metaTitleSuffix')}`;          // ko: "…뜻과 예문", en: "… meaning & examples"
   const description = markdownToPlainText(item[locale].definition).slice(0,150);
   return buildToolEntityMetadata({locale, toolSlug:'new-word', entitySlug:term, title, description});

default export ToolPage({params}): setRequestLocale(locale);
   const item = byId(CATALOG, term); if(!item) notFound();
   레이아웃 셸: [slug]/page.tsx와 동일한 컨테이너(`bg-background` > `mx-auto max-w-container px-6 py-16`).
   JSON-LD(서버, seo 헬퍼로): definedTermJsonLd({ name:item[locale].term,
       description: markdownToPlainText(item[locale].definition), url: absoluteEntityUrl(locale,'new-word',term),
       inDefinedTermSetUrl: absoluteToolUrl(locale,'new-word') }) + breadcrumbListJsonLd([
         {name:t('spoke.breadcrumbHome'), url:`${siteUrl}/${locale}`},
         {name:t('intro.title'),          url: absoluteToolUrl(locale,'new-word')},
         {name:item[locale].term,         url: absoluteEntityUrl(locale,'new-word',term)} ])
     → 각각 <script type="application/ld+json"> (dangerouslySetInnerHTML, JSON.stringify)
   본문: <NewWordSpoke term={item} locale={locale} catalog={CATALOG} />   // 계약 C
```

- `getTranslations`(비동기, 서버)로 라벨. **`mounted` 게이트 절대 금지** — 전부 프리렌더 HTML에.
- 사이트맵: `src/app/sitemap.ts`에 new-word 32개 스포크 URL 추가(absoluteEntityUrl, ko+en). 기존 도구/허브 항목 유지.

## 계약 C — 스포크 본문 컴포넌트 (owner: ui-engineer)

새 파일 `src/components/tools/new-word/NewWordSpoke.tsx` — **서버 컴포넌트(‘use client’ 없음)**.
props: `{ term: MergedTerm; locale: 'ko'|'en'; catalog: MergedTerm[] }`. `useTranslations('tools.new-word')`(동기, 서버 렌더 가능) 사용.

렌더(순서):
1. **Breadcrumb `<nav aria-label>`**: 홈(`/{locale}`) › 신조어 사전(`/{locale}/tools/new-word`, 라벨 `t('intro.title')`) › `{term[locale].term}`(현재, 링크 아님). 링크는 next-intl `Link` 또는 `<a href="/{locale}/...">`(로케일 프리픽스 필수).
2. **H1** `{term[locale].term}` + reading(있으면).
3. **정의**(answer-first): 라벨 `t('detail.definition')` + `{term[locale].definition}` — 첫 문단, 눈에 띄게.
4. **예문**: 라벨 `t('detail.examples')` + `<ul>`.
5. **origin**(있으면): 라벨 `t('detail.origin')`.
6. **본문**: `import { Markdown } from '@/components/markdown'; <Markdown>{term[locale].body}</Markdown>`(본문 trim 있을 때만). Markdown은 'use client'지만 서버 컴포넌트 자식으로 SSR됨 — 프리렌더 HTML에 포함. OK.
7. **메타 칩**: topic(대문자)/tone(toneEmoji+`t('tone.*')`)/coinedYear/tags — TermDetail 스타일 재사용.
8. **관련 용어**: `term.related` 중 `byId`로 존재하는 것만 → **스포크 링크** `<a href="/{locale}/tools/new-word/{relatedSlug}">{related[locale].term}</a>`. 라벨 `t('spoke.relatedHeading')`.
9. **허브로 돌아가기**: `<a href="/{locale}/tools/new-word">{t('spoke.backToHub')}</a>`.

- **게이트 없음**. 인터랙션(복사/언어토글) 불필요 — 스포크는 로케일 고정 콘텐츠 페이지(hreflang로 ko↔en 연결).
- 디자인: DESIGN 토큰만, TermDetail 기존 클래스 재사용. a11y: 랜드마크·heading 위계·링크 텍스트.

## 계약 D — 허브 내부 링크 (owner: ui-engineer)

`src/components/tools/new-word/TermCard.tsx` 수정: 카드 루트를 **크롤 가능한 앵커**로.
- 루트 `<a href="/{locale}/tools/new-word/{slug}">` (로케일 프리픽스 필수, 프리렌더 HTML에 존재).
- JS 활성 시 SPA 패널 유지: `onClick`에서 (수식키/새탭 아니면) `e.preventDefault()` → 기존 `onSelect(slug)` 호출.
  → 크롤러/무JS = 스포크로 내비게이트, 사람 = 기존 패널 UX. (progressive enhancement)
- **즐겨찾기 버튼은 앵커 밖으로**(button-in-anchor 무효 HTML 금지): 앵커 형제로 `position:absolute` 배치 or 카드 래퍼 구조 조정.
- 기존 `data-testid`·선택 하이라이트·키보드 접근성 유지. currentLocale prop 필요하면 TermList→TermCard로 전달(이미 있음).

## 계약 E — i18n 키 (owner: ui-engineer, **ko.json·en.json 양쪽 동시 추가**)

`tools.new-word`에 신규 키만 추가(기존 `detail.*`·`tone.*`·`intro.*`는 재사용, 신규 생성 금지):

| 키 | ko | en |
|----|----|----|
| `spoke.metaTitleSuffix` | `뜻과 예문 \| Jurepi` | `— meaning & examples \| Jurepi` |
| `spoke.breadcrumbHome` | `홈` | `Home` |
| `spoke.relatedHeading` | `관련 용어` | `Related terms` |
| `spoke.backToHub` | `← 전체 용어 보기` | `← Browse all terms` |

- 라이더가 병합 후 `t()` 키를 ko/en 카탈로그와 diff한다(드리프트 방지). 컴포넌트 테스트는 **실제 메시지 카탈로그**로 NextIntlClientProvider 렌더(모의 금지).

## 테스트 (TDD) 및 게이트

- **platform**: seo 헬퍼 단위 테스트(URL 조립·JSON-LD 형태). 라우트는 generateStaticParams가 32개 반환.
- **ui**: NewWordSpoke 컴포넌트 테스트(정의·예문·본문·breadcrumb·관련 스포크 링크 href·back 링크; 실 카탈로그·실 메시지). TermCard 앵커 href·onClick preventDefault·즐겨찾기 버튼 앵커 밖.
- **qa (리더 재실행)**: `pnpm test`(전체, 0 failed) · `pnpm build`(정적 export 그린, 32 신규 페이지 생성) · 전체 E2E(선존 회귀 0) · 신규 E2E: 스포크 렌더/breadcrumb/back-link/허브 카드 href→스포크. **프리렌더 HTML 증거**: `out/ko/tools/new-word/god-saeng.html`(또는 serve+curl)에서 `<h1>`·정의·`application/ld+json`(DefinedTerm+BreadcrumbList, url==canonical)·`<link rel=canonical>`·`hrefLang` grep. 허브 `out/ko/tools/new-word.html`에 스포크 `<a href>` 존재.
- **비타협**: 스포크 콘텐츠·JSON-LD·메타가 `mounted` 게이트 밖 SSR. url 단일 소스=absoluteEntityUrl. i18n 드리프트 0.
