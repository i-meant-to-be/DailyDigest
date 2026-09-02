# 지식 파일 규칙

## 문항 형식

```markdown
## [NET-002] (기초) TCP 3단 악수를 설명해 주세요.

- 단말 A가 연결 의사를 표명 (SYN)
- ...
```

- `## [ID] (난이도) 질문` — 이 한 줄이 문항의 머리다. 스크립트가 이 형식으로만 문항을 인식한다.
- 난이도는 `기초` · `실무` · `심화` 셋 중 하나. 생략하면 `실무`로 간주한다.
- 다음 `##`이 나올 때까지가 본문이자 참조 답안이다.
- 답이 아직 없으면 본문을 `> (미작성)` 한 줄로 둔다. 이게 **미학습** 상태의 근거가 된다.

## ID 규칙

**한 번 부여한 ID는 재사용하지 않고 번호를 다시 매기지 않는다.** 상태 기록이 ID로 연결되어 있어서, 번호를 다시 매기면 그 문항의 학습 이력이 통째로 엉뚱한 곳에 붙는다.

문항을 다른 파일로 옮겨도 ID는 따라간다. 그래서 접두사가 현재 파일과 달라질 수 있는데, 그대로 두면 된다. 접두사는 출신을 나타낼 뿐이고 과목은 파일 경로가 결정한다.

| 접두사 | 파일 |
| --- | --- |
| `OS` | `cs/os.md` |
| `NET` | `cs/network.md` |
| `DS` | `cs/data-structures.md` |
| `ALG` | `cs/algorithms.md` |
| `DB` | `cs/database.md` |
| `DSG` | `cs/design.md` |
| `JK` | `lang/java-kotlin.md` |
| `CPP` | `lang/c-cpp.md` |
| `AND` | `platform/android.md` |
| `CMP` | `platform/compose.md` |
| `DI` | `platform/di.md` |
| `SEC` | `platform/security.md` |
| `HIL` | `project/hilit.md` |
| `CNS` | `project/consensus.md` |
| `CAP` | `project/cau-capstone.md` |

새 문항의 번호는 해당 접두사의 최댓값 다음을 쓴다. 삭제된 번호도 비워 둔 채 건너뛴다.

## 과목 경계

어디에 넣을지 헷갈릴 때의 판단 순서다.

1. 플랫폼 API 이름이 답의 핵심이면 → `platform/`
2. 언어 문법이나 런타임이 답의 핵심이면 → `lang/`
3. 둘 다 아니면 → `cs/`

세부 규칙:

- **Android vs Compose** — Compose 함수나 어노테이션이 답의 핵심이면 `compose.md`, 아니면 `android.md`. 아키텍처 논의(UDF, ViewModel의 역할, 계층 책임)는 UI 기술과 무관하므로 `android.md`에 둔다.
- **Android vs DI** — Hilt/Dagger 어노테이션과 컴포넌트가 나오면 `di.md`.
- **Android vs Security** — 키 저장, 암호, 토큰, 인증 흐름은 `security.md`.
- **os.md vs design.md** — 운영체제가 제공하는 메커니즘이면 `os.md`, 코드를 어떻게 구성할 것인가의 문제면 `design.md`.
- **`cs/database.md`** — 과목 이름이지 저장 위치가 아니다. 상태 파일은 `state/`에 있다.
- **`project/` vs 나머지** — 특정 저장소에서 내린 결정과 그 근거를 묻는 문항이면 `project/`에 둔다. 그 저장소를 몰라도 답할 수 있는 일반론이면 `cs/`·`lang/`·`platform/`에 둔다. 예를 들어 "멀티모듈에서 의존성 방향을 어떻게 관리하나"는 `platform/android.md`, "이 프로젝트에서 Feature를 api와 impl로 나눈 이유는"은 `project/hilit.md`다.

## 중복 처리

같은 주제를 두 파일에 두지 않는다. 한쪽만 원본으로 남기고, 다른 쪽 파일 맨 위에 인용 블록으로 한 줄 적는다.

```markdown
> 인접 주제 — UDF와 ViewModel의 역할은 `platform/android.md`에서 다룬다.
```

이 안내는 `##`으로 시작하지 않으므로 문항으로 인식되지 않는다. 즉 문제 풀을 오염시키지 않으면서 "여긴 없고 저기 있다"만 알려 준다.

## 고칠 때

`AGENTS.md`에 적힌 대로, Claude는 이 파일들을 승인 없이 고치지 않는다. 오류를 발견하면 `docs/AUDIT.md`에 제안으로 올린다. 예외는 두 가지다.

1. `docs/AUDIT.md`에서 승인 표시된 항목
2. 채점을 마친 `gap` 슬롯 문항을 새 ID로 등록하는 경우

파일을 고친 뒤에는 `node scripts/digest.mjs sync`를 실행해 상태 기록과 맞춘다.
