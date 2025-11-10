옵저버빌리티 파이프라인 구축 트러블슈팅 및 개선 보고서

본 문서는 Spring Boot 기반 애플리케이션에 OpenTelemetry, ClickHouse, Prometheus를 활용한 풀 스택 옵저버빌리티(Full-Stack Observability) 파이프라인을 구축하는 과정에서 발생한 주요 문제 4가지에 대한 분석 및 해결 과정을 기록합니다.

각 문제에 대한 증거 기반의 접근 방식, 근본 원인 분석, 그리고 재발 방지 설계 방안을 중심으로 서술하였습니다.

1. Issue 1: Collector ↔ ClickHouse 초기 연결 및 기동 순서 문제

1.1. 증상 (Symptom)

otel-collector 컨테이너가 지속적인 재시작 루프에 빠짐.

로그 출력: Unknown setting 'database', connection refused.

1.2. 근본 원인 분석 (Root Cause Analysis)

Configuration Parsing Failure: otel-collector-config.yaml 내 ClickHouse Exporter 설정 시 dsn/?database= 형태를 사용했으나, 사용하는 Collector 버전의 ClickHouse Exporter 옵션 문법과 일치하지 않아 DSN 파싱 오류 발생.

Service Race Condition: ClickHouse 데이터베이스 컨테이너가 완전히 준비되기 전에 otel-collector가 먼저 기동을 시도하여 연결에 실패함. 이는 필수 의존성(ClickHouse)의 준비 상태를 확인하지 않은 채 Collector가 시작되었기 때문입니다.

1.3. 해결 및 재발 방지 (Resolution & Prevention)

구분

내용

개선 효과

Collector 설정

ClickHouse Exporter 설정을 키-값 분리 방식으로 수정하여 파싱 오류를 제거함.

설정의 명시성 확보 및 버전 호환성 문제 회피.

기동 순서 제어

docker-compose.yaml에 ClickHouse 서비스의 **healthcheck**를 추가하여 DB 준비 상태를 검증하고, Collector에 depends_on: service_healthy 옵션을 적용하여 기동 순서를 보장함.

서비스 간 의존성 문제를 근본적으로 해결하고 안정적인 파이프라인 시작을 보장.

수정된 Collector 설정 예시:

exporters:
clickhouse:
endpoint: "tcp://clickhouse:9000"
database: "otel" # 'dsn/?database=' 방식 대신 명시적 키 사용


2. Issue 2: /actuator/* 404 응답 (Prometheus 메트릭 수집 실패)

2.1. 증상 (Symptom)

Prometheus가 Spring Boot 애플리케이션(todo-app) 타깃을 수집하지 못함 (상태 Down).

수동 curl 테스트 결과 /actuator, /actuator/prometheus 엔드포인트에서 404 Not Found 응답.

2.2. 근본 원인 분석 (Root Cause Analysis)

잘못된 빌드 산출물 복사: Dockerfile의 COPY 단계에서 Gradle의 기본 설정(일반 JAR 생성)과 와일드카드(*-SNAPSHOT.jar)를 함께 사용하여, Micrometer/Actuator가 포함되지 않은 Plain JAR이 컨테이너에 복사됨. 특히 Docker 레이어 캐시가 섞이는 환경에서 빌드 시점의 파일 매칭이 불안정해진 것이 문제의 핵심이었습니다. (실제 필요한 파일은 Actuator가 포함된 bootJar였습니다.)

2.3. 해결 및 재발 방지 (Resolution & Prevention)

구분

내용

개선 효과

Gradle 설정

jar 태스크를 비활성화하고, bootJar 태스크가 생성하는 아카이브 파일명을 app.jar로 고정하여 빌드 산출물의 불확실성을 제거함.

빌드 산출물을 단일화하고 파일명을 고정하여 Dockerfile과의 연동을 안정화.

Dockerfile COPY

Dockerfile에서 와일드카드 대신 고정된 파일명 **app.jar**을 명확하게 지정하여 복사 오류를 방지함.

정확한 파일 복사를 보장하여 런타임에 필요한 모든 기능(Actuator 포함)이 포함되도록 함.

적용된 Gradle 설정 (build.gradle):

tasks.named('jar'){ enabled=false }
tasks.named('bootJar'){ archiveFileName="app.jar" }


적용된 Dockerfile COPY:

COPY --from=build /app/build/libs/app.jar /app/app.jar


3. Issue 3: Unable to access jarfile app.jar (컨테이너 실행 실패)

3.1. 증상 (Symptom)

todo-app 컨테이너가 기동 직후 즉시 종료되며 로그에 Unable to access jarfile app.jar 출력.

3.2. 근본 원인 분석 (Root Cause Analysis)

빌드 아티팩트 유실: 런타임 이미지에 /app/app.jar가 복사되지 않았거나, 복사 단계에서 파일명이 잘못 지정되어 런타임 이미지를 구성하는 과정에 문제가 있었음. (Issue 2 해결과정 중 파일명 변경이 완벽히 반영되지 않은 탓)

3.3. 해결 및 재발 방지 (Resolution & Prevention)

구분

내용

개선 효과

빌드 산출물 검증

Dockerfile의 빌드 스테이지 내에서 RUN ls -l /app/build/libs && test -f /app/build/libs/app.jar 명령어를 추가하여 복사 전에 파일 존재 여부를 검증하고, 실패 시 빌드 자체를 중단하도록 설계.

런타임 오류가 빌드 단계에서 조기에 감지되도록 하여 디버깅 비용을 절감.

정확한 COPY 적용

Issue 2에서 확립한 파일명 고정 및 정확한 COPY 명령어를 재확인하여 적용함.

런타임에 필요한 파일의 정확한 경로와 존재를 보장.

4. Issue 4: Java Agent 미장착 (트레이스/로그 데이터 0)

4.1. 증상 (Symptom)

ClickHouse에 otel_logs, otel_traces 테이블은 정상적으로 생성되었으나, count() = 0으로 데이터가 수신되지 않음.

Actuator 엔드포인트 호출만으로는 스팬이 생성되지 않음.

4.2. 근본 원인 분석 (Root Cause Analysis)

Agent 주입 실패: JAVA_TOOL_OPTIONS 환경 변수를 사용하여 OpenTelemetry Java Agent를 주입하려 했으나, 컨테이너 런타임 또는 이미지 구성의 차이로 인해 실제 프로세스의 /proc/1/cmdline 확인 시 -javaagent 인자가 누락되어 있었음.

샘플 트래픽 부족: OpenTelemetry의 기본 설정상 /actuator/* 경로는 트레이싱에서 제외되어 있어, 헬스 체크 엔드포인트 호출만으로는 트레이스 생성을 검증할 수 없었음.

4.3. 해결 및 재발 방지 (Resolution & Prevention)

구분

내용

개선 효과

Agent 강제 주입

JAVA_TOOL_OPTIONS 대신 ENTRYPOINT 명령을 직접 수정하여 -javaagent 인자를 java 실행 명령에 명시적으로 추가함.

에이전트 장착의 성공률을 최대로 높이고 환경 변수 주입 실패 가능성을 제거.

검증 트래픽 추가

트레이스 생성 검증을 위해 일반 비즈니스 로직을 포함하는 엔드포인트 (/hello)를 추가하고 호출하여 스팬 생성을 유도함.

옵저버빌리티 파이프라인의 종단 간(End-to-End) 연결 성공 여부를 확실하게 검증.

적용된 ENTRYPOINT 예시:

ENTRYPOINT ["java", "-javaagent:/otel/javaagent/opentelemetry-javaagent.jar", "-jar", "app.jar"]


5. 최종 상태 점검 및 배운 점

최종 검증 결과

항목

검증 방법

상태

결과

앱 메트릭

curl todo-app:8080/actuator/prometheus

UP

200 OK 응답 확인, Prometheus 타깃 UP

Collector 메트릭

curl otel-collector:8889/metrics

UP

Collector 자체 메트릭 응답 확인

트레이스/로그

ClickHouse에서 SELECT count() FROM otel_traces;

UP

traces=7, logs=26 등 데이터 증가 확인

시각화

Grafana 연결

OK

Prometheus 및 ClickHouse 데이터소스 연결 후 Explore/대시보드에서 데이터 확인 가능

핵심 배운 점 (체크리스트)

영역

교훈 / 재발 방지 체크리스트

빌드 & 배포

1. 빌드 산출물은 bootJar만 생성하고, 파일명을 app.jar 등으로 고정한다.



2. Dockerfile COPY 전에 test -f를 사용하여 산출물 존재를 검증하여 런타임 오류를 조기에 차단한다.

서비스 의존성

1. DB/스토리지 같은 핵심 의존성에는 **healthcheck**를 필수로 추가한다.



2. 의존 서비스 기동 시 **depends_on: service_healthy**를 사용하여 기동 순서를 강제한다.

Configuration

1. OpenTelemetry Collector 설정은 버전별 문서에 따라 최소 설정 및 키 분리(endpoint, database)를 원칙으로 한다.

Agent 주입

1. 환경 변수(JAVA_TOOL_OPTIONS) 대신 **ENTRYPOINT**를 사용하여 -javaagent 인자를 직접 주입하는 것이 가장 확실하고 안전한 방법이다.

검증

1. /actuator/*는 트레이싱에서 제외되므로, 일반 비즈니스 엔드포인트로 샘플 트래픽을 발생시켜 파이프라인 종단 간 연결을 검증한다.



2. 문제 발생 시 docker logs, /proc/1/cmdline 확인, ClickHouse의 count() 쿼리 등 증거 기반으로 각 구간의 데이터 흐름을 추적한다.