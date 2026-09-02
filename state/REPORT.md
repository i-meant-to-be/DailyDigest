# 숙련도 리포트

갱신: 2026-09-02 · 이 문서는 `node scripts/digest.mjs report`가 생성합니다. 직접 고치지 마세요.

전체 213문항 · 숙지 0 · 불안정 9 · 오답 2 · 미학습 202 · 숙련도 2%

미학습 202문항의 내역 — 답이 비어 있는 문항 117개, 답은 정리했으나 점검받지 않은 문항 85개

## 과목별

| 과목 | 문항 | 숙지 | 불안정 | 오답 | 미학습 | 숙련도 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cs/algorithms | 18 | 0 | 0 | 1 | 17 | 0% |
| cs/data-structures | 18 | 0 | 0 | 0 | 18 | 0% |
| cs/database | 15 | 0 | 0 | 0 | 15 | 0% |
| cs/design | 9 | 0 | 0 | 0 | 9 | 0% |
| cs/network | 13 | 0 | 0 | 0 | 13 | 0% |
| cs/os | 10 | 0 | 1 | 0 | 9 | 5% |
| lang/c-cpp | 12 | 0 | 0 | 0 | 12 | 0% |
| lang/java-kotlin | 22 | 0 | 1 | 0 | 21 | 2% |
| platform/android | 28 | 0 | 1 | 1 | 26 | 2% |
| platform/compose | 21 | 0 | 2 | 0 | 19 | 5% |
| platform/di | 9 | 0 | 2 | 0 | 7 | 11% |
| platform/security | 14 | 0 | 2 | 0 | 12 | 7% |
| project/cau-capstone | 6 | 0 | 0 | 0 | 6 | 0% |
| project/consensus | 8 | 0 | 0 | 0 | 8 | 0% |
| project/hilit | 10 | 0 | 0 | 0 | 10 | 0% |

## 난이도별

| 난이도 | 문항 | 숙지 | 불안정 | 오답 | 미학습 | 숙련도 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 기초 | 52 | 0 | 5 | 1 | 46 | 5% |
| 실무 | 128 | 0 | 4 | 1 | 123 | 2% |
| 심화 | 33 | 0 | 0 | 0 | 33 | 0% |

## 오답 (2)

- **ALG-003** (cs/algorithms · 실무) 퀵 정렬의 최악 시간 복잡도는 언제 발생하며 어떻게 피하나요?
  - 지적: 최악 시간 복잡도를 O(n)으로 답함 (정답 O(n^2)) — 몰라서 틀림
  - 지적: 랜덤 피벗·median-of-three·introsort 등 실제 회피 기법을 전혀 모름
  - 지적: 최악 조건에 '첫/마지막 원소를 피벗으로 쓸 때'라는 전제를 붙이지 못함
- **AND-022** (platform/android · 기초) Activity의 생명주기 콜백은 어떤 순서로 호출되나요?
  - 지적: 생명주기 콜백 이름을 하나도 대지 못함 — 몰라서 틀림
  - 지적: 가려짐(onPause/onStop)과 파괴(onDestroy)를 구분하지 못함

## 오래 점검하지 않은 숙지 항목 (0)

없습니다.

## 주제 대장 커버리지

| 과목 | 채움 | 전체 | 남은 공백 |
| --- | ---: | ---: | ---: |
| cs/algorithms | 18 | 22 | 4 |
| cs/data-structures | 18 | 22 | 4 |
| cs/database | 15 | 19 | 4 |
| cs/design | 9 | 13 | 4 |
| cs/network | 13 | 17 | 4 |
| cs/os | 10 | 14 | 4 |
| lang/c-cpp | 12 | 16 | 4 |
| lang/java-kotlin | 22 | 27 | 5 |
| platform/android | 28 | 35 | 7 |
| platform/compose | 21 | 25 | 4 |
| platform/di | 9 | 11 | 2 |
| platform/security | 14 | 16 | 2 |
| project/cau-capstone | 6 | 13 | 7 |
| project/consensus | 8 | 15 | 7 |
| project/hilit | 10 | 20 | 10 |

## 최근 세션

| 세션 | 문항 | 평균 |
| --- | ---: | ---: |
| 2026-09-02-1457 | 5 | 2.33 |
| 2026-09-02-0258 | 5 | 2 |

