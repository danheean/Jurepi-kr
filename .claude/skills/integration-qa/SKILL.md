---
name: integration-qa
description: Jurepi의 통합 정합성을 경계면 교차 비교로 검증하는 방법. 계층 계약 일치(도메인 출력↔UI 소비, 레지스트리↔라우트↔메시지 키, SVG trace↔엔진 path), 공정성 회귀, Vitest 커버리지, Playwright E2E, axe 접근성, Lighthouse CWV, 시각 회귀. 모듈 완성 직후·통합 시점에 품질을 점진 검증할 때 반드시 사용.
---

# Integration QA — 경계면 교차 비교 검증

대부분의 버그는 한 계층 *안*이 아니라 계층 *사이*에 산다. 각 모듈은 단독으로 그린이어도, 계약이 어긋나면 제품은 깨진다. 이 스킬은 그 틈을 *실행으로* 찾는다.

## 두 가지 핵심 습관

1. **존재 확인 ❌ → 경계면 교차 비교 ✅.** "파일/함수가 있다"가 아니라 "A가 내보내는 shape과 B가 소비하는 shape이 같은가"를 **양쪽을 동시에 읽어** 비교한다.
2. **점진적 QA.** 전체 완성 후 한 번이 아니라, **각 모듈/계층 완성 직후** 검증한다. 틈을 일찍 닫는다.

## Jurepi 경계면 매트릭스 (교차 비교 대상)

| 경계 | A 쪽 | B 쪽 | 무엇을 비교 |
|------|------|------|-------------|
| 도메인↔UI | `_workspace/*_domain_*-contract.md` 시그니처 | 컴포넌트/훅 실제 호출 | 인자·반환 타입·널 가능성 일치 |
| 엔진↔보드 | `resolveAll(rungs)` / `tracePath` 출력 | `LadderBoard` SVG가 그리는 경로 끝점 | 화면 경로가 공정 결과와 정확히 일치 |
| 레지스트리↔라우트 | `tools.filter(live)` | `generateStaticParams` 생성 경로 | 모든 live slug에 페이지, coming_soon은 라우트 없음 |
| 레지스트리↔i18n | ToolMeta `id` 집합 | `tools.<id>.*` 메시지 키 | 모든 live 도구에 ko/en 카피 존재 |
| i18n ko↔en | `messages/ko.json` 키 | `messages/en.json` 키 | 키 집합 동일(누락/오타 없음), 코드 참조 키 양쪽 존재 |
| 동의↔광고 | `shouldLoadAds(consent)` 판정 | AdSlot/AdSense 실제 로딩 | 거부 시 스크립트 없음 + 높이 예약 유지 |

> 상세 점검 절차와 재현 명령은 `references/boundary-checks.md`를 읽어라.

## 검증 차원과 도구

```
1. 계약 정합성   — 위 매트릭스, 정적 grep + 타입체크(tsc --noEmit)
2. 공정성 회귀   — domain 테스트 재실행(chi-square, 전 컬럼 도달, resolveAll===perm)
3. 단위/커버리지 — vitest run --coverage  (전체 ≥80%, 도메인 ≥90%)
4. E2E          — playwright test  (PRD final_integration_test 시나리오)
5. 접근성        — axe + 키보드 + reduced-motion + 색대비
6. 성능(CWV)     — Lighthouse: LCP/CLS/INP/FCP/TBT 목표 이내, 광고 슬롯 CLS<0.1
7. 시각 회귀     — Playwright 스크린샷 320/375/768/1024/1440, 라이트(+다크)
```

## 커버리지·테스트 하드 게이트 (절대 놓치지 말 것)

이 두 가지는 "주장 vs 증명"이 갈라지는 지점이라 **명시적 차단 체크**로 다룬다. 도메인 커버리지만 보고 "통과"라고 말하지 마라 — 게이트는 **전체(All files)** 기준이다.

1. **전체 커버리지를 직접 측정해 수치를 붙여라.** `pnpm test:coverage`의 **All files 행**(statements)이 ≥80%인지 확인하고 그 수치를 리포트에 텍스트로 인용한다. 도메인 한 줄만 인용하는 것은 false PASS다.
2. **UI 테스트 존재 확인.** `find src/components -name '*.test.tsx' | wc -l`이 0이면 → **HIGH(차단)**. 컴포넌트가 있는데 컴포넌트 테스트가 0이면 커버리지 게이트는 거의 항상 미달이다.
3. **테스트 스크립트가 watch가 아닌지.** `pnpm test`가 `vitest run`인지 확인(`vitest`만이면 비-TTY에서 hang). 전체 suite가 2분 내 exit 0인지 직접 실행으로 확인.
4. **커버리지 스코프 오염 점검.** All files에 `.next/`·config·vendor가 섞이면 수치가 무의미하게 낮아진다 → `vitest.config.ts` coverage `include: ['src/**']` + 프레임워크 엔트리포인트 제외인지 확인.

이 중 하나라도 측정 없이 "통과" 선언하면 그것이 곧 거짓 통과다.

## 심각도 분류

| 등급 | 의미 | 행동 |
|------|------|------|
| CRITICAL | 공정성 깨짐, 계약/데이터 불일치, CLS 초과, 빌드 실패 | **차단** — 진행 전 수정 |
| HIGH | 기능 버그, 접근성 위반, CWV 초과 | 합류 전 수정 권고 |
| MEDIUM | 유지보수성/일관성 | 가능하면 수정 |
| LOW | 스타일/사소 | 선택 |

## 보고 규율

- 발견은 **재현 명령 + 기대 vs 실제**를 항상 함께. 엔지니어가 바로 고칠 수 있게.
- 검증 못 한 항목은 "미검증"으로 명시 — 침묵 누락 금지(거짓 통과 만들지 말 것).
- 경계 불일치는 **양쪽 당사자 모두**에게 통지(누가 고칠지 분명히).
- CRITICAL/HIGH는 즉시 해당 엔지니어 + 리더에게.

## 흔한 함정

- 한 계층만 보고 "통과" 선언 → 경계는 *두 쪽을 같이* 봐야 보인다.
- `waitForTimeout` 기반 E2E → 플레이크. 결정적 대기.
- 공정성 테스트를 느리다고 건너뜀 → CRITICAL 회귀 놓침. 항상 재확인.
- ko/en 키를 눈으로만 대조 → 스크립트로 집합 차이를 뽑아라.
- 반복 검증 코드를 매번 재작성 → `references/boundary-checks.md`의 스니펫을 재사용하고, 반복되면 scripts/로 번들 제안.
