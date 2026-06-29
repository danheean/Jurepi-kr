# 오케스트레이션 실행 상세 (팀 생성·전달·에러)

> `jurepi-build` 오케스트레이터의 부속 참조. 에이전트 팀을 실제로 띄우고 조율하는 메커니즘.

## 목차
1. 팀 생성과 작업 할당
2. 병렬 구현 조율
3. Phase 간 팀 재구성
4. 데이터 전달 전략(조합)
5. 에러 핸들링 전략표
6. 모델·호출 규약

---

## 1. 팀 생성과 작업 할당

리더는 `TeamCreate`로 팀을 만들고 `TaskCreate`로 의존 관계를 가진 작업을 등록한다. 팀원은 모두 `model: "opus"`.

```
TeamCreate(team_name: "jurepi-build", members: [
  architect, domain-engineer, ui-engineer, platform-engineer, qa-integration
])
TaskCreate(설계)        → architect
TaskCreate(도메인)      → domain-engineer   depends_on: 설계
TaskCreate(UI)          → ui-engineer        depends_on: 도메인(계약)
TaskCreate(플랫폼)      → platform-engineer  depends_on: 도메인(계약)
TaskCreate(점진 QA)     → qa-integration     depends_on: 각 모듈
TaskCreate(통합 QA)     → qa-integration     depends_on: UI+플랫폼
```

세션당 활성 팀은 하나다. 작업 규모가 작으면 일부 멤버만 등록한다(예: coming_soon 도구는 architect·platform·qa만).

## 2. 병렬 구현 조율

- 도메인 계약이 확정(`SendMessage`로 ui/platform에 공개 API 전달)되면 ui-engineer와 platform-engineer가 동시에 진행.
- 두 엔지니어가 같은 파일을 건드릴 위험이 있으면 architect가 모듈 경계를 더 잘게 쪼개 분리한다(병렬성 보장은 architect 책임).
- 파일 충돌이 불가피한 동시 편집이 필요하면 `isolation: worktree`로 분리 후 병합을 고려.
- ui→platform 단방향 의존(i18n 키)은 메시지로 일찍 흘려보내 막힘을 방지.

## 3. Phase 간 팀 재구성

대부분의 기능은 한 팀으로 끝까지 간다. 단, 단계별 전문가 조합이 크게 달라지면(예: 대규모 도메인 설계 Phase → 대규모 UI Phase) 이전 팀 산출물을 `_workspace/`에 저장하고 `TeamDelete` 후 새 `TeamCreate`로 재구성할 수 있다. 산출물이 파일로 남아 있으므로 컨텍스트는 끊기지 않는다.

## 4. 데이터 전달 전략(조합)

권장 조합 = **태스크(조율) + 파일(산출물) + 메시지(실시간)**.

| 무엇 | 어떻게 |
|------|--------|
| 작업 상태·의존 | TaskCreate/TaskUpdate |
| 청사진·계약·QA 리포트 | `_workspace/{phase}_{agent}_{artifact}.md` |
| 공개 API 시그니처·i18n 키·경계 불일치 | SendMessage(당사자에게 직접) |
| 최종 코드 | `src/**` (프로젝트에 직접 출력) |

`_workspace/` 파일명 규칙: `01_architect_ladder-blueprint.md`, `02_domain_ladder-contract.md`, `04_qa_ladder-report.md`. 2자리 prefix로 시간순 정렬.

## 5. 에러 핸들링 전략표

| 에러 유형 | 전략 |
|-----------|------|
| 에이전트 작업 실패/무응답 | 1회 재시도. 재실패 시 그 산출물 없이 진행 + 리포트에 누락 명시. |
| 계약 불일치(경계 버그) | qa가 양쪽 당사자에 통지 → 책임자가 수정 → qa 재검증. |
| 공정성 테스트 실패 | **CRITICAL.** 시각 계층 중단, architect 불변식으로 알고리즘 교정 후 GREEN 확인. |
| 상충하는 두 산출물 | 삭제 금지. 출처 병기해 리더가 판단. |
| 계층 위반(도메인이 react import) | 차단. clean-architecture 스킬로 재배치. |
| 빌드/타입 실패 | platform/해당 엔지니어가 최소 수정으로 그린화. qa가 재빌드 확인. |
| 디자인 토큰 부재 | 추측 금지. DESIGN.md 기준으로 리더가 결정. |

원칙: **거짓 통과를 만들지 않는다.** 검증 못 한 것은 "미검증"으로 보고한다.

## 6. 모델·호출 규약

- 모든 팀원/Agent 호출에 `model: "opus"` 명시.
- qa-integration은 `general-purpose` 타입(검증 스크립트 실행 필요; Explore는 읽기 전용이라 부적합).
- 나머지는 해당 에이전트 정의(`.claude/agents/*.md`)를 사용.
- 백그라운드 병렬이 유리한 독립 작업(ui ∥ platform)은 동시에 띄운다.
