# Frontend Folder

This folder contains the Next.js frontend.

## What Belongs Here

- App routes
- UI components
- Feature-specific frontend logic
- API client code
- Page-level state for onboarding, projects, portfolios, and applications

## Main Scripts

Run these commands from `frontend/`.

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Local URL

```txt
http://localhost:3000
```

## Script Meaning

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server |
| `npm run build` | Build production app |
| `npm run lint` | Run ESLint |

## Feature Folder Map

```txt
src/app/                  route-level pages
src/features/onboarding   onboarding UI and logic
src/features/projects     project list/detail/registration UI
src/features/portfolios   portfolio UI and logic
src/features/applications application/proposal status UI
src/features/profile      profile UI and logic
src/shared/components     reusable UI components
src/shared/lib            reusable utilities
src/shared/types          shared TypeScript types
src/shared/constants      shared frontend constants
```

## Environment

Copy the example env file:

```txt
.env.example -> .env.local
```

Do not commit `.env.local`.
