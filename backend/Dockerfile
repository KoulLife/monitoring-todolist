# ---------- Build stage ----------
    # JDK 17이 들어있는 공식 이미지로 빌드용 스테이지 시작. 이름은 build
    FROM gradle:8.5-jdk17 AS build
    # 컨테이너 내부 작업 디렉터리를 /app으로 설정
    WORKDIR /app

    # build.gradle 파일 목사해서, 소스 변경 시에도 캐시 최대한 재사용
    COPY build.gradle settings.gradle ./
    # gradle wrapper 디렉터리 복사
    COPY gradle ./gradle

    # 애플리케이션 소스 코드를 컨테이너로 복사
    COPY src ./src
    # 스프링부트 실행 JAR을 만든다.
    RUN gradle clean bootJar --no-daemon -x test

    # /app/build/libs/app.jar 파일이 실제로 존재하는지 검사
    RUN echo "== Build outputs ==" && ls -l /app/build/libs && \
        test -f /app/build/libs/app.jar || (echo "FATAL: /app/build/libs/app.jar not found"; exit 1)

# ---------- Runtime stage ----------
    # 경량 자바 런타임 이미지 사용
    FROM eclipse-temurin:17-jre
    # 컨테이너 내부의 작업 디렉토리를 /app으로 지정
    WORKDIR /app

    # 빌드 된 jar vkdlf qhrtk
    COPY --from=build /app/build/libs/app.jar /app/app.jar

    # 8080 포틔 외부로 개방
    EXPOSE 8080

    # OpenTelemetry Java Agent를 주입
    ENTRYPOINT ["java","-javaagent:/otel/javaagent/opentelemetry-javaagent.jar","-jar","app.jar"]