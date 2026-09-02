# Android

> 인접 주제 — Compose API와 UI 로직 분리는 `platform/compose.md`, 의존성 주입은 `platform/di.md`,
> KeyStore·토큰 저장은 `platform/security.md`에서 다룬다.

## [AND-001] (기초) Android의 4대 컴포넌트란 무엇인가요?

- Activity
  - UI, 즉 사용자가 상호작용하는 화면임
- Service
  - 백그라운드에서 돌아가는 작업이며, 단순 Coroutines로 비동기 처리하는 작업이 아니라 음악 감상 시 앱을 닫아도 계속 재생되는 것과 같은 OS 수준에서의 백그라운드 작업을 의미함
- Content Provider
  - 다른 앱 간 데이터를 안전히 공유해줄 수 있는 인터페이스로, 대표적으로는 미디어 파일 접근에 사용하는 `ContentResolver` 등이 있음
- Broadcast Receiver
  - OS 단에서 발생하는 시스템적 변화를 수신하기 위한 장치. 예를 들어 배터리가 너무 적을 때 경고 메시지를 띄워야 한다든지 등 시스템 API의 도움이 필요한 기능이 있을 때 사용하게 됨

## [AND-002] (기초) `Activity`와 `Fragment`의 차이는 무엇인가요?

- `Activity`
  - 사용자에게 보여지는 단일 화면
  - 앱의 진입점이고 생명주기를 운영체제가 직접 관리
- `Fragment`
  - `Activity`에 속하는 재사용 가능한 UI 부분
  - `Activity`에 종속적임
  - 자체 생명주기를 가지기는 하나 항상 호스트 `Activity`의 영향을 받음

## [AND-003] (기초) `Context`란 무엇이고 종류별로 어떤 차이가 있나요?

Context는 앱의 정보와 Android OS 기능에 접근하기 위한 일종의 인터페이스

- Application Context
  - 앱 자체와 생명주기를 공유
- Activity Context
  - 특정 액티비티와 생명주기를 공유

## [AND-004] (실무) 화면 회전으로 Activity가 파괴되는데 ViewModel은 어떻게 살아남나요?

- ViewModel은 Activity나 Fragment 자체에 직접 보관되는 것이 아니라, ViewModelStoreOwner가 가진 ViewModelStore에 저장됨
- 화면 회전 같은 Configuration 변화가 발생하면 Activity 인스턴스는 파괴되고 새로 만들어질 수 있음
- 그러나 같은 논리 Activity에 연결된 ViewModelStore는 유지됨
- 그래서 새 Activity가 ViewModelProvider를 통해 ViewModel을 요청하면, ViewModelStore에 남아 있던 기존 ViewModel 인스턴스를 다시 받게 됨
- 반대로 Activity가 완료되거나 Navigation 백 스택에서 해당 목적지가 제거되면 ViewModelStore가 비워지고 ViewModel의 `onCleared()`가 호출됨

## [AND-005] (실무) `LiveData`나 `MutableState` 대신 `StateFlow`를 권장하는 이유는 무엇인가요?

`LiveData`와 `MutableState` 모두 Android 또는 Compose에 종속적이기 때문. 이로 인해 몇 가지 한계가 발생하는데:

- 테스트 용이성 크게 저하. `LiveData`와 `MutableState`는 테스트를 위해 Android 에뮬레이터나 Compose 테스트 환경이 필요해서 매우 느림. 반대로 `StateFlow`로 작성된 뷰 모델은 UI와 독립적으로 ViewModel 단독 테스트가 가능하다는 장점도 있음
- 도메인 계층을 보호하기 위함. 도메인 계층에는 비즈니스 로직만 존재해야 하기 때문에 Android 프레임워크에 종속된 요소를 가져와서는 안 됨
- 만약 나중에 서비스 타겟을 웹이나 다른 플랫폼 등으로 이식해야 할 경우, Compose에 종속되지 않는 `StateFlow` 기반 뷰 모델은 코드 변경 없이 그대로 재사용이 가능

## [AND-006] (실무) `StateFlow`, `Flow`, `SharedFlow`는 각각 어떻게 다른가요?

- `StateFlow`
  - 구독자가 없어도 항상 현재 값 유지 = Hot Stream
  - 여러 구독자가 항상 동일한 최신 상태 값 참조 가능
  - 신규 구독자도 즉시 최신 값을 받아볼 수 있음
  - UiState 등 상태 관리에 사용
- `Flow`
  - 구독자가 없으면 값을 유지하지 않음 = Cold Stream
  - 비동기 데이터 스트림
  - `collect`할 때마다 스트림이 처음부터 새로 실행되며, 구독자끼리 값을 나눠 갖지 않고 각자 전체를 받음. (하나가 가져가면 남이 못 받는 것은 `Channel`의 특성이지 `Flow`가 아님)
  - Repository에서 DB 조회 결과나 네트워크 요청 결과처럼 시간에 따라 발생하는 데이터를 순차적으로 전달할 때 사용할 수 있음
- `SharedFlow`
  - 구독자가 없어도 인스턴스는 독립적으로 존재함 = Hot Stream
  - 여러 구독자에게 값을 공유하는 Hot Flow
  - `replay`와 `buffer` 옵션을 통해 새 구독자에게 과거 값을 일부 전달하거나, 구독자가 느릴 때 이벤트를 버퍼링할 수 있음
  - 삽입된 데이터를 모든 구독자에게 배포하기 때문에 브로드캐스팅이 필요한 경우 유용하게 사용 가능

## [AND-007] (실무) Android 아키텍처 권장사항에 대해 설명해 주세요.

> (미작성)

## [AND-008] (기초) ViewModel의 역할은 무엇인가요?

- UI와 Model의 중간에 위치하며 모델의 Raw 데이터를 받아 UI에 적절한 형태로 가공하고 저장하는 역할을 맡음
- 즉 데이터 원천과 UI 사이에서 화면에 출력할 데이터를 조정하며, 사용자 이벤트를 받아 그 데이터를 조작하는 책임도 함께 가짐

## [AND-009] (기초) UI State란 무엇인가요?

- 화면을 렌더링하기 위해 필요한 모든 상태의 스냅샷
- ViewModel은 여러 데이터 소스와 사용자 이벤트를 바탕으로 UI State를 생산
- UI는 그 상태를 받아 그대로 렌더링에 사용

## [AND-010] (기초) UDF(Unidirectional Data Flow)란 무엇인가요?

- UDF는 Unidirectional Data Flow의 약자로, 데이터는 반드시 단방향으로 흘러야 함을 의미
- 크게는 "State down, event up"
- Composable + ViewModel의 구조를 가정하면
  - 상태는 ViewModel로부터 Composable로 **내려가야** 함
  - 이벤트는 Composable로부터 ViewModel로 **올라가야** 함
- Android에서는 Model → ViewModel → Composable의 경로로 데이터가 이동하는 것을 예시로 들 수 있음

## [AND-011] (실무) ViewModel에서 UI State를 `StateFlow`로 노출하는 이유는 무엇인가요?

- 항상 최신 값만 가지기 때문에 상태 추적에 용이함
- 새 구독자도 즉시 최신 값을 받을 수 있음
- `collectAsStateWithLifecycle`을 사용하여 Android 생명주기에 맞게 구독 가능
- 순수 Kotlin 기능이라 테스트하기에 편함
- `mutableStateOf`도 상태 변화를 관찰한다는 목적은 같지만 Compose에 종속적이라는 점이 다름. ViewModel이 UI 기술에 묶이지 않게 하려면 `StateFlow` 쪽이 유리함

## [AND-012] (기초) 저장소 패턴이란 무엇인가요?

- 데이터 소스 인터페이스를 추상화하여 상위 기능들이 실제 데이터 소스에 영향받지 않도록 하는 패턴
- 저장소 패턴을 통해 서버와 로컬 등 데이터 소스가 여러 개여도 단일 인터페이스로 간편히 처리 가능

## [AND-013] (기초) UI Layer, Domain Layer, Data Layer의 책임은 어떻게 나누나요?

- UI 계층은 오직 화면을 그리는 목적에만 집중
- 도메인 계층은 유스케이스 등 오직 도메인 영역에 국한되는 로직 연산에만 집중
- 데이터 계층은 데이터를 받아와 앱에서 사용할 수 있는 형태로 처리 및 생산하는 목적에 집중

## [AND-014] (실무) 유스케이스는 언제 도입하나요?

- UseCase는 모든 기능에 기계적으로 만들 필요는 없음
- 여러 ViewModel에서 재사용되는 로직이 있거나, Repository 호출만으로 설명하기 어려운 비즈니스 규칙이 있을 때 도입하는 것이 적절함
- 단순 CRUD 수준이라면 ViewModel이 Repository를 직접 호출해도 충분할 수 있음

## [AND-015] (기초) Single Source of Truth(SSOT)란 무엇인가요?

- 진정한 데이터 소스는 반드시 하나여야 함을 의미함
- 데이터 소스가 여러 개라고 한다면, 둘이 다른 데이터를 내놓을 때 무엇을 믿어야 할지 알 수 없음
- 따라서 하나의 데이터 소스가 언제나 진실로 간주되는 아키텍처를 구성해야 함

## [AND-016] (실무) `rememberSaveable`과 ViewModel은 각각 어떤 상태를 보존하는 데 적합한가요?

- 전자는 텍스트 필드 입력 값 등 UI 전용 임시 값에 적합
- 후자는 실제 화면에서 사용되는 데이터에 적합

## [AND-017] (실무) Context를 ViewModel에 보관하면 왜 문제가 될 수 있나요?

- ViewModel은 Configuration 변화 동안 Activity보다 오래 살아남을 수 있음
- 따라서 ViewModel이 Activity Context나 View 참조를 보관하면, Activity가 destroy된 뒤에도 해당 Activity를 GC하지 못해 메모리 누수가 발생할 수 있음
- Context가 꼭 필요하다면 Application Context를 사용하거나, UI 작업은 Composable/Activity 쪽에서 처리하고 ViewModel은 이벤트만 노출하는 편이 안전함

## [AND-018] (실무) 멀티 모듈 아키텍처를 도입한 이유는 무엇인가요?

- 소프트웨어공학적 측면에서 결합도를 낮추고 응집도를 올려 유지보수성을 높이기 위함
- 다수가 참여하는 프로젝트에서 모듈을 분리하여 서로의 작업이 미치는 영향을 줄이기 위함
- 빌드 효율성 측면에서 바뀐 모듈만 빌드하는 Gradle의 Incremental Build(증분 빌드)를 활용하기 위함

## [AND-019] (실무) 멀티 모듈 구조에서 모듈을 나누는 기준은 무엇인가요?

- 응집도가 높은 항목끼리 묶음
- 예를 들어, 네트워크 모듈에는 네트워크 요청을 받고 보내고 처리하는 기능만 포함
- 각 기능 모듈은 기능별로 특화된 코드와 UI만 포함
- 여러 기능에서 공통으로 쓰는 디자인 시스템이나 공용 유틸은 별도 모듈로 분리
- 나누는 단위는 "함께 바뀌는 것끼리 묶는다"를 기준으로 삼는 것이 실용적

## [AND-020] (실무) 멀티 모듈에서 의존성 방향은 어떻게 관리해야 하나요?

- 가능한 단방향으로 흐르게 하는 게 좋음
- 순환 의존성을 피하고, 구현체가 아니라 추상 인터페이스에 의존하도록 방향을 제한해야 함 (의존성 역전)
- 인터페이스만 담은 모듈과 구현을 담은 모듈을 분리하면 빌드 그래프가 얇아져 증분 빌드 효과도 커짐

## [AND-021] (실무) 멀티 모듈 아키텍처의 단점은 무엇인가요?

- 초기 설정 비용 증가
- 모듈 간 의존성 관리가 어려워질 수 있음
- 모듈을 어느 정도 선에서 나눌지 결정하는 게 어려움
- 너무 잘게 나누면 파일 이동과 의존성 추가 비용이 커져 오히려 개발 속도가 느려질 수 있음

## [AND-022] (기초) Activity의 생명주기 콜백은 어떤 순서로 호출되나요?

> (미작성)

## [AND-023] (실무) ANR은 어떤 조건에서 발생하며 어떻게 예방하나요?

> (미작성)

## [AND-024] (실무) 백그라운드 작업이 필요할 때 WorkManager·Service·Coroutines 중 무엇을 고르나요?

> (미작성)

## [AND-025] (심화) 앱 시작 시간을 줄이려면 무엇을 봐야 하나요?

> (미작성)

## [AND-026] (실무) 메모리 누수는 Android에서 주로 어디서 발생하며 어떻게 찾나요?

> (미작성)

## [AND-027] (실무) ProGuard/R8 난독화가 깨뜨릴 수 있는 코드는 어떤 것인가요?

> (미작성)

## [AND-028] (실무) Navigation 컴포넌트의 백스택은 어떻게 관리되며, 뒤로가기로 돌아오면 안 되는 화면은 어떻게 처리하나요?

- NavController가 목적지(destination)를 스택(LIFO)으로 관리함. `startDestination`이 바닥에 깔리고, `navigate()`를 호출할 때마다 위에 쌓이며, 시스템 뒤로가기나 `popBackStack()`으로 pop됨
- 스택이 비면 그래프가 종료되고 Activity가 닫힘
- 뒤로가기로 돌아오면 안 되는 화면(스플래시, 로그인 등)은 이동과 동시에 이전 목적지를 스택에서 걷어내는 방식으로 처리함

```kotlin
navController.navigate("home") {
    popUpTo("login") { inclusive = true }
}
```

- `popUpTo`는 지정한 목적지까지 스택을 걷어내고, `inclusive = true`면 그 목적지 자신까지 함께 제거함. 로그인 → 홈 이동 시 로그인을 스택에서 지워 뒤로가기로 되돌아올 수 없게 만듦
- 로그인 전체 흐름을 지우려면 `popUpTo(graph.startDestinationId)`처럼 그래프 시작점을 기준으로 잡거나, 인증 흐름을 중첩 그래프로 묶어 그래프 단위로 걷어냄
- `launchSingleTop = true`는 같은 목적지가 스택 맨 위에 이미 있을 때 중복 push를 막음. 하단 탭 이동이나 버튼 연타로 같은 화면이 여러 장 쌓이는 것을 방지하는 용도
