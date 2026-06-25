# Development Setup

## Required Tools

- Node.js 24 or compatible LTS version
- npm
- JDK 21
- Git

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```txt
http://localhost:3000
```

Environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

## Backend Setup

Install JDK 21 and make sure this command works:

```bash
java -version
```

Run the backend:

```bash
cd backend
./gradlew bootRun
```

On Windows:

```bat
cd backend
gradlew.bat bootRun
```

The backend runs at:

```txt
http://localhost:8080
```

## Local Environment Variables

Frontend:

```txt
frontend/.env.local
```

Backend:

```txt
backend/.env
```

Do not commit real environment files. Commit only `.env.example`.

## Current Limitation

Java is not installed or not on PATH in the current machine state. The frontend can be generated and checked now, but the backend cannot be run until JDK 21 is installed.
