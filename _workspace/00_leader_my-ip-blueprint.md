# my-ip 빌드 청사진 (리더 작성 — 계약 단일 소스)

SPEC: `docs/services/dev/my-ip/SPEC.md` (이 워크트리 내). 참조 패턴: url-encoder (동일 dev 카테고리 클라이언트 SPA).

## 현황 판정 (리더 확인 완료)
- dev 카테고리: **이미 배선됨** (url-encoder 등) — SPEC의 "미배선" 전제는 구식. 카테고리 작업 없음.
- CSP: `public/_headers`에 CSP 없음 → **CSP 도입 보류(리더 결정)**. CSP가 없으면 브라우저는 외부 fetch를 제한하지 않아 도구는 정상 동작. 전역 CSP 신설은 GA/AdSense/NAVER 지도를 깨뜨릴 위험이 커 별도 인프라 과제로 분리.
- registry: order 24까지 사용 중 → my-ip는 **order: 25**.

## 도메인 계약 (src/lib/my-ip/*) — react/next import 금지 (순수)

```ts
// schema.ts
export interface IpResult {
  ipv4: string;            // 성공 시 항상 존재 (INVARIANT)
  ipv6?: string;
  isp?: string;            // ipwho.is만
  city?: string;           // ipwho.is만, "approximate"
  provider: 'api.ipify.org' | 'ipwho.is';
  fetchedAt: number;       // epoch ms
}
export const FETCH_ERROR_CODES = ['ALL_PROVIDERS_FAILED','BLOCKED_BY_AD_BLOCKER','NETWORK_ERROR','TIMEOUT','RATE_LIMITED'] as const;
export type FetchErrorCode = (typeof FETCH_ERROR_CODES)[number];
export class IpFetchError extends Error { constructor(public code: FetchErrorCode, message?: string) }
// zod 스키마: ipifyResponseSchema({ip:string}), ipwhoResponseSchema(success 필드 포함)

// fetch.ts
export const TIMEOUT_PER_PROVIDER_MS = 5000;
export interface FetchIpDeps { fetchFn?: typeof fetch; now?: () => number; }  // 테스트 주입용
export async function fetchIp(deps?: FetchIpDeps): Promise<IpResult>;  // 실패 시 IpFetchError throw
// 체인: ipify IPv4(https://api.ipify.org?format=json) + IPv6(https://api6.ipify.org?format=json) 병렬(각 5s AbortController)
//   → IPv4 실패 시(IPv6만 성공해도 실패로 간주) ipwho.is(https://ipwho.is/) 5s
//   → 전부 실패 시 에러 매핑: offline(navigator.onLine 체크는 훅에서) / 429→RATE_LIMITED / abort→TIMEOUT
//   / TypeError(CORS/blocked)→BLOCKED_BY_AD_BLOCKER 또는 ALL_PROVIDERS_FAILED
// 주의: ipify IPv6 실패는 정상 경로(IPv6 없는 네트워크) — IPv4만 성공하면 성공.

// normalize.ts
export function normalizeIpwho(raw: unknown): Pick<IpResult,'ipv4'|'ipv6'|'isp'|'city'> | null;
// ipwho.is의 ip는 접속 스택에 따라 v4 또는 v6 — 콜론 포함이면 ipv6, 아니면 ipv4로 분류. ipv4 없으면 null(실패).
```

- **저장 금지**: localStorage 사용 금지(도메인·훅 모두). IP는 세션 내 state만.
- 테스트: vi.useFakeTimers + 주입 fetchFn 모의. 실제 네트워크 호출 금지. 커버리지 ≥90%.

## 훅 계약 (src/components/tools/my-ip/useIpFetch.ts)

```ts
export interface UseIpFetchState {
  data: IpResult | null;
  error: FetchErrorCode | null;
  loading: boolean;
  isOnline: boolean;         // navigator.onLine + online/offline 이벤트
  refresh: () => void;       // 재조회 (fetch 중이면 무시)
}
export function useIpFetch(): UseIpFetchState;
```
- mount 시 1회 fetch. 'online' 이벤트 수신 시 에러 상태면 자동 재시도.
- 비동기 결과는 로컬 변수/반환값으로 전달(stateRef 스냅샷 금지 — 하네스 교훈).
- 언마운트 후 setState 방지(취소 플래그).

## i18n 키 계약 (tools.my-ip.*) — ko/en 둘 다, 이 목록이 전부이자 유일 (지어내기 금지)

```
title                                  ko "내 아이피 찾기" / en "My IP Address"     ← 최상위 필수(검색/푸터/홈카드)
description                            ko/en 한 줄 설명                              ← 최상위 필수
meta.title / meta.description          SEO 메타 (generateMetadata 소비)
eyebrow                                ko "개발자 도구" / en "DEVELOPER TOOL"
lead                                   인트로 리드 1–2문장
display.ipv4Label / display.ipv6Label  "IPv4" / "IPv6"
display.copy / display.copied          "복사" / "복사되었습니다" (en "Copy"/"Copied!")
display.copyAria                       "IP 주소 복사" / "Copy IP address"
display.refresh                        "새로고침" / "Refresh"
display.provider                       "{provider}에서 조회됨" / "From {provider}"  ← ICU 보간
display.approximateNote                "대략적인 위치 정보 ({provider} 제공)" / en equivalent
display.ispLabel / display.cityLabel   "ISP" / "도시"(en "City")
loader.fetching                        "아이피를 조회 중입니다…" / "Fetching your IP…"
errors.ALL_PROVIDERS_FAILED            SPEC 문구
errors.BLOCKED_BY_AD_BLOCKER           SPEC 문구
errors.NETWORK_ERROR                   SPEC 문구
errors.TIMEOUT                         "요청 시간이 초과되었습니다…" / en
errors.RATE_LIMITED                    "서비스 이용량 한도에 도달했습니다…" / en
errors.retry                           "다시 시도" / "Try Again"
offline.notice                         "오프라인 상태입니다…" / en
privacy.disclosure                     "당신의 아이피는 {provider}에서 조회됩니다. {provider}는 당신의 IP를 볼 수 있습니다. 주레피는 이를 저장하거나 기록하지 않습니다." / en
howTo.title + howTo.sections (배열 아님 — url-encoder 구조 미러: howTo.steps 또는 명시 키)
  howTo.whatIsIp.title / howTo.whatIsIp.body
  howTo.ipv4VsIpv6.title / howTo.ipv4VsIpv6.body
  howTo.publicVsPrivate.title / howTo.publicVsPrivate.body
  howTo.dynamicVsStatic.title / howTo.dynamicVsStatic.body
faq.title
faq.items                              배열 [{q, a}] × 5 (q/a 스키마 — faqPageJsonLd 헬퍼 계약. question/answer 금지)
```
- 에러 키는 FetchErrorCode 값과 **동일 문자열** (`t(\`errors.${code}\`)` 보간 드리프트 방지).
- **소유: platform-engineer가 카탈로그 작성**, ui는 위 키만 소비. 추가 키 필요 시 리더 승인.

## UI 파일 (src/components/tools/my-ip/) — ui-engineer

SPEC file_structure 그대로: MyIp.tsx(오케스트레이터, "use client"), useIpFetch.ts, IpDisplay.tsx, IpLoader.tsx, IpError.tsx, OfflineNotice.tsx, PrivacyDisclosure.tsx, MyIpIntro.tsx, MyIpHowTo.tsx, MyIpFaq.tsx, MyIpStructuredData.tsx, copy-button.ts

- **Intro/HowTo/Faq/StructuredData는 서버 렌더 가능(동기 useTranslations)** — url-encoder의 UrlEncoderIntro/HowTo/Faq 미러. mounted 게이트 금지.
- **FAQPage JSON-LD는 MyIpFaq가 단일 소유**(faqPageJsonLd 헬퍼 + 가시 faq.items). MyIpStructuredData는 SoftwareApplication만(absoluteToolUrl == canonical).
- **토큰 주의(팬텀 금지)**: SPEC의 `--accent-rose-soft`, `--semantic-danger`는 **존재하지 않는 팬텀**. 실토큰: `accent-rose`(soft 배경은 `bg-accent-rose/10`), 에러는 `danger`/`danger-ink`/`bg-danger/10`(lunar ErrorMessage 미러). `surface-hover`·`*-soft`·Tailwind 기본 팔레트(gray-*, sky-*, text-white) 금지. globals.css 실토큰 grep 후 사용.
- 떠 있는/카드 레이어 max-width는 `max-w-[600px]` 명시(스케일 토큰 `max-w-md` 금지).
- 버튼 활성/비활성은 반응 상태(loading)로 게이팅(ref 게이팅 금지).
- 클립보드: 기존 도구의 copy 유틸 패턴 미러(성공 시에만 copied 표시, 실패 silent).
- 컴포넌트 테스트: 실제 ko 카탈로그로 NextIntlClientProvider 렌더 + en 렌더 1개 이상(한글 누수 `/[가-힣]/` 단언). aria-live(loading polite, error assertive) 단언.

## 플랫폼 배선 — platform-engineer

1. registry 엔트리 (SPEC key_implementation_notes 그대로, order: 25, icon 'Globe', accent 'rose', category 'dev', status 'live', isNew true).
2. `src/app/[locale]/tools/[slug]/page.tsx`: url-encoder 패턴 미러 — dynamic import MyIp, Intro/HowTo/Faq/StructuredData 게이트 밖 SSR, generateMetadata 분기(buildToolMetadata + meta.title/description).
3. i18n ko/en 카탈로그: 위 키 계약 **그대로** 작성 (문구는 SPEC 인용 + 자연스러운 카피).
4. `public/llms.txt`에 my-ip 등재 (기존 형식 미러).
5. sitemap: 레지스트리 파생 자동 (블록 추가 불필요 — 컬렉션 아님). 확인만.
6. CSP: **건드리지 않음** (리더 결정).

## E2E — qa-integration (tests/e2e/my-ip.spec.ts)

`page.route`로 api.ipify.org / api6.ipify.org / ipwho.is 모의 (실 네트워크 금지, 결정적):
1. 성공: ipify 응답 → IP 표시(rose 칩) + 복사 버튼 + provider 표기
2. 폴백: ipify abort/fail → ipwho 응답 → IP + ISP/city + "from ipwho.is"
3. 전부 실패 → 에러 메시지 + 다시 시도 → 재시도 성공
4. en 로케일 UI 영어
5. axe 접근성 + pageerror 0 하드게이트
- 콘솔 에러 단언 시 모의 실패 fetch의 브라우저 자체 네트워크 로그는 허용 필터.

## 게이트 (리더 직접 재실행)
- tsc 0 / 전체 vitest 그린 / 정적 export 빌드 그린 / 전체 E2E(기존 스펙 포함) 그린
- 프리렌더 HTML: 고유 title·JSON-LD(SoftwareApplication 1 + FAQPage 정확히 1, url==canonical)·howTo/FAQ 산문·hreflang
- 라이브: ko/en 스크린샷, 320px 무overflow, 콘솔 0, 실 IP 조회 동작
