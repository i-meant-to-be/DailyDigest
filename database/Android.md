# Android Native

- Android의 4대 컴포넌트란?
  - Activity
    UI, 즉 사용자가 상호작용하는 화면임.
  - Service
    백그라운드에서 돌아가는 작업이며, 단순 Coroutines로 비동기 처리하는 작업이 아니라 음악 감상 시 앱을 닫아도 계속 재생되는 것과 같은 OS 수준에서의 백그라운드 작업을 의미함.
  - Content Provider
    다른 앱 간 데이터를 안전히 공유해줄 수 있는 인터페이스로, 대표적으로는 미디어 파일 접근에 사용하는 `ContentResolver` 등이 있음.
  - Broadcast Receiver
    OS 단에서 발생하는 시스템적 변화를 수신하기 위한 장치. 예를 들어 배터리가 너무 적을 때 경고 메시지를 띄워야 한다던지 등 시스템 API의 도움이 필요한 기능이 있을 때 사용하게 됨.
- `Activity`와 `Fragment`의 차이
  - `Activity`
    - 사용자에게 보여지는 단일 화면
    - 앱의 진입점이고 생명주기를 운영체제가 직접 관리
  - `Fragment`
    - `Activity`에 속하는 재사용 가능한 UI 부분
    - `Activity`에 종속적임
    - 자체 생명주기를 가지기는 하나 항상 호스트 `Activity`의 영향을 받음
- `Context`와 종류별 차이
  Context는 앱의 정보와 Android OS 기능에 접근하기 위한 일종의 인터페이스
  - Application Context
    앱 자체와 생명주기를 공유
  - Activity Context
    특정 액티비티와 생명주기를 공유
- 화면 상태가 바뀌면 Activity는 파괴되는데 어떻게 ViewModel은 살아남는가?
  - ViewModel은 Activity나 Fragment 자체에 직접 보관되는 것이 아니라,
    ViewModelStoreOwner가 가진 ViewModelStore에 저장됨
  - 화면 회전 같은 Configuration 변화가 발생하면 Activity 인스턴스는 파괴되고 새로 만들어질 수 있음
  - 그러나 같은 논리 Activity에 연결된 ViewModelStore는 유지됨
  - 그래서 새 Activity가 ViewModelProvider를 통해 ViewModel을 요청하면,
    ViewModelStore에 남아 있던 기존 ViewModel 인스턴스를 다시 받게 됨
  - 반대로 Activity가 완료되거나 Navigation 백 스택에서 해당 목적지가 제거되면 ViewModelStore가 비워지고 ViewModel의 `onCleared()`가 호출됨
- `LiveData`나 `MutableState` 대신 `StateFlow`를 권장하는 이유
  `LiveData` 와 `MutableState` 모두 Android에 종속적이기 때문. 이로 인해 몇 가지 한계가 발생하는데:
  - 테스트 용이성 크게 저하. `LiveData` 와 `MutableState` 는 테스트를 위해 Android 에뮬레이터를 실행해야 해서 매우 느림. 반대로, `StateFlow` 로 작성된 뷰 모델은 UI와 독립적으로 ViewModel 단독 테스트가 가능하다는 장점도 있음.
  - 도메인 계층을 보호하기 위함. 도메인 계층에는 비즈니스 로직만 존재해야 하기 때문에 Android 프레임워크에 종속된 요소를 가져와서는 안 됨.
  - 만약 나중에 서비스 타겟을 웹이나 다른 플랫폼 등으로 이식해야 할 경우, Compose에 종속되지 않는 `StateFlow` 기반 뷰 모델은 코드 변경 없이 그대로 재사용이 가능.
- `StateFlow`와 `Flow`의 차이
  - `StateFlow`
    - Cold Stream → 구독자가 있어야만 동작
  - `Flow`
    - Hot Stream → 구독자가 반드시 필요
- `StateFlow` vs. `Flow` vs. `SharedFlow`
  ## `StateFlow`
  - 구독자가 없어도 항상 현재 값 유지 = Hot Stream
  - 여러 구독자가 항상 동일한 최신 상태 값 참조 가능
  - 신규 구독자도 즉시 최신 값을 받아볼 수 있음
  - UiState 등 상태 관리에 사용
  ## `Flow`
  - 구독자가 없으면 값을 유지하지 않음 = Cold Stream
  - 비동기 데이터 스트림
  - 하나의 구독자가 데이터를 받으면 그 데이터는 선점되어 다른 구독자가 다시는 소비할 수 없음
  - Repository에서 DB 조회 결과나 네트워크 요청 결과처럼 시간에 따라 발생하는 데이터를 순차적으로 전달할 때 사용할 수 있음
  ## `SharedFlow`
  - 구독자가 없어도 인스턴스는 독립적으로 존재함 = Hot Stream
  - 여러 구독자에게 값을 공유하는 Hot Flow
  - `replay`와 `buffer` 옵션을 통해 새 구독자에게 과거 값을 일부 전달하거나, 구독자가 느릴 때 이벤트를 버퍼링할 수 있음
  - 삽입된 데이터를 모든 구독자에게 배포하기 때문에 브로드캐스팅이 필요한 경우 유용한 사용 가능
- Android 아키텍처 권장사항에 대한 설명
- ViewModel의 역할
  - UI와 Model의 중간에 위치하며 모델의 Raw 데이터를 받아 UI에 적절한 형태로 가공하고 저장하는 역할을 맡음
- Composable과 ViewModel의 책임 분리 방법
  - Composable에는 순수하게 화면을 그리는 데 필요한 로직과 데이터만 남김
  - ViewModel에는 Composable에 넘겨질 데이터를 가공하고 저장하는 책임을 부여
- UI State란?
  - 화면을 렌더링하기 위해 필요한 모든 상태의 스냅샷
  - ViewModel은 여러 데이터 소스와 사용자 이벤트를 바탕으로 UI State를 생산
  - UI는 그 상태를 받아 그대로 렌더링에 사용
- UDF란?
  - UDF는 Unidirectional Data Flow의 약자로, 데이터는 반드시 단방향으로 흘러야 함을 의미
  - Composable + ViewModel의 구조를 가정하면...
  - 이벤트는 Composable로부터 ViewModel로 올라가야 함
  - 상태는 ViewModel로부터 Composable로 내려가야 함
- `StateFlow`를 ViewModel에서 UI State로 노출하는 이유
  - 항상 최신 값만 가지기 때문에 상태 추적에 용이함
  - 새 구독자도 즉시 최신 값을 받을 수 있음
  - `collectAsStateWithLifecycle`을 사용하여 Android 생명주기에 맞게 구독 가능
  - 순수 Kotlin 기능이라 테스트 하기에 편함
- 화면의 지속 상태와 일회성 이벤트는 어떻게 구분하나요?
  - 지속 상태는 ViewModel에 `StateFlow` 등으로 관리
  - 일회성 이벤트는 `SharedFlow`로 내보내고 `LaunchedEffect`로 받아 처리
- 저장소 패턴
  - 데이터 소스 인터페이스를 추상화하여 상위 기능들이 실제 데이터 소스에 영향받지 않도록 하는 패턴
  - 저장소 패턴을 통해 서버와 로컬 등 데이터 소스가 여러 개여도 단일 인터페이스로 간편히 처리 가능
- UI Layer, Domain Layer, Data Layer의 책임은 어떻게 나누나요?
  - UI 계층은 오직 화면을 그리는 목적에만 집중
  - 도메인 계층은 유스케이스 등 오직 도메인 영역에 국한되는 로직 연산에만 집중
  - 데이터 계층은 데이터를 받아와 앱에서 사용할 수 있는 형태로 처리 및 생산하는 목적에 집중
- 유스케이스 도입 조건
  - UseCase는 모든 기능에 기계적으로 만들 필요는 없음
  - 여러 ViewModel에서 재사용되는 로직이 있거나, Repository 호출만으로 설명하기 어려운 비즈니스 규칙이 있을 때 도입하는 것이 적절함
  - 단순 CRUD 수준이라면 ViewModel이 Repository를 직접 호출해도 충분할 수 있음
- Single Source of Truth(SSOT)란?
  - 진정한 데이터 소스는 반드시 하나여야 함을 의미함
  - 데이터 소스가 여러 개라고 한다면, 둘이 다른 데이터를 내놓을 때 무엇을 믿어야 할지 알 수 없음
  - 따라서 하나의 데이터 소스가 언제나 진실로 간주되는 아키텍처를 구성해야 함
- `rememberSaveable`과 ViewModel은 각각 어떤 상태를 보존하는 데 적합한가요?
  - 전자는 텍스트 필드 입력 값 등 UI 전용 임시 값에 적합
  - 후자는 실제 화면에서 사용되는 데이터에 적합
- Context를 ViewModel에 보관하면 왜 문제가 될 수 있나요?
  - ViewModel은 Configuration 변화 동안 Activity보다 오래 살아남을 수 있음
  - 따라서 ViewModel이 Activity Context나 View 참조를 보관하면, Activity가 destroy된 뒤에도 해당 Activity를 GC하지 못해 메모리 누수가 발생할 수 있음
  - Context가 꼭 필요하다면 Application Context를 사용하거나, UI 작업은 Composable/Activity 쪽에서 처리하고 ViewModel은 이벤트만 노출하는 편이 안전함
- DI 사용 이유
  - 객체 생성 책임을 외부로 분리해 결합도를 낮춤
  - 테스트 시 Mock 데이터를 주입하기 쉬움
- `@Provides`와 `@Binds`의 차이
  - 전자는 Hilt가 생성 방법을 모르는 객체들을 제공해줘야 할 때 사용하며, 그렇기 때문에 해당 객체를 직접 제공하는 코드가 수반되어야 함
  - 후자는 `@Inject constructor()` 등을 통해 Hilt가 생성 방법을 아는 객체들을 제공해줘야 할 때 사용하며, 타입만 알면 충분하기 때문에 추상 함수로 선언함
- 멀티 모듈 아키텍처를 도입한 이유는 무엇인가요?
  - 소프트웨어공학적 측면에서 결합도를 낮추고 응집도를 올려 유지보수성을 높이기 위함
  - 다수가 참여하는 프로젝트에서 모듈을 분리하여 서로의 작업이 미치는 영향을 줄이기 위함
  - 빌드 효율성 측면에서 바뀐 모듈만 빌드하는 Gradle의 Increment Build(증분 빌드)를 활용하기 위함
- 멀티 모듈 구조에서 모듈을 나누는 기준은 무엇인가요?
  - 응집도가 높은 항목끼리 묶음
  - 예를 들어, 네트워크 모듈에는 네트워크 요청을 받고 보내고 처리하는 기능만 포함
  - 각 기능 모듈은 기능별로 특화된 코드와 UI만 포함
  - 등...
- 멀티 모듈에서 의존성 방향은 어떻게 관리해야 하나요?
  - 가능한 단방향으로 흐르게 하는 게 좋음
  - "UI - ViewModel - Model"의 아키텍처를 잊지 말고, 특수한 모듈이 아닌 이상 가능한 이 흐름을 준수하도록 해야 함
  - 순환 의존성을 피하고 구현체가 추상 인터페이스에 의존하도록 방향을 제한해야 함
- 멀티 모듈 아키텍처의 단점은 무엇인가요?
  - 초기 설정 비용 증가
  - 모듈 간 의존성 관리가 어려워질 수 있음
  - 모듈을 어느 정도 선에서 나눌지 결정하는 게 어려움
  - 너무 잘게 나누면 파일 이동과 의존성 추가 비용이 커져 오히려 개발 속도가 느려질 수 있음

---

# DI (Hilt & Dagger)

- DI(dependency injection)의 의미와 중요한 이유?
  - 정의
    DI란 객체가 의존성을 내부에서 생성하는 전통적 방식 대신, 스코프 외부에서 생성 후 필요한 코드에 넣어주는 방식을 의미
  - 중요성
    코드, 컴포넌트, 구성 요소 간 응집도(coupling)를 줄일 수 있기 때문. 한 컴포넌트와 다른 컴포넌트 사이 결합도가 크다면, 하나가 망가졌을 때 다른 하나도 같이 망가지는 불상사가 발생. 그러나 둘을 가능한 분리해 둔다면 하나가 망가져도 다른 하나가 받는 영향이 줄어들며, 테스트 시에도 단위별로 나누기가 편해 용이함.
- Hilt를 통한 DI가 수동 DI에 비해 좋은 점?
  - 효율적인 메모리 관리
    수동 DI를 채택할 경우 개발자가 직접 컴포넌트에 생명 주기에 맞게 생성 및 해제해줘야 하는데, 실수로 까먹고 생명 주기가 끝난 이후에도 메모리에 남아 있는 누수가 발생할 수 있음. 그러나 Hilt 내부에서는 각 모듈을 Android 컴포넌트들의 생명 주기에 맞게 관리해주기 문에, 어려울 수 있는 메모리 관리를 깔끔하게 해 줌.
  - 보일러플레이트 감소
    수동 DI를 하려면 필요한 범위에서 객체를 생성하고 아래로 쭉 넘겨줘야 하는데, 그러면 생성을 위한 코드와 매개변수가 계속 늘어나기 때문에 코드 가독성이 떨어지고 보일러플레이트가 늘어남. Hilt는 어노테이션과 `hiltViewModel()` 함수 등으로 보일러플레이트를 최대한 줄여주기 때문에, 다른 팀원이 코드를 봐야 할 때 더 빨리 핵심 로직을 파악할 수 있게 도움.
- Hilt에서 `@Binds`와 `@Provides`의 차이점
  - Binds는 묶어주다는 의미
    - Hilt가 이미 생성하는 방법을 알고 있는 경우 사용
    - 인터페이스에서 특정 구현체를 직접 연결할 때 사용
    - 본문이 없는 abstract 함수로 작성됨
    - 구현체가 특정되어야 하므로 반드시 제공할 구현체를 매개변수 1개로 넣어줘야 함
    - Hilt가 어차피 만드는 방법을 아니까 개발자가 “둘을 만들어서 묶어줘”라고 지시하는 것으로 이해하면 됨
  - Provides는 제공한다는 의미
    - Hilt가 생성하는 방법을 모르는 외부 라이브러리 등에서 사용
    - 구체적인 구현 방법을 프로그래머가 알려줘야 함
    - 따라서 abstract 함수로 작성할 수 없고 (함수 본문이 반드시 필요하기 때문), `class` 또는 `abstract class` (이 경우는 Provides와 Binds를 한 모듈에서 사용하는 경우임)로 작성
    - 단, `abstract class`로 넣어줄 경우에는 `@Provides` 어노테이션이 붙은 함수들은 `companion object` 블록 안에 넣어서, 클래스(모듈) 수준 변수로 정적 선언해주는 것이 성능상 유리함.
    - 구현체가 상황에 따라 달라질 수 있으므로 경우에 따라 추가적인 매개변수가 들어갈 수 있음
    - Hilt가 만드는 방법을 모르니까 개발자가 “내가 만드는 방법을 구체적으로 제공해줄게”라는 것으로 이해하면 됨
