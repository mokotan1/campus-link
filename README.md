# Campus Link

Campus Link is a campus collaboration matching service for connecting Daemyeong campus art/video/animation students with Seongseo campus development/planning students.

## Repository Structure

```txt
campus-link/
  frontend/  Next.js, TypeScript, Tailwind CSS
  backend/   Spring Boot, Java, Gradle
  docs/      Planning, DDD, AI task rules
```

## Folder Labels

Each main folder has its own README label:

- `frontend/README.md`: frontend purpose, scripts, and where UI code lives
- `backend/README.md`: backend purpose, Gradle commands, and domain package map
- `docs/README.md`: planning and architecture document map

## Script Map

Run commands from the folder shown in the left column.

| Folder | Command | Purpose |
| --- | --- | --- |
| `frontend` | `npm install` | Install frontend dependencies |
| `frontend` | `npm run dev` | Start Next.js dev server on port 3000 |
| `frontend` | `npm run build` | Build production frontend |
| `frontend` | `npm run lint` | Run frontend lint |
| `backend` | `gradlew.bat bootRun` | Start Spring Boot backend on Windows |
| `backend` | `./gradlew bootRun` | Start Spring Boot backend on macOS/Linux |
| `backend` | `gradlew.bat test` | Run backend tests on Windows |
| `backend` | `./gradlew test` | Run backend tests on macOS/Linux |

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
