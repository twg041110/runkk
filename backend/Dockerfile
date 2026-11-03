# 1) 빌드용: 코드를 jar 파일로 만듦
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew bootJar -x test --no-daemon \
 && find build/libs -name '*.jar' ! -name '*-plain.jar' -exec cp {} app.jar \;

# 2) 실행용: 만든 jar만 가볍게 실행
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]