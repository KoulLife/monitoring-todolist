# 🧠 옵저버빌리티 파이프라인 구축 트러블슈팅 및 개선 보고서

본 문서는 **Spring Boot 기반 애플리케이션**에 **OpenTelemetry**, **ClickHouse**, **Prometheus**를 활용한  
**풀 스택 옵저버빌리티(Full-Stack Observability)** 파이프라인을 구축하는 과정에서 발생한  
주요 문제 4가지에 대한 분석 및 해결 과정을 기록합니다.

각 문제에 대해 **증거 기반 접근(Evidence-Based Analysis)**, **근본 원인 분석(RCA)**,  
**재발 방지 대책(Preventive Design)**을 중심으로 서술하였습니다.

---

## 🧩 Issue 1: Collector ↔ ClickHouse 초기 연결 및 기동 순서 문제

### 🔍 증상 (Symptom)
- `otel-collector` 컨테이너가 **지속적인 재시작 루프**에 빠짐  
- 로그 메시지:
Unknown setting 'database'
connection refused

markdown
코드 복사

### 🧠 근본 원인 분석 (Root Cause Analysis)
- **Configuration Parsing Failure**  
`otel-collector-config.yaml`에서 ClickHouse Exporter 설정 시 `dsn/?database=` 형식을 사용했으나,  
Collector 버전(0.96.0)의 ClickHouse Exporter 문법과 일치하지 않아 **DSN 파싱 오류** 발생.
- **Service Race Condition**  
ClickHouse 컨테이너가 완전 기동되기 전에 Collector가 먼저 시작되어 연결에 실패.  
즉, Collector가 의존 서비스의 상태를 확인하지 않고 기동된 것이 문제의 핵심.

### ✅ 해결 및 재발 방지 (Resolution & Prevention)

| 구분 | 내용 | 개선 효과 |
|------|------|------------|
| Collector 설정 | ClickHouse Exporter를 **키-값 분리 방식**(`endpoint`, `database`)으로 수정 | 설정 명시성 확보 및 버전 호환성 문제 방지 |
| 기동 순서 제어 | ClickHouse 서비스에 **healthcheck** 추가 후, Collector에 `depends_on: service_healthy` 적용 | Collector가 ClickHouse 기동 후 연결하도록 보장 |

**적용 예시:**
```yaml
exporters:
clickhouse:
  endpoint: "tcp://clickhouse:9000"
  database: "otel"  # 명시적 키 사용
⚙️ Issue 2: /actuator/* 404 응답 (Prometheus 메트릭 수집 실패)
🔍 증상 (Symptom)
Prometheus가 todo-app 타깃을 수집하지 못함 (상태: Down)

curl /actuator, /actuator/prometheus → 404 Not Found

🧠 근본 원인 분석 (Root Cause Analysis)
잘못된 빌드 산출물 복사
Dockerfile의 COPY 단계에서 *-SNAPSHOT.jar 와일드카드를 사용하여
plain.jar (Micrometer/Actuator 미포함)가 컨테이너에 복사됨.
Gradle의 캐시와 산출물 중복으로 인해 올바른 bootJar가 반영되지 않음.

✅ 해결 및 재발 방지 (Resolution & Prevention)
구분	내용	개선 효과
Gradle 설정	jar 비활성화, bootJar 아카이브명 고정(app.jar)	산출물 명확화 및 Dockerfile 연동 안정화
Dockerfile COPY	와일드카드 대신 정확한 파일명(app.jar) 지정	복사 오류 방지, Actuator 포함 보장

적용 예시:

groovy
코드 복사
// build.gradle
tasks.named('jar'){ enabled = false }
tasks.named('bootJar'){ archiveFileName = "app.jar" }
dockerfile
코드 복사
# Dockerfile
COPY --from=build /app/build/libs/app.jar /app/app.jar
🧱 Issue 3: Unable to access jarfile app.jar (컨테이너 실행 실패)
🔍 증상 (Symptom)
todo-app 컨테이너가 즉시 종료됨

로그:

vbnet
코드 복사
Error: Unable to access jarfile app.jar
🧠 근본 원인 분석 (Root Cause Analysis)
빌드 아티팩트 유실
빌드 산출물이 존재하지 않거나, Dockerfile COPY 경로 불일치로 런타임 이미지에 포함되지 않음.
Issue 2의 수정 과정 중 일부 단계가 캐시로 인해 반영되지 않은 것이 원인.

✅ 해결 및 재발 방지 (Resolution & Prevention)
구분	내용	개선 효과
빌드 검증 단계 추가	Dockerfile의 빌드 스테이지에 RUN test -f 명령 추가	빌드 시점에서 산출물 존재 여부 검증
COPY 경로 정정	/app/build/libs/app.jar → /app/app.jar 명확화	런타임 실행 파일 복사 누락 방지

적용 예시:

dockerfile
코드 복사
RUN ls -l /app/build/libs && test -f /app/build/libs/app.jar
COPY --from=build /app/build/libs/app.jar /app/app.jar
☕ Issue 4: Java Agent 미장착 (트레이스/로그 데이터 미수집)
🔍 증상 (Symptom)
ClickHouse에 otel_logs, otel_traces 테이블은 생성되었지만 데이터 count() = 0

Actuator 호출(/actuator/health)만으로는 트레이스가 생성되지 않음

🧠 근본 원인 분석 (Root Cause Analysis)
Agent 주입 실패
JAVA_TOOL_OPTIONS 환경 변수를 통해 OpenTelemetry Agent를 주입했으나,
/proc/1/cmdline 확인 결과 -javaagent 인자가 누락됨 → 런타임 주입 실패.

샘플 트래픽 부재
/actuator/* 경로는 기본적으로 트레이싱 제외 대상 → 트레이스 생성 불가.

✅ 해결 및 재발 방지 (Resolution & Prevention)
구분	내용	개선 효과
Agent 강제 주입	ENTRYPOINT 명령에 -javaagent 인자를 직접 추가	환경 변수 주입 실패 방지, 에이전트 주입 확실화
검증 트래픽 추가	/hello 등 일반 엔드포인트를 호출하여 트레이스 생성	파이프라인 종단 간 검증 가능

적용된 ENTRYPOINT 예시:

dockerfile
코드 복사
ENTRYPOINT ["java", "-javaagent:/otel/javaagent/opentelemetry-javaagent.jar", "-jar", "app.jar"]
✅ 최종 검증 결과
항목	검증 방법	상태	결과
앱 메트릭	curl todo-app:8080/actuator/prometheus	✅ UP	Prometheus 타깃 UP
Collector 메트릭	curl otel-collector:8889/metrics	✅ UP	Collector 메트릭 확인
트레이스/로그	ClickHouse SELECT count() FROM otel_traces;	✅ UP	traces=7, logs=26
시각화	Grafana Explore & Dashboard	✅ OK	Prometheus/ClickHouse 모두 연동 성공

🧭 핵심 교훈 (재발 방지 체크리스트)
영역	교훈 / 예방 조치
빌드 & 배포	① bootJar만 빌드, 파일명 고정 (app.jar)
② Dockerfile COPY 전 test -f로 산출물 존재 검증
서비스 의존성	① 모든 핵심 서비스(DB, ClickHouse)에 healthcheck 추가
② Collector는 depends_on: service_healthy로 기동 순서 보장
Configuration	① Collector 설정은 버전별 문법 준수
② ClickHouse exporter는 endpoint, database를 분리 지정
Agent 주입	① 환경 변수 대신 ENTRYPOINT에 직접 -javaagent 추가
② /proc/1/cmdline로 실제 주입 여부 확인
검증 프로세스	① /actuator/*는 트레이싱 제외이므로 일반 API 호출로 샘플 트래픽 유도
② docker logs, ClickHouse count(), Collector 로그로 증거 기반 분석 수행
