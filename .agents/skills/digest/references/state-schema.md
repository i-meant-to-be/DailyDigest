# 상태 파일과 스크립트 명령

## 절대 하지 말 것

`state/mastery.json`과 `state/sessions.json`을 **직접 열거나 편집하지 마라.**

두 가지 이유다. 하나는 크기 — 187문항이 들어 있고 앞으로 더 늘어난다. 컨텍스트에 올릴 이유가 없다. 다른 하나는 정확성 — 상태 전이, 감쇠, 집계 규칙이 코드에 있고 테스트로 고정돼 있다. 손으로 고치면 규칙과 어긋난다.

`state/REPORT.md`도 생성물이다. 손으로 쓰지 마라.

## 명령

전부 저장소 루트에서 실행한다.

| 명령 | 하는 일 |
| --- | --- |
| `node scripts/digest.mjs sync` | 지식 파일을 훑어 상태 기록과 맞춘다. 새 문항은 미학습으로 등록, 사라진 문항은 표시만 |
| `node scripts/digest.mjs select [--n 6] [--subject cs/os]` | 출제할 문항을 고른다. JSON 출력 |
| `node scripts/digest.mjs pending` | 채점하지 않은 세션을 찾는다 |
| `node scripts/digest.mjs open --ids A-1,B-2 [--id 세션id]` | 세션을 만들고 출제 사실을 기록한다 |
| `node scripts/digest.mjs update --session <id> --file <채점결과.json>` | 상태를 갱신하고 세션을 채점 완료로 표시 |
| `node scripts/digest.mjs report` | `state/REPORT.md`를 다시 만든다 |
| `node scripts/digest.mjs verify` | ID 중복, 상태 불일치, 깨진 세션 인덱스를 점검 |

모든 명령에 `--today 2026-09-02`를 붙여 날짜를 고정할 수 있다. 시연이나 확인용이다.

## 문항 상태

| 값 | 의미 |
| --- | --- |
| `unseen` | 아직 출제된 적 없음. `answered` 값으로 "답이 비어 있음"과 "답은 있으나 미점검"이 갈린다 |
| `wrong` | 최근 채점 0~1점 |
| `shaky` | 최근 채점 2~3점, 또는 오답에서 4점을 한 번 받은 직후, 또는 숙지가 감쇠한 것 |
| `known` | 4점을 연속 두 번. 오답에서 한 번에 올라오지 못한다 |

## mastery.json

```jsonc
{
  "version": 1,
  "updated_at": "2026-09-02",
  "questions": {
    "NET-002": {
      "subject": "cs/network",      // 지식 파일 경로에서 나온다
      "difficulty": "기초",
      "title": "TCP 3단 악수를 설명해 주세요.",
      "answered": true,             // 본문이 "> (미작성)"이 아니면 true
      "status": "shaky",
      "attempts": 3,                // 채점된 횟수. 미응답은 세지 않는다
      "streak": 0,                  // 연속 4점 횟수
      "last_asked": "2026-09-02",   // 출제 시각에 찍힌다 (채점 시각이 아니다)
      "last_graded": "2026-09-02",
      "last_score": 2,
      "gaps": ["마지막 ACK 단계를 언급하지 못함"],
      "history": [{ "date": "2026-09-02", "score": 2 }]   // 최근 20건
    }
  }
}
```

`subject` · `difficulty` · `title` · `answered`는 **지식 파일이 원본**이다. `sync`가 매번 덮어쓴다. 나머지는 채점으로만 바뀐다.

`last_asked`가 출제 시각에 찍히는 이유는 쿨다운이 "언제 물어봤는가"를 기준으로 동작해야 하기 때문이다. 답을 안 쓰고 넘어간 문항도 이미 눈에 띄었으니 바로 다음 세션에 또 나오면 곤란하다.

## sessions.json

```jsonc
{
  "pending": "2026-09-02-1430",
  "sessions": [
    { "id": "2026-09-02-1430", "status": "pending",
      "opened": "2026-09-02", "ids": ["NET-002", "CMP-001"], "count": 6 }
  ]
}
```

## 미채점 세션을 찾는 방법

`pending` 명령이 세 겹으로 처리한다. **직접 `sessions/`를 훑지 마라.**

1. 이 인덱스 파일 한 개만 읽는다
2. 인덱스가 어긋나면 디렉터리 이름의 접미사만 본다 (`2026-09-02-1430.pending` → 채점하면 `.graded`로 바뀐다). 파일 내용은 열지 않는다
3. 둘 다 안 되면 최신순으로 확인하되 첫 미채점을 찾는 즉시 멈춘다

세션이 수백 개로 쌓여도 읽는 양이 늘지 않게 하려는 설계다.

## 채점 결과 파일

`update --file`에 넘길 형식이다.

```json
[
  { "id": "NET-002", "score": 2, "gaps": ["마지막 ACK 단계를 언급하지 못함"] },
  { "id": "CMP-001", "score": 4, "gaps": [] },
  { "id": "AND-022", "score": null }
]
```

`score`가 `null`이면 미응답이다. 상태도 `attempts`도 바뀌지 않는다.

`gap` 슬롯에서 나온 새 문항은 지식 파일에 등록하고 `sync`를 돌린 **뒤에** 이 파일에 넣어라. 상태 기록에 없는 ID를 넘기면 경고와 함께 건너뛴다.

## 무결성

- 지식 파일의 ID 집합과 상태 기록의 키 집합은 항상 같아야 한다. 지식 파일을 고쳤으면 `sync`를 돌려라
- 지식 파일에서 사라진 문항은 삭제하지 않고 `"orphaned": true`로 표시된다. 실수로 옮겼을 때 이력까지 날아가면 복구할 수 없기 때문이다
- 이상이 의심되면 `verify`를 돌려라. 문제가 있으면 종료 코드 1로 알린다
