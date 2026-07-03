# VERIFIED KASI anchors (ground truth = korean-lunar-calendar lib output)

리더가 실제 lib로 검증한 값. **도메인 테스트는 SPEC 예시가 아니라 이 값을 정답으로 사용한다.**

## ⚠️ SPEC 예시 오류 (정정)
SPEC `test_scenario_1` 은 "solar 2024-03-15 → 음력 윤2월 6일, 甲辰, 용" 이라 하지만 **실제로는**:
- **solar 2024-03-15 → 음력 2024년 2월 6일 (평달, intercalation=FALSE)**. 2024년엔 윤달이 아예 없다.
- 간지/띠(甲辰/용)는 맞음(2024=갑진년=청룡).
→ SPEC의 "윤2월"은 틀림. 테스트는 lib 실제 출력을 정답으로.

## solar → lunar
| solar | lunar | intercalation | note |
|---|---|---|---|
| 2024-03-15 | 2024-02-06 | false | (SPEC의 윤2월은 오류) |
| 2024-10-18 | 2024-09-16 | false | |
| 2023-04-04 | 2023-02-14 | **true (윤2월)** | 윤달 케이스, 계묘년 |
| 1391-01-01 | 1390-11-18 | false | 하한 경계(입력연도 1391 유효) |
| 2050-12-31 | 2050-11-18 | false | 상한 경계 |

## lunar → solar
| lunar | leap | solar | note |
|---|---|---|---|
| 2024-01-01 | false | 2024-02-10 | 설날 2024 |
| 2024-08-15 | false | 2024-09-17 | 추석 2024 |
| 2023-02-15 | **true** | 2023-04-05 | 윤2월 존재 |
| 2050-01-01 | false | 2050-01-23 | 상한 |

## 윤달 존재 연도(검증됨)
- 2020 → 윤4월, 2023 → 윤2월, 2025 → 윤6월
- **2024 → 윤달 없음** (윤달 토글 에러 테스트에 사용 가능: `lunarToSolar(2024, m, d, isLeap=true)` → 에러 `no_leap_month`)

## 간지 공식(순수, lib와 일치 검증됨)
- stem = (year-4) % 10 ; branch = (year-4) % 12
- 2024: (2020)%10=0→갑, %12=4→진 ⇒ 갑진(甲辰), 용 ✓ (lib koGapja=갑진년)
- 2023: (2019)%10=9→계, %12=3→묘 ⇒ 계묘(癸卯), 토끼 ✓ (lib koGapja=계묘년)

## 범위 처리 결정
- lib의 `setSolarDate`는 1390도 true를 반환(내부 범위가 SPEC보다 넓음). **우리 conversion.ts는 입력 연도에 대해 SPEC 범위(1391–2050)를 명시 검증**해 벗어나면 `error:'out_of_range'`. lib boolean은 "존재하지 않는 날짜/윤달없음"(`invalid_date`/`no_leap_month`)에만 사용.
- **stateful lib 주의**: `setSolarDate/setLunarDate`가 false면 절대 get*()를 읽지 말 것(스테일/기본값 반환 확인됨). false → 즉시 에러 반환. 매 변환마다 `new KoreanLunarCalendar()`.
