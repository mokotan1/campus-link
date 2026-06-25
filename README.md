# Campus Link

Campus Link is a campus collaboration matching service for connecting Daemyeong campus art/video/animation students with Seongseo campus development/planning students.

## Repository Structure

```txt
campus-link/
  frontend/  Next.js, TypeScript, Tailwind CSS
  backend/   Spring Boot, Java, Gradle
  docs/      Planning, DDD, AI task rules
```

## MVP Goal

Build a working 3-week MVP where a student can:

1. Sign up or log in.
2. Complete onboarding.
3. Register portfolio information.
4. Browse recommended projects.
5. Apply to a project or propose collaboration.
6. Check application status.

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Default URL:

```txt
http://localhost:3000
```

### Backend

Install JDK 21 first.

```bash
cd backend
./gradlew bootRun
```

On Windows:

```bat
cd backend
gradlew.bat bootRun
```

Default URL:

```txt
http://localhost:8080
```

## Development Rule

This project follows domain-driven design. One task should usually touch one bounded context only.

Bounded contexts:

- Identity
- Profile
- Portfolio
- Project
- Application

Read these before development:

- `docs/architecture-ddd.md`
- `docs/ai-task-template.md`
- `docs/feature-slices.md`

## Current Documents

- HTML prototype: `docs/campus-link-ui.html`
- Planning spec: `docs/campus-link-spec.md`
- DDD guide: `docs/architecture-ddd.md`
- AI task template: `docs/ai-task-template.md`
- Feature slices: `docs/feature-slices.md`
