## docker-compose.yml
### 1. gRPC vs HTTP (OTLP 전송 프로토콜 차이)

OpenTelemetry Collector는 OTLP(OpenTelemetry Protocol) 로 데이터를 받음.
이 OTLP는 두 가지 형태로 동작:

| 구분              | OTLP/gRPC (`4317`)              | OTLP/HTTP (`4318`)           |
| --------------- | ------------------------------- | ---------------------------- |
| **프로토콜 계층**     | gRPC (HTTP/2 기반 바이너리)           | 순수 HTTP/1.1 또는 HTTP/2 + JSON |
| **전송 효율성**      | ✅ 매우 빠름 — 바이너리, 멀티플렉싱 지원        | ❌ 느림 — 텍스트 기반(JSON), 오버헤드 큼  |
| **커넥션 관리**      | 장기 연결(Persistent connection) 유지 | 요청마다 새 연결(Request/Response)  |
| **스트리밍 지원**     | 가능 (양방향 스트림 등)                  | 불가능 (요청-응답 단발성)              |
| **보안 전송 (TLS)** | 기본적으로 지원                        | 지원 가능 (HTTPs)                |
| **사용 환경**       | 서버-서버 / 에이전트-Collector 간 통신     | 단순 툴, 테스트, 제한된 환경에서 사용       |
| **포트 기본값**      | 4317                            | 4318                         |

<br/>

**언제 HTTP를 사용하는가:**
- gRPC를 지원하지 않는 환경일 떄

___

### 2. Collector가 설정 파일을 “임의로 수정”하는 경우
```json
volumes:
  - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml:ro
```

- 컨테이너 내부에서 쉘로 들어가 편집하거나 잘못된 명령으로 파일을 덮어쓰는 걸 예방
- 자동화 툴 오작동 차단	일부 배포 스크립트나 사이드카 에이전트가 /etc 경로에 파일을 쓸 수 있는데, 이를 방지

___

### 3. Grafana 부팅 시 ClickHouse 데이터소스 플러그인을 설치는 필수인가? 그리고 왜 하는가?
```json
environment:
  - GF_INSTALL_PLUGINS=grafana-clickhouse-datasource
```
- Grafana는 ClickHouse를 인식하지 못함
- 수동으로 접근하여 플러그인 설치해야 함
- 프로메테우스는 내장이기에 따로 설치가 필요 없음

___

### 4. docker-compose.yaml은 순서가 상관 없는가?
```json
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"  # Prometheus 실행 시 설정 파일 경로를 명시적으로 지정
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro  # 설정파일을 컨테이너에 마운트
```

**나의 생각**
- 볼륨이 우선 마운트 되고, 커맨드가 실행 되어야 함.
- 그렇다면 볼륨이 위로 올라가야 하는 것 아닌가?

**실제 작동**
- 순서 무관함
- 컨테이너 생성 시점 -> 볼륨 마운팅
- 마운트 완료 후 -> 커맨드 실₩

___

### 5. ICKHOUSE_DEFAULT_ACCESS_MANAGEMENT=1 — 실무에서는 어떻게 하는가?

| 항목      | 설명                                                            |
| ------- | ------------------------------------------------------------- |
| 0 (기본값) | **비활성화** — root(=default) 계정으로 모든 쿼리 수행 가능                    |
| 1       | **활성화** — `CREATE USER`, `GRANT`, `REVOKE` 가능. 계정 기반 권한 관리 가능 |

| 환경             | 권장 설정   | 이유                                        |
| -------------- | ------- | ----------------------------------------- |
| **개발/로컬 환경**   | ❌ 끔 (0) | 단순히 실험용이라 권한 관리 불필요                       |
| **운영/스테이징 환경** | ✅ 켬 (1) | 보안상 필수 — Grafana, Collector, Admin 계정을 분리 |

```db2
CREATE USER grafana_user IDENTIFIED WITH plaintext_password BY 'grafana_pw';
GRANT SELECT ON otel.* TO grafana_user;

CREATE USER collector_user IDENTIFIED WITH plaintext_password BY 'collector_pw';
GRANT INSERT ON otel.* TO collector_user;
```
- Collector는 INSERT만, Grafana는 SELECT만 가능.
- 즉, 데이터 손상 위험을 차단 가능.

___

### 6. 실무에서는 Clickhouse가 언제 unhelathy 될 가능성이 큰가?

| 원인              | 설명                                   |
| --------------- | ------------------------------------ |
| **DB 기동 지연**    | ClickHouse가 대용량 데이터 복구 중일 때          |
| **포트 충돌**       | 8123 포트를 다른 프로세스가 이미 사용 중            |
| **저장소 손상**      | `/var/lib/clickhouse` 내 데이터 파티션 손상   |
| **디스크 full**    | `no space left on device` 로 DB 기동 실패 |
| **네트워크 지연/방화벽** | HTTP 요청 자체가 실패 (`wget` timeout)      |

___

### 7. 데이터 흐름 전체 구조

```json
[App]  --(OTLP/gRPC or OTLP/HTTP)-->  [OpenTelemetry Collector]
                                              │
                                              ▼
                                     --(HTTP)--> [ClickHouse]
                                              │
                                              ▼
                                     --(HTTP API)--> [Grafana Plugin]

```

| 구간                           | 전송 프로토콜                         | 설명                                                                                   |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| **① App → Collector**        | **OTLP/gRPC** (기본) 또는 OTLP/HTTP | OpenTelemetry Protocol(OTLP)로 데이터를 전송. <br> 대부분 gRPC(4317)를 사용 — 빠르고 연결 유지 가능        |
| **② Collector → ClickHouse** | **HTTP** (8123)                 | Collector의 ClickHouse Exporter가 ClickHouse의 HTTP API를 호출 (`POST /?query=INSERT ...`) |
| **③ Grafana → ClickHouse**   | **HTTP** (8123)                 | Grafana의 ClickHouse 플러그인도 ClickHouse HTTP API를 통해 쿼리 실행 (`SELECT ...`)               |

- Collector의 입력(Receiver)은 gRPC 기반
- Collector의 출력(Exporter)은 HTTP 기반

___

### 8. OTEL의 EXPORTER 설정

| 설정 값      | 의미                              | 설명                                  |
| --------- | ------------------------------- | ----------------------------------- |
| `otlp`    | OpenTelemetry Protocol Exporter | Collector, Tempo, NewRelic 등과 통신 가능 |
| `logging` | 콘솔 출력용 Exporter                 | 디버깅용                                |
| `none`    | 비활성화                            | 데이터 전송 안 함                          |

**실무에서 자주 쓰는 패턴**

| 환경                        | 설정             | 이유                             |
| ------------------------- | -------------- | ------------------------------ |
| **개발 환경**                 | `otlp,logging` | Collector로 전송 + 콘솔에서 즉시 확인 가능  |
| **운영 환경**                 | `otlp`         | 불필요한 콘솔 출력 제거, Collector로만 전송  |
| **로컬 테스트 (Collector 없음)** | `logging`      | Collector 연결 없이도 Trace를 볼 수 있음 |


___

### 9. Sampler는 “Processor 안에서” 작동되는가?

```json
┌────────────────────────────────────────┐
│            Application Code            │
│      (예: HTTP 요청, DB 쿼리 등)      │
└────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│         OpenTelemetry SDK              │
│                                        │
│  1️⃣ Sampler (ShouldSample?)           │ ← 여기서 수집 여부 결정
│  2️⃣ Span Processor (Batch, Simple)    │ ← 실제 Export 전 버퍼링/가공
│  3️⃣ Exporter (OTLP, Logging, etc.)    │ ← Collector 등 외부로 전송
└────────────────────────────────────────┘

```

## datasources.yaml (GRAFANA)
### 1. proxy = Grafana 서버가 직접 Prometheus에 요청 → “PULL” 방식인가?
여기서 말하는 proxy는 HTTP 요청 경로(클라이언트 ↔ 서버) 를 의미하고, Prometheus의 Pull/Push 메트릭 수집 방식과는 다른 개념
- Grafana가 Prometheus 데이터를 불러오는 통신 방식
- Prometheus가 메트릭을 “수집(Pull)”하는 방식과는 별개

___

### 2. access 옵션의 다른 설정 값들

| 값          | 설명                        | 특징                      |
| ---------- | ------------------------- | ----------------------- |
| **proxy**  | Grafana 서버가 직접 요청 (서버사이드) | ✅ 일반적이고 안전함             |
| **direct** | 사용자의 브라우저가 데이터소스로 직접 요청   | ❌ CORS 문제 많음, 내부망 접근 불가 |

- direct 모드는 거의 쓰지 않음
브라우저에서 Prometheus나 ClickHouse에 직접 요청하면, 보안 이슈(CORS, 인증, 방화벽)로 막히는 경우가 대부분

___

### 3. 기본값을 프로메테우스로 하는가?

```json
isDefault: true 
```

**실무에서는 기본 데이터소스를 Prometheus로 설정하는 경우가 가장 많음.**

Prometheus가 관측 스택의 중심(metrics hub) 역할을 하기 때문

| 이유                                                  | 설명                                                           |
| --------------------------------------------------- | ------------------------------------------------------------ |
| ✅ **Grafana 기본 내장 플러그인**                            | Grafana는 Prometheus를 **core datasource**로 포함하고 있어, 별도 설치 불필요 |
| ✅ **대부분의 대시보드 템플릿이 Prometheus 기반**                  | Grafana.com에 올라온 공식/커뮤니티 대시보드의 70~80%가 Prometheus용           |
| ✅ **Metric 중심 워크플로우의 시작점**                          | 장애, 성능, 지표 알림(alerting)은 대부분 메트릭 기반으로 시작                     |
| ✅ **OpenTelemetry / Spring Actuator / K8s와의 기본 통합** | Prometheus 포맷(`/metrics`)이 업계 표준 디폴트로 자리잡음                   |
| ✅ **Alertmanager / Rule System과 연계**                | Grafana Alert나 Prometheus Rule 모두 동일 쿼리 언어(PromQL) 사용        |

## prometheus.yaml (PROMETHEUS)
### 1. Prometheus → Grafana 데이터 전송 방식은 “PULL / PUSH”가 아니다

- Grafana는 Prometheus의 데이터를 “조회(Query)”만 함.
- 즉, Prometheus → Grafana 간에는 데이터 전송이 일어나지 않음.

___

### 2. Spring Boot의 /actuator/prometheus는 모든 메트릭을 노출하는 엔드포인트

- Spring Boot는 /actuator/prometheus 경로에서 앱 내부의 모든 메트릭을 노출
- Prometheus는 이 경로로 HTTP GET 요청을 보내서 메트릭 데이터를 수집

Spring Boot Actuator가 애플리케이션의 다양한 컴포넌트 메트릭을 자동 수집

| 범주      | 예시                                                                       |
| ------- | ------------------------------------------------------------------------ |
| HTTP 요청 | `http_server_requests_seconds_count`, `http_server_requests_seconds_sum` |
| JVM     | `jvm_memory_used_bytes`, `jvm_gc_pause_seconds_count`                    |
| 시스템     | `process_cpu_usage`, `system_cpu_count`                                  |
| 데이터베이스  | `jdbc_connections_active`, `hikaricp_connections_max`                    |
| 사용자 정의  | `@Timed`, `@Counted`, `MeterRegistry` 등을 통해 직접 추가 가능                     |

**Spring Boot에서 필요한 의존성(Dependency)**

```json
dependencies {
implementation 'org.springframework.boot:spring-boot-starter-actuator'      // Actuator
implementation 'io.micrometer:micrometer-registry-prometheus'                // Prometheus Exporter
}
```

```json
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  endpoint:
    prometheus:
      enabled: true
  metrics:
    tags:
      application: todo-app   # (선택) 애플리케이션 이름 태그 추가
```














