FROM gradle:9-jdk21-alpine AS development
WORKDIR /app
COPY --chown=gradle:gradle . .
EXPOSE 8080
CMD ["gradle", "bootRun"]

FROM gradle:9-jdk21-alpine AS build
WORKDIR /app
COPY --chown=gradle:gradle . .
RUN gradle bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
