# ---------- Build stage ----------
    FROM gradle:8.5-jdk17 AS build
    WORKDIR /app
    
    # Gradle 설정 먼저 복사 (캐시 힌트)
    COPY build.gradle settings.gradle ./
    COPY gradle ./gradle
    
    # 소스 복사 & 빌드
    COPY src ./src
    RUN gradle clean bootJar --no-daemon -x test
    
    # ===== 산출물 존재 검증: 없으면 빌드 실패 =====
    RUN echo "== Build outputs ==" && ls -l /app/build/libs && \
        test -f /app/build/libs/app.jar || (echo "FATAL: /app/build/libs/app.jar not found"; exit 1)
    
    # ---------- Runtime stage ----------
    FROM eclipse-temurin:17-jre
    WORKDIR /app

    COPY --from=build /app/build/libs/app.jar /app/app.jar

    EXPOSE 8080

    # ✅ 에이전트를 명시적으로 주입 (JAVA_TOOL_OPTIONS 안 믿고 확정)
    ENTRYPOINT ["java","-javaagent:/otel/javaagent/opentelemetry-javaagent.jar","-jar","app.jar"]