# Compose

> 인접 주제 — UDF, ViewModel의 역할, `rememberSaveable`과 ViewModel의 역할 구분,
> `StateFlow` 노출 이유는 `platform/android.md`에서 다룬다.

## [CMP-001] (기초) Recomposition은 무엇이고 `remember`는 그 안에서 어떤 역할을 하나요?

- Recomposition은 상태가 바뀌었을 때 Compose가 해당 Composable을 다시 실행해 화면을 갱신하는 과정
- `remember`는 Recomposition 사이에서 값을 유지하기 위해 composition에 값을 저장하는 API
- 다만 `remember` 자체가 상태 변경을 감지하거나 Recomposition을 유발하는 것은 아님. **보관만** 함
- Recomposition을 일으키는 것은 `mutableStateOf` 같은 관찰 가능한 상태 값의 변경이며, Compose가 그 변경을 관찰해 Recomposition을 수행함
- 정리하면 `remember`는 "값을 잃지 않게 해 주는 장치", `MutableState`는 "값이 바뀌었음을 알리는 장치"로 역할이 다름

## [CMP-002] (기초) `remember`와 `rememberSaveable`의 차이는 무엇인가요?

- `remember`는 Recomposition 사이에서 값을 유지하지만 Configuration 변화 시에는 기본적으로 유지되지 않음
- `rememberSaveable`은 Bundle에 저장 가능한 값이나 Saver로 정의한 값을 저장해 Configuration 변화 이후에도 복원할 수 있게 함
- 다만 복잡한 화면 상태나 비즈니스 상태는 ViewModel에서 관리하는 것이 더 적절함

## [CMP-003] (기초) State Hoisting이란 무엇인가요?

- State Hoisting은 직역하면 상태를 모두 위로 올리는 것을 의미
- 기술적으로는 하위 Composable이 직접 상태를 소유하지 않고, 그 상태를 읽거나 변경해야 하는 최소 공통 상위 Composable 또는 ViewModel로 상태를 올리는 패턴
- 이를 통해 하위 Composable은 value와 callback만 받는 stateless 형태가 되어 재사용성과 테스트 가능성이 좋아짐
- 또한 이는 Android의 권장 컨벤션 중 하나인 단방향 데이터 흐름 철학과도 일치

## [CMP-004] (기초) Stateful Composable과 Stateless Composable의 차이는 무엇인가요?

- Stateful Composable은 내부에서 상태를 직접 소유하고 변경하는 Composable
- Stateless Composable은 상태를 외부에서 값으로 받고 변경 요청을 콜백으로 올리는 Composable
- Stateless Composable은 재사용성과 테스트 가능성이 높고, Stateful Composable은 사용은 간단하지만 상태 책임이 내부에 묶임

## [CMP-005] (기초) `collectAsStateWithLifecycle`은 왜 필요한가요?

- `StateFlow`는 Kotlin 단 기능임
- 즉, Compose나 Android 쪽 생명주기를 모름
- 따라서 `StateFlow`가 Android 생명주기에 맞게 동작하도록 `collectAsStateWithLifecycle`로 수집해줘야 함. 화면이 백그라운드로 내려가면 수집을 멈추고 다시 올라오면 재개함

## [CMP-006] (기초) `LaunchedEffect`는 무엇인가요?

- `LaunchedEffect`는 Composable이 Composition에 들어왔을 때 Coroutine을 실행하기 위한 부수 효과 API
- 키가 변경되면 기존 Coroutine이 취소되고 새 Coroutine이 시작됨
- Composable이 Composition에서 나가면 실행 중인 Coroutine도 취소됨

## [CMP-007] (실무) `LaunchedEffect`의 키는 왜 중요한가요?

키 선택의 핵심 질문은 "이 효과가 언제 다시 시작되어야 하는가"이고, 실패는 양방향으로 난다.

- 키를 너무 좁게 잡을 때 (예: `Unit`)
  - 효과가 한 번만 실행되고, 그 안에서 캡처한 값이 낡은 채로 남음
  - 화면은 새 값으로 갱신됐는데 효과는 옛 값으로 동작하는 어긋남이 생김. 실무에서 훨씬 자주 나는 사고
- 키를 너무 넓게 잡을 때
  - 자주 바뀌는 값을 키로 쓰면 효과가 계속 취소·재시작되어 네트워크 요청이 중복되거나 애니메이션이 끊김
- 값이 바뀌어도 효과를 재시작하고 싶지 않다면 `rememberUpdatedState`로 최신 값만 참조하는 방법이 있음

## [CMP-008] (기초) `DisposableEffect`는 무엇인가요?

- Composable이 정리될 때 (언마운트될 때) 실행되어야 할 작업이 들어감
- React의 `useEffect` 내 반환문과 같은 기능
- Composable이 Composition에서 나가면서 구독이나 리소스를 해제해야 할 때 사용

## [CMP-009] (실무) `rememberCoroutineScope`와 `LaunchedEffect`의 차이는 무엇인가요?

- `rememberCoroutineScope`는 Composable 생명주기에 묶인 `CoroutineScope`를 얻어, 클릭 콜백처럼 이벤트 처리 도중 직접 코루틴을 개시해야 할 때 사용
- `LaunchedEffect`는 최초 Composition 시점, 그리고 키가 바뀔 때만 기존 코루틴을 취소하고 새로 시작. **키가 그대로면 Recomposition이 아무리 일어나도 재시작하지 않음** (재시작하지 않는 것이 부수 효과 API로서의 존재 이유)

## [CMP-010] (실무) `derivedStateOf`는 언제 사용하나요?

- 특정 값에서부터 파생되는 다른 값을 추적해야 할 때 사용
- 특히 원본 상태는 자주 바뀌지만, 파생 결과가 실제로 바뀔 때만 Recomposition을 유도하고 싶을 때 유용함
- 다만 단순한 문자열 조합이나 가벼운 계산에 사용할 경우, 상태 객체 생성/보관, 의존성 추적, 파생 값 갱신 여부 판단 등 오히려 불필요한 오버헤드가 될 수 있음

## [CMP-011] (심화) `rememberUpdatedState`는 무엇인가요?

- `rememberUpdatedState`는 오래 실행되는 Effect 안에서 최신 State나 람다 함수를 참조해야 할 때 사용
- 예를 들어 `LaunchedEffect(Unit)`로 한 번만 실행되는 작업 안에서 `onTimeout` 같은 콜백은 최신 값으로 유지하고 싶지만, 콜백 변경 때문에 Effect 자체를 재시작하고 싶지는 않을 때 사용

## [CMP-012] (실무) `LazyColumn`에서 키를 지정해야 하는 이유는 무엇인가요?

- 키가 유효해야만 `LazyColumn`이 각 아이템의 동일성을 제대로 계산할 수 있기 때문
- 만약 키가 유효하지 않다면 2개 이상 아이템의 키가 충돌하게 됨
- 이 경우 사용자의 입력이 잘못 처리되거나, 불필요한 Recomposition이 일어나는 등 의도하지 않은 결과가 발생할 확률이 높음

## [CMP-013] (실무) Compose에서 불필요한 Recomposition을 줄이려면 어떻게 해야 하나요?

- 상태를 필요한 최소 범위로 좁혀야 하고, 불필요한 상태를 마구잡이로 추가하면 안 됨
- 상태를 너무 상위에 두면 관련 없는 하위 Composable까지 영향을 받을 수 있음
- `LazyColumn`에서는 안정적인 키를 제공해야 함
- 비용이 큰 계산은 `remember`나 `derivedStateOf`로 분리
- ViewModel에서 이미 계산 가능한 값은 UI에서 매번 계산하지 않도록 UI State로 내려주는 것도 방법

## [CMP-014] (기초) Modifier의 순서가 중요한 이유는 무엇인가요?

- 적용 순서에 따라 UI가 달라질 수 있기 때문
- 예를 들어, `clickable {}.clip(RoundedCornerShape(4.dp))`의 순서일 경우 클릭 가능한 영역은 `clip`의 영향을 받지 않아 직사각형으로 출력
- 그러나 반대로 순서를 바꾸면 클릭 가능한 영역이 `clip`의 영향을 받아 둥근 사각형으로 출력

## [CMP-015] (실무) Compose에서 Snackbar나 Navigation 같은 일회성 이벤트는 어떻게 처리하나요?

- 지속 상태는 ViewModel에 `StateFlow` 등으로 관리하고, 일회성 이벤트는 이와 구분해서 다뤄야 함
- 일반적으로는 `SharedFlow`로 내보내고, `LaunchedEffect`로 수집해서 이벤트 처리
- Snackbar나 Toast는 `SharedFlow` 기반 전역에서 호출 가능한 싱글톤 관리자를 통해 호출하도록 하는 방안도 고려 가능

## [CMP-016] (실무) Compose 코드에서 UI 로직과 비즈니스 로직을 어떻게 분리하나요?

- UI 로직은 받은 상태 값으로 화면을 그리고 이벤트를 콜백으로 올리는 데에 집중
- Composable에는 순수하게 화면을 그리는 데 필요한 로직과 데이터만 남김
- ViewModel은 사용자 이벤트를 받아 화면 상태를 계산하고 필요한 모델을 호출
- 도메인 로직이나 비즈니스 로직은 순수 Kotlin 코드로 작성해 의존성을 줄임

## [CMP-017] (실무) Composable 함수의 Skippable과 Stable은 무엇을 의미하나요?

> (미작성)

## [CMP-018] (실무) Compose의 세 단계(Composition, Layout, Drawing)는 각각 무엇을 하나요?

> (미작성)

## [CMP-019] (실무) Compose에서 화면 간 상태를 어떻게 전달하고 복원하나요?

> (미작성)

## [CMP-020] (심화) Compose와 기존 View 시스템을 함께 쓸 때 주의할 점은 무엇인가요?

> (미작성)

## [CMP-021] (실무) Compose UI는 어떻게 테스트하나요?

> (미작성)

## [CMP-022] (실무) Jetpack Compose에서 커스텀 레이아웃을 직접 구현할 때 측정과 배치는 어떤 순서로 이루어지며, 어떤 제약을 지켜야 하나요?

> (미작성)
