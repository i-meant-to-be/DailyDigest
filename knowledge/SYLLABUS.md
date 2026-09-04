# 주제 대장

면접에서 다뤄야 할 주제 목록이다. 각 줄에 그 주제를 다루는 문항 ID를 적는다.

**ID가 비어 있는 줄이 커버리지 공백이다.** 지식 파일에 존재조차 하지 않는 주제라서 `unseen` 상태로도 잡히지 않는데, 다이제스트의 `gap` 슬롯이 매 세션 여기서 한 문항을 꺼내 새로 출제한다. 채점이 끝나면 그 문항이 새 ID를 받아 지식 파일에 등록되고 이 줄에 ID가 채워진다. 즉 **다이제스트를 돌릴수록 지식 베이스가 스스로 자란다.**

체크 표시(`[x]` / `[ ]`)는 사람이 읽기 위한 것이고, 스크립트는 줄 끝의 ID 유무만 본다.

---

## cs/os

- [x] 프로세스와 스레드의 차이는 무엇인가요 — OS-001
- [x] 프로세스 스위칭과 스레드 스위칭은 왜 비용이 다른가요 — OS-002
- [x] 병렬성과 동시성의 차이는 무엇인가요 — OS-003
- [x] CPU 스케줄링 알고리즘에는 어떤 것들이 있고 각각 언제 유리한가요 — OS-004
- [x] 교착 상태의 발생 조건 네 가지와 해결 방법은 무엇인가요 — OS-005
- [x] 뮤텍스와 세마포어의 차이는 무엇인가요 — OS-006
- [x] 경쟁 상태란 무엇이며 어떻게 방지하나요 — OS-007
- [x] 가상 메모리가 필요한 이유와 페이지 교체 알고리즘을 설명해 주세요 — OS-008
- [x] 사용자 모드와 커널 모드는 왜 나뉘어 있고, 시스템 콜은 어떻게 동작하나요 — OS-009
- [x] 인터럽트와 폴링의 차이, 그리고 문맥 교환이 실제로 저장하는 것은 무엇인가요 — OS-010
- [ ] 페이지 폴트와 스래싱
- [ ] 프로세스 간 통신 방식
- [ ] 좀비 프로세스와 고아 프로세스
- [ ] 스핀락과 블로킹 락의 차이

## cs/network

- [x] TCP와 UDP는 무엇이고 어떤 차이가 있나요 — NET-001
- [x] TCP 3단 악수를 설명해 주세요 — NET-002
- [x] TCP가 UDP 기반 QUIC으로 대체되는 이유는 무엇인가요 — NET-003
- [x] 주요 HTTP 상태 코드를 설명해 주세요 — NET-004
- [x] OSI 7계층과 각 계층의 역할을 설명해 주세요 — NET-005
- [x] DNS 조회는 어떤 순서로 이루어지나요 — NET-006
- [x] TLS 핸드셰이크 과정과 인증서 검증은 어떻게 이루어지나요 — NET-007
- [x] HTTP/1.1, HTTP/2, HTTP/3는 각각 무엇이 달라졌나요 — NET-008
- [x] REST의 원칙은 무엇이고 실제로 어디까지 지켜지나요 — NET-009
- [x] 쿠키·세션·토큰 기반 인증은 각각 어떻게 다른가요 — NET-010
- [x] HTTP 캐시 헤더는 어떻게 동작하나요 — NET-011
- [x] 모바일 앱에서 네트워크 요청 재시도와 타임아웃은 어떻게 설계해야 하나요 — NET-012
- [x] CORS는 무엇이고 왜 존재하나요 — NET-013
- [ ] 로드 밸런싱 방식
- [ ] WebSocket과 폴링·SSE의 차이
- [ ] 프록시와 CDN의 역할
- [ ] IP 주소와 서브넷, NAT

## cs/data-structures

- [x] 배열과 연결 리스트는 각각 어떤 연산에서 유리하고 불리한가요 — DS-001
- [x] 동적 배열은 어떻게 커지며, 왜 추가 연산의 평균 비용이 O(1)인가요 — DS-002
- [x] 스택과 큐는 각각 어떤 상황에서 쓰나요 — DS-003
- [x] 해시 테이블은 어떻게 동작하며 충돌은 어떻게 처리하나요 — DS-004
- [x] 해시 테이블의 최악 시간 복잡도가 O(n)이 되는 조건은 무엇인가요 — DS-005
- [x] `hashCode`와 `equals`는 왜 같이 재정의해야 하나요 — DS-006
- [x] 이진 탐색 트리의 연산과 시간 복잡도를 설명해 주세요 — DS-007
- [x] 균형 이진 트리가 필요한 이유와 대표적인 구현을 설명해 주세요 — DS-008
- [x] 힙은 어떤 구조이며 우선순위 큐를 어떻게 구현하나요 — DS-009
- [x] 그래프를 인접 행렬과 인접 리스트로 표현할 때의 트레이드오프는 무엇인가요 — DS-010
- [x] 트라이는 어떤 문제에 쓰이며 비용은 얼마나 드나요 — DS-011
- [x] `HashMap`, `LinkedHashMap`, `TreeMap`은 각각 언제 쓰나요 — DS-012
- [x] `ArrayList`와 `LinkedList` 중 실무에서 대개 `ArrayList`를 쓰는 이유는 무엇인가요 — DS-013
- [x] 캐시 지역성이 자료구조 선택에 어떤 영향을 주나요 — DS-014
- [x] 셋과 맵은 내부적으로 무엇이 다른가요 — DS-015
- [x] 불변 자료구조의 장점과 비용은 무엇인가요 — DS-016
- [x] 덱은 무엇이고 어떤 문제에서 유용한가요 — DS-017
- [x] 순환 참조가 생길 수 있는 자료구조에서 메모리 누수를 어떻게 막나요 — DS-018
- [ ] 유니온 파인드
- [ ] LRU 캐시를 직접 구현한다면
- [ ] 세그먼트 트리와 구간 질의
- [ ] 블룸 필터

## cs/algorithms

- [x] 시간 복잡도와 공간 복잡도는 무엇이며 빅오 표기는 무엇을 생략하나요 — ALG-001
- [x] 대표적인 정렬 알고리즘들의 시간 복잡도를 비교해 주세요 — ALG-002
- [x] 퀵 정렬의 최악 시간 복잡도는 언제 발생하며 어떻게 피하나요 — ALG-003
- [x] 정렬의 안정성이란 무엇이고 언제 중요해지나요 — ALG-004
- [x] 병합 정렬과 퀵 정렬 중 무엇을 언제 고르나요 — ALG-005
- [x] 이진 탐색의 전제 조건과 구현에서 자주 나는 실수는 무엇인가요 — ALG-006
- [x] DFS와 BFS의 차이와 각각 어떤 문제에 적합한지 설명해 주세요 — ALG-007
- [x] 최단 경로 알고리즘을 상황에 따라 어떻게 고르나요 — ALG-008
- [x] 동적 계획법은 어떤 문제에 적용할 수 있으며 메모이제이션과 타뷸레이션은 어떻게 다른가요 — ALG-009
- [x] 그리디가 최적해를 보장하려면 어떤 조건이 필요한가요 — ALG-010
- [x] 투 포인터와 슬라이딩 윈도우는 각각 어떤 문제 형태에서 쓰나요 — ALG-011
- [x] 재귀를 반복문으로 바꿔야 하는 상황은 언제인가요 — ALG-012
- [x] 분할 정복의 시간 복잡도는 어떻게 계산하나요 — ALG-013
- [x] 백트래킹과 완전 탐색은 어떻게 다르고 가지치기는 어떻게 하나요 — ALG-014
- [x] 위상 정렬은 무엇이며 어떤 문제에서 등장하나요 — ALG-015
- [x] 문자열 처리에서 자주 쓰는 기법에는 어떤 것이 있나요 — ALG-016
- [x] 비트마스크는 언제 유용한가요 — ALG-017
- [x] 큰 입력에서 시간 초과가 났을 때 어떤 순서로 원인을 찾나요 — ALG-018
- [ ] 최소 신장 트리
- [ ] 파라메트릭 서치
- [ ] 유클리드 호제법과 소수 판정
- [ ] 문자열 매칭 알고리즘

## cs/database

- [x] 인덱스는 왜 조회를 빠르게 하며 어떤 비용을 치르나요 — DB-001
- [x] 인덱스가 있어도 타지 않는 경우는 언제인가요 — DB-002
- [x] B-트리가 데이터베이스 인덱스 구조로 쓰이는 이유는 무엇인가요 — DB-003
- [x] 트랜잭션의 ACID를 각각 설명해 주세요 — DB-004
- [x] 트랜잭션 격리 수준과 각 수준에서 발생하는 이상 현상을 설명해 주세요 — DB-005
- [x] 정규화는 무엇이며 어디까지 하는 것이 적절한가요 — DB-006
- [x] 반정규화는 언제 정당화되나요 — DB-007
- [x] 조인의 종류와 각각의 결과 차이를 설명해 주세요 — DB-008
- [x] N+1 문제는 왜 생기며 어떻게 해결하나요 — DB-009
- [x] 기본 키·외래 키·유니크 제약은 각각 무엇을 보장하나요 — DB-010
- [x] Room에서 마이그레이션은 어떻게 처리하며 실패하면 어떻게 되나요 — DB-011
- [x] Room 쿼리를 `Flow`로 노출할 때 어떤 일이 일어나나요 — DB-012
- [x] 모바일에서 로컬 캐시와 서버 데이터의 동기화 전략은 어떻게 세우나요 — DB-013
- [x] 낙관적 잠금과 비관적 잠금은 각각 언제 쓰나요 — DB-014
- [x] SQL 인젝션은 어떻게 발생하고 어떻게 막나요 — DB-015
- [ ] 커넥션 풀은 왜 필요한가
- [ ] 샤딩과 파티셔닝
- [ ] 실행 계획을 읽는 법
- [ ] NoSQL과 관계형 DB의 선택 기준

## cs/design

- [x] 오버라이드와 오버로딩의 차이는 무엇인가요 — DSG-001
- [x] 클린 아키텍처란 무엇이고 왜 중요한가요 — DSG-002
- [x] SOLID 원칙 다섯 가지를 설명해 주세요 — DSG-003
- [x] MVVM과 MVI는 각각 어떤 구조이고, 어떤 기준으로 고르나요 — DSG-004
- [x] 실제로 자주 쓰는 디자인 패턴을 세 가지만 들고, 각각 어떤 문제를 푸는지 설명해 주세요 — DSG-005
- [x] 의존성 역전 원칙은 실제 코드에서 어떻게 구현되나요 — DSG-006
- [x] 단위 테스트·통합 테스트·UI 테스트는 각각 무엇을 검증하고 비중을 어떻게 가져가야 하나요 — DSG-007
- [x] 테스트하기 좋은 코드는 어떤 특징을 갖나요 — DSG-008
- [x] 결합도와 응집도는 각각 무엇이고, 왜 하나는 낮추고 하나는 높여야 하나요 — DSG-009
- [ ] God 객체는 왜 문제인가
- [ ] 코드 리뷰에서 무엇을 보는가
- [ ] 리팩터링에 착수할 시점을 어떻게 판단하는가
- [ ] 기술 부채를 어떻게 관리하는가

## lang/java-kotlin

- [x] 중위 표기 함수(infix function)란 무엇인가요 — JK-001
- [x] `by` 키워드란 무엇인가요 — JK-002
- [x] `val`과 `var`의 차이는 무엇인가요 — JK-003
- [x] Java와 Kotlin의 차이점은 무엇인가요 — JK-004
- [x] `data class`란 무엇인가요 — JK-005
- [x] `data class` 사용 시 주의할 점은 무엇인가요 — JK-006
- [x] `data class`에서 인스턴스 변수를 `var`이 아닌 `val`로 선언해야 하는 이유는 무엇인가요 — JK-007
- [x] Coroutines에 대해 설명해 주세요 — JK-008
- [x] `coroutineScope`와 `supervisorScope`의 차이는 무엇인가요 — JK-009
- [x] Dispatchers에 대해 설명해 주세요 — JK-010
- [x] ULT와 KLT의 차이점은 무엇인가요 — JK-011
- [x] Coroutines에서 부모-자식 관계와 예외 전파는 어떻게 이루어지나요 — JK-012
- [x] `CompletableDeferred`란 무엇인가요 — JK-013
- [x] 람다 함수란 무엇인가요 — JK-014
- [x] Kotlin의 확장 함수는 어떻게 동작하며 한계는 무엇인가요 — JK-015
- [x] `sealed class`와 `enum class`는 각각 언제 쓰나요 — JK-016
- [x] `inline` 함수와 `reified`는 무엇을 해결하나요 — JK-017
- [x] Kotlin의 스코프 함수 다섯 가지는 각각 언제 쓰나요 — JK-018
- [x] 코루틴 취소는 어떻게 전파되며 협조적 취소란 무엇인가요 — JK-019
- [x] `Flow`의 `map`·`filter` 같은 연산자는 어느 스레드에서 실행되며 `flowOn`은 무엇을 바꾸나요 — JK-020
- [x] JVM의 가비지 컬렉션은 어떻게 동작하나요 — JK-021
- [x] `equals`와 `==`, `===`는 Kotlin에서 각각 무엇을 비교하나요 — JK-022
- [ ] 위임 프로퍼티를 직접 만들려면
- [ ] 어노테이션 프로세서와 KSP
- [ ] Java의 스레드 안전 컬렉션
- [ ] Kotlin Multiplatform의 구조
- [ ] Channel과 Flow는 언제 갈리는가

## lang/c-cpp

- [x] `NULL`과 `nullptr`의 차이점은 무엇인가요 — CPP-001
- [x] C/C++에서 모든 포인터 접근마다 Null을 확인하는 것은 적절한가요 — CPP-002
- [x] 참조자란 무엇인가요 — CPP-003
- [x] 참조자와 포인터의 차이는 무엇인가요 — CPP-004
- [x] 참조자와 포인터 중 무엇을 쓸지 결정하는 기준은 무엇인가요 — CPP-005
- [x] `auto`는 무엇인가요 — CPP-006
- [x] C++ 람다 함수는 어떻게 작성하나요 — CPP-007
- [x] C++에서 스레드 간 공유 자원은 어떻게 보호하나요 — CPP-008
- [x] `std::atomic`은 뮤텍스와 무엇이 다르고 언제 쓰나요 — CPP-009
- [x] 스마트 포인터 세 가지는 각각 어떤 소유권 모델을 표현하나요 — CPP-010
- [x] RAII란 무엇이고 왜 C++에서 중요한가요 — CPP-011
- [x] JNI를 통해 Kotlin과 C++을 오갈 때 주의할 점은 무엇인가요 — CPP-012
- [ ] 이동 의미론과 rvalue 참조
- [ ] 가상 함수와 vtable
- [ ] 메모리 정렬과 패딩
- [ ] 템플릿과 컴파일 시간

## platform/android

- [x] Android의 4대 컴포넌트란 무엇인가요 — AND-001
- [x] `Activity`와 `Fragment`의 차이는 무엇인가요 — AND-002
- [x] `Context`란 무엇이고 종류별로 어떤 차이가 있나요 — AND-003
- [x] 화면 회전으로 Activity가 파괴되는데 ViewModel은 어떻게 살아남나요 — AND-004
- [x] `LiveData`나 `MutableState` 대신 `StateFlow`를 권장하는 이유는 무엇인가요 — AND-005
- [x] `StateFlow`, `Flow`, `SharedFlow`는 각각 어떻게 다른가요 — AND-006
- [x] Android 아키텍처 권장사항에 대해 설명해 주세요 — AND-007
- [x] ViewModel의 역할은 무엇인가요 — AND-008
- [x] UI State란 무엇인가요 — AND-009
- [x] UDF(Unidirectional Data Flow)란 무엇인가요 — AND-010
- [x] ViewModel에서 UI State를 `StateFlow`로 노출하는 이유는 무엇인가요 — AND-011
- [x] 저장소 패턴이란 무엇인가요 — AND-012
- [x] UI Layer, Domain Layer, Data Layer의 책임은 어떻게 나누나요 — AND-013
- [x] 유스케이스는 언제 도입하나요 — AND-014
- [x] Single Source of Truth(SSOT)란 무엇인가요 — AND-015
- [x] `rememberSaveable`과 ViewModel은 각각 어떤 상태를 보존하는 데 적합한가요 — AND-016
- [x] Context를 ViewModel에 보관하면 왜 문제가 될 수 있나요 — AND-017
- [x] 멀티 모듈 아키텍처를 도입한 이유는 무엇인가요 — AND-018
- [x] 멀티 모듈 구조에서 모듈을 나누는 기준은 무엇인가요 — AND-019
- [x] 멀티 모듈에서 의존성 방향은 어떻게 관리해야 하나요 — AND-020
- [x] 멀티 모듈 아키텍처의 단점은 무엇인가요 — AND-021
- [x] Activity의 생명주기 콜백은 어떤 순서로 호출되나요 — AND-022
- [x] ANR은 어떤 조건에서 발생하며 어떻게 예방하나요 — AND-023
- [x] 백그라운드 작업이 필요할 때 WorkManager·Service·Coroutines 중 무엇을 고르나요 — AND-024
- [x] 앱 시작 시간을 줄이려면 무엇을 봐야 하나요 — AND-025
- [x] 메모리 누수는 Android에서 주로 어디서 발생하며 어떻게 찾나요 — AND-026
- [x] ProGuard/R8 난독화가 깨뜨릴 수 있는 코드는 어떤 것인가요 — AND-027
- [x] Navigation 컴포넌트의 백스택 관리 — AND-028
- [ ] 딥링크 처리
- [ ] 런타임 권한 요청 흐름
- [ ] 앱 번들과 동적 기능 모듈
- [ ] Baseline Profile
- [ ] 접근성 대응
- [ ] Configuration 변경 외의 프로세스 종료 복구
- [ ] Gradle 빌드 속도를 줄이는 방법

## platform/compose

- [x] Recomposition은 무엇이고 `remember`는 그 안에서 어떤 역할을 하나요 — CMP-001
- [x] `remember`와 `rememberSaveable`의 차이는 무엇인가요 — CMP-002
- [x] State Hoisting이란 무엇인가요 — CMP-003
- [x] Stateful Composable과 Stateless Composable의 차이는 무엇인가요 — CMP-004
- [x] `collectAsStateWithLifecycle`은 왜 필요한가요 — CMP-005
- [x] `LaunchedEffect`는 무엇인가요 — CMP-006
- [x] `LaunchedEffect`의 키는 왜 중요한가요 — CMP-007
- [x] `DisposableEffect`는 무엇인가요 — CMP-008
- [x] `rememberCoroutineScope`와 `LaunchedEffect`의 차이는 무엇인가요 — CMP-009
- [x] `derivedStateOf`는 언제 사용하나요 — CMP-010
- [x] `rememberUpdatedState`는 무엇인가요 — CMP-011
- [x] `LazyColumn`에서 키를 지정해야 하는 이유는 무엇인가요 — CMP-012
- [x] Compose에서 불필요한 Recomposition을 줄이려면 어떻게 해야 하나요 — CMP-013
- [x] Modifier의 순서가 중요한 이유는 무엇인가요 — CMP-014
- [x] Compose에서 Snackbar나 Navigation 같은 일회성 이벤트는 어떻게 처리하나요 — CMP-015
- [x] Compose 코드에서 UI 로직과 비즈니스 로직을 어떻게 분리하나요 — CMP-016
- [x] Composable 함수의 Skippable과 Stable은 무엇을 의미하나요 — CMP-017
- [x] Compose의 세 단계(Composition, Layout, Drawing)는 각각 무엇을 하나요 — CMP-018
- [x] Compose에서 화면 간 상태를 어떻게 전달하고 복원하나요 — CMP-019
- [x] Compose와 기존 View 시스템을 함께 쓸 때 주의할 점은 무엇인가요 — CMP-020
- [x] Compose UI는 어떻게 테스트하나요 — CMP-021
- [x] 커스텀 레이아웃을 직접 만들려면 — CMP-022
- [ ] 애니메이션 API 선택 기준
- [ ] Compose에서 성능 문제를 어떻게 측정하는가
- [ ] CompositionLocal은 언제 쓰는가

## platform/di

- [x] 의존성 주입이란 무엇이고 왜 중요한가요 — DI-001
- [x] Hilt를 통한 DI가 수동 DI에 비해 좋은 점은 무엇인가요 — DI-002
- [x] Hilt에서 `@Binds`와 `@Provides`의 차이점은 무엇인가요 — DI-003
- [x] Hilt의 컴포넌트 스코프에는 어떤 것들이 있고 각각 언제 쓰나요 — DI-004
- [x] `@Singleton`으로 선언한 객체는 실제로 언제 생성되고 언제 해제되나요 — DI-005
- [x] 멀티 모듈 프로젝트에서 Hilt 모듈은 어디에 두어야 하나요 — DI-006
- [x] Dagger가 컴파일 시점에 의존성 그래프를 검증한다는 것은 무슨 뜻인가요 — DI-007
- [x] 테스트에서 의존성을 가짜 구현으로 바꾸려면 어떻게 하나요 — DI-008
- [x] 같은 타입의 의존성을 여러 개 제공해야 할 때는 어떻게 하나요 — DI-009
- [ ] Assisted Injection이 필요한 경우
- [ ] Hilt 없이 Dagger만 쓸 때의 차이

## platform/security

- [x] Android KeyStore는 무엇을 보장하며 일반 저장소와 무엇이 다른가요 — SEC-001
- [x] 하드웨어 기반 키 저장(TEE, StrongBox)은 소프트웨어 구현과 무엇이 다른가요 — SEC-002
- [x] 액세스 토큰과 리프레시 토큰을 각각 어디에 어떻게 저장해야 하나요 — SEC-003
- [x] OAuth 2.0 인가 코드 흐름을 단계별로 설명해 주세요 — SEC-004
- [x] 모바일 앱에서 PKCE가 필요한 이유는 무엇인가요 — SEC-005
- [x] 대칭키와 비대칭키 암호는 각각 언제 쓰나요 — SEC-006
- [x] AES-GCM에서 IV를 매번 새로 만들어야 하는 이유는 무엇인가요 — SEC-007
- [x] 해시와 암호화의 차이는 무엇이며 솔트는 왜 필요한가요 — SEC-008
- [x] 인증서 고정(Certificate Pinning)은 무엇을 막고 어떤 위험을 만드나요 — SEC-009
- [x] 토큰이 만료됐을 때 재발급과 요청 재시도를 어떻게 설계하나요 — SEC-010
- [x] 루팅된 기기나 디컴파일에 대해 클라이언트가 할 수 있는 것과 할 수 없는 것은 무엇인가요 — SEC-011
- [x] API 키 같은 비밀 값을 앱에 넣어야 할 때 어떻게 다루나요 — SEC-012
- [x] 생체 인증은 어떻게 KeyStore와 연동되나요 — SEC-013
- [x] 앱 서명 키는 어떻게 관리하는가 — SEC-014
- [ ] 로그에 무엇을 남기면 안 되는가
- [ ] ProGuard 규칙과 보안의 관계

## project/hilit

> [Hilit-Android](https://github.com/Team-Hilit/Hilit-Android) — 멀티모듈 준비 · 디자인 시스템 카탈로그 · AI 에이전트 기반

- [x] 멀티모듈에서 Feature를 `api`와 `impl`로 나눈 이유는 무엇인가 — HIL-001
- [x] 별도 `:navigation` 모듈을 만들지 않기로 한 근거는 무엇인가 — HIL-002
- [x] Convention Plugin을 Base·Capability·Composite·Quality로 나눈 기준은 무엇인가 — HIL-003
- [x] 디자인 시스템 카탈로그를 Compose Multiplatform Web/WASM으로 만든 이유는 무엇인가 — HIL-004
- [x] `designsystem`에 Android Framework 의존을 금지한 이유와 그 대가는 무엇인가 — HIL-005
- [x] `@CatalogControls`를 실제 Composable이 아니라 별도 adapter에 붙인 이유는 무엇인가 — HIL-006
- [x] Catalog Controls를 KSP 코드 생성으로 만든 이유와, 손으로 썼다면 무엇이 문제였는가 — HIL-007
- [x] `docs/CONSTITUTION.md`부터 시작하는 문서 권위 순서를 정한 이유는 무엇인가 — HIL-008
- [x] 에이전트 기반 개발에서 아키텍처 계약이 실제로 지켜지는지 어떻게 검증했는가 — HIL-009
- [x] 이 프로젝트에서 가장 후회하는 결정과 가장 잘한 결정은 무엇인가 — HIL-010
- [ ] Feature `impl` 간 직접 의존을 금지하고 다른 Feature의 `api`만 참조하게 한 이유는 무엇인가
- [ ] `catalog:annotations`와 `catalog:processor`를 별도 모듈로 분리한 이유는 무엇인가
- [ ] `app`이 `data`에 의존하는 예외를 컴파일 타임에 강제하려면 어떻게 해야 하는가
- [ ] 공통 build 설정을 `subprojects {}` 대신 Convention Plugin으로 두면 무엇이 달라지는가
- [ ] 전역 Modal과 Toast를 `app` 최상단에서 렌더링하도록 한 이유는 무엇인가
- [ ] Navigation 3를 채택한 이유와 기존 Navigation Compose와 무엇이 다른가
- [ ] MVI에서 Intent·State·Effect를 나누는 기준은 무엇이었는가
- [ ] 오류를 어느 계층에서 무엇으로 변환하도록 정했고 그 근거는 무엇인가
- [ ] AI 에이전트가 읽을 문서를 작업별 필수 읽기 표로 만든 이유는 무엇인가
- [ ] 멀티모듈 도입 이후 빌드 시간은 어떻게 됐고 무엇으로 관리했는가

## project/consensus

> [cau-spd-consensus-fe](https://github.com/i-meant-to-be/cau-spd-consensus-fe) — CI · NDK 채택 · 암호화 모듈

- [x] 동형암호 연산을 서버가 아니라 클라이언트에서 수행하기로 한 이유는 무엇인가 — CNS-001
- [x] C++ 라이브러리를 NDK로 크로스 컴파일할 때 부딪히는 문제를 어떻게 진단하고 우회했는가 — CNS-002
- [x] 병렬 처리 방식을 벤치마크로 고른 과정과 결과는 어땠는가 — CNS-003
- [x] JNI 전역 포인터로 SEAL 컨텍스트를 들고 있을 때의 위험과 대응은 무엇인가 — CNS-004
- [x] CI에서 NDK와 AVD를 캐시하고 계측 테스트를 조건부로 실행한 이유는 무엇인가 — CNS-005
- [x] `BuildConfig`에 구운 비밀 값의 한계는 무엇인가 — CNS-006
- [x] 빌드 타입이나 flavor 대신 `local.properties` 플래그로 개발 모드를 나눈 이유는 무엇인가 — CNS-007
- [x] 이 프로젝트에서 가장 후회하는 결정과 가장 잘한 결정은 무엇인가 — CNS-008
- [ ] 외부 C++ 라이브러리를 소스째 vendoring하는 것과 submodule·prebuilt·FetchContent는 어떻게 다른가
- [ ] JNI 경계에서 값을 바이트 배열로 넘기는 것과 네이티브 핸들을 넘기는 것은 어떻게 다른가
- [ ] JNI에서 C++ 예외와 배열 참조 해제는 어떻게 다뤄야 하는가
- [ ] 동형암호 파라미터는 보안 수준과 곱셈 깊이를 어떻게 저울질해 고르는가
- [ ] Android의 16KB 페이지 크기 전환은 네이티브 라이브러리에 무엇을 요구하는가
- [ ] 네이티브 라이브러리와 JNI가 있는 앱에서 R8을 켜면 무엇을 주의해야 하는가
- [ ] 네이티브 크래시는 어떤 도구로 어떻게 추적하는가

## project/cau-capstone

> [Team-Nine-O-One/frontend](https://github.com/Team-Nine-O-One/frontend) — Proto DataStore 컴포지트 패턴 · Naver Map SDK 직접 사용

- [x] 트리 구조 데이터를 protobuf로 모델링할 때 Leaf와 Group을 어떻게 나누는가 — CAP-001
- [x] 저장소 생성 타입을 도메인 모델로 그대로 쓰면 어떤 문제가 생기는가 — CAP-002
- [x] Proto DataStore를 SharedPreferences·Preferences DataStore·Room 대신 고른 기준은 무엇인가 — CAP-003
- [x] 제3자 래퍼 라이브러리를 걷어내고 공식 SDK를 직접 쓰기로 한 이유는 무엇인가 — CAP-004
- [x] 외부 라이브러리 대신 SDK를 직접 감싸면 무엇을 얻고 무엇을 잃는가 — CAP-005
- [x] 이 프로젝트에서 가장 후회하는 결정과 가장 잘한 결정은 무엇인가 — CAP-006
- [ ] protobuf `lite` 런타임은 무엇을 얻고 무엇을 포기하는가
- [ ] DataStore가 쓰기마다 파일 전체를 다시 쓰는 구조는 언제 문제가 되는가
- [ ] DataStore `Serializer`에서 `CorruptionException`이 던져지면 앱은 어떻게 되는가
- [ ] Naver Maps의 `MapView`와 `MapFragment` 중 무엇을 언제 고르는가
- [ ] `AndroidView`로 감싼 View의 생명주기는 어떻게 연결하고 어떻게 해제하는가
- [ ] `PathOverlay`·`Marker` 같은 명령형 API를 Compose의 선언형 상태와 어떻게 맞추는가
- [ ] `MapView`에 저장된 인스턴스 상태를 넘기지 않으면 무엇이 복원되지 않는가
