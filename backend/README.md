# Backend Folder

This folder contains the Spring Boot backend.

## What Belongs Here

- REST APIs
- Domain rules
- Database access
- Supabase/PostgreSQL integration
- Application and proposal status logic

## Main Scripts

Run these commands from `backend/`.

### Windows

```bat
gradlew.bat bootRun
gradlew.bat test
gradlew.bat build
```

### macOS/Linux

```bash
./gradlew bootRun
./gradlew test
./gradlew build
```

## Local URL

```txt
http://localhost:8080
```

## Required Tool

Install JDK 21 and set `JAVA_HOME`.

Check:

```bash
java -version
```

## Domain Package Map

```txt
src/main/java/com/campuslink/backend/
  identity/     authentication and school verification
  profile/      onboarding, roles, tools, availability
  portfolio/    work samples and external links
  project/      recruitment projects and filters
  application/  applications, proposals, status
  common/       shared code with no domain ownership
```

## Environment

Copy the example env file when local secrets are needed:

```txt
.env.example -> .env
```

Do not commit `.env`.
